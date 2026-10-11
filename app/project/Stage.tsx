import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';

import { track } from '~/lib/analytics';
import { prefersReducedMotion } from '~/lib/motion';

import { ASKS, CODE, DECK, FLOATS, HOME, MODELS, NATIVE, RUN, SAID, SAYS, STORED, type Press } from './data';
import s from './Stage.module.css';

/**
 * Counts up while the stage is on the page. With reduced motion, or once the visitor has taken
 * over (`held`), it stays where it is.
 */
function useTick(pace: number, from = 0, held = false): number {
  const [tick, setTick] = useState(from);
  useEffect(() => {
    if (held || prefersReducedMotion()) return;
    // A tab in the background does not need the show.
    const next = () => !document.hidden && setTick((before) => before + 1);
    // The first move comes soon after the page opens, so nobody scrolls past a still picture.
    const first = window.setTimeout(next, Math.min(pace, 650));
    const timer = window.setInterval(next, pace);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [pace, held]);
  return tick;
}

const at = (vars: Record<string, string | number>) => vars as CSSProperties;

const LANGUAGES = Object.keys(CODE);
const BUTTONS = ['Step over', 'Step in', 'Step out', 'Continue'] as const;
const WORDS: Press[] = ['step_over', 'step_in', 'step_out', 'continue'];
const LAST = RUN.length - 1;
// The run, then a short rest on its last line before the next language takes over.
const TURN = RUN.length + 2;

/** Where a button lands from a step: over stays at this depth, out goes up one, continue runs to the end. */
function land(step: number, button: number): number {
  if (step >= LAST) return 0;
  if (button === 1) return step + 1;
  if (button === 3) return LAST;
  const here = RUN[step].deep;
  const next = RUN.findIndex((frame, i) => i > step && (button === 0 ? frame.deep <= here : frame.deep < here));
  return next === -1 ? LAST : next;
}

/**
 * OmniCompiler: one debugger window. It plays by itself, a language at a time, until you press
 * a tab or a button. Then it is yours: the buttons step the real run, in the language you chose.
 */
function Omni() {
  const [mine, setMine] = useState<{ lang: string; step: number; pressed: number } | null>(null);
  const tick = useTick(620, 4, mine !== null);
  const auto = Math.min(tick % TURN, LAST);
  const lang = mine?.lang ?? LANGUAGES[Math.floor(tick / TURN) % LANGUAGES.length];
  const step = mine?.step ?? auto;
  const frame = RUN[step];
  const before = RUN[Math.max(step - 1, 0)];
  // The button that brought the run to this line.
  const pressed = mine ? mine.pressed : step === 0 ? -1 : frame.deep > before.deep ? 1 : frame.deep < before.deep ? 2 : 0;
  const take = (next: { lang: string; step: number; pressed: number }) => {
    if (!mine) track('stage_used', { project: 'omnicompiler' });
    setMine(next);
  };

  return (
    <div className={s.omni} data-mine={mine ? '' : undefined}>
      <div className={s.tabs} role="group" aria-label="Language">
        {LANGUAGES.map((name) => (
          <button key={name} type="button" aria-pressed={name === lang} onClick={() => take({ lang: name, step, pressed: -1 })}>
            {name}
          </button>
        ))}
      </div>
      <div className={s.editor}>
        <ol className={s.code} aria-label={`The program, in ${lang}`}>
          {CODE[lang].map((text, i) => (
            <li key={i} data-at={i === frame.line || undefined}>
              <code>{text}</code>
            </li>
          ))}
        </ol>
        <div className={s.seen} data-seen>
          <span>{frame.deep ? 'inside area()' : 'at the top'}</span>
          {frame.seen.map(([name, value]) => (
            // Keyed by the value, so a number that changes comes in new.
            <p key={`${name} ${value}`}>
              {name}
              <b>{value}</b>
            </p>
          ))}
        </div>
      </div>
      <div className={s.controls}>
        {BUTTONS.map((name, i) => (
          <button
            key={i === pressed ? `${name} ${step}` : name}
            type="button"
            data-on={i === pressed || undefined}
            onClick={() => take({ lang, step: land(step, i), pressed: i })}
          >
            {name}
          </button>
        ))}
        {/* The page said one word. This is what the real debugger of this language was told. */}
        <em data-native>
          <b key={lang}>{NATIVE[lang]}</b> hears <code key={`${lang} ${pressed}`}>{SAYS[lang][WORDS[Math.max(pressed, 0)]]}</code>
        </em>
      </div>
    </div>
  );
}

const RANKS = [
  { key: 'pass', title: 'Tasks passed', show: (n: number) => `${n}%` },
  { key: 'perHour', title: 'Right answers per hour', show: (n: number) => n.toLocaleString('en') },
] as const;

/** Local LLM lab: the same five models, ranked by one number and then by the other. They change places. */
function Lab() {
  const [mine, setMine] = useState<number | null>(null);
  const tick = useTick(3600, 0, mine !== null);
  const by = RANKS[mine ?? tick % 2];
  const top = Math.max(...MODELS.map((model) => model[by.key]));
  const order = [...MODELS].sort((a, b) => b[by.key] - a[by.key]);

  return (
    <div className={s.lab}>
      <p className={s.by}>
        <span>Ranked by</span>
        {RANKS.map((rank, i) => (
          <button
            key={rank.key}
            type="button"
            aria-pressed={rank === by}
            onClick={() => {
              if (mine === null) track('stage_used', { project: 'local-llm-lab' });
              setMine(i);
            }}
          >
            {rank.title}
          </button>
        ))}
      </p>
      <ol className={s.board} data-board>
        {MODELS.map((model) => {
          const place = order.indexOf(model);
          return (
            <li key={model.name} data-first={place === 0 || undefined} data-place={place + 1} style={at({ '--place': place, '--share': model[by.key] / top })}>
              <span>{place + 1}</span>
              <strong>{model.name}</strong>
              <i />
              <b>{by.show(model[by.key])}</b>
            </li>
          );
        })}
      </ol>
      <p className={s.moral}>
        Same five models. Two different winners. <span>For agent work a third one won: the Qwen.</span>
      </p>
    </div>
  );
}

// The home page, then one app after the other, the way a hand goes through them.
const TOUR = [null, 0, null, 3, null, 2, null, 4, null, 6, null, 11, null, 8];

/** Prats-Deck: the deck itself, large. It goes through its apps until you tap it. Then you drive. */
function Deck() {
  const [mine, setMine] = useState<{ app: number | null } | null>(null);
  const tick = useTick(1700, 0, mine !== null);
  const app = mine ? mine.app : TOUR[tick % TOUR.length];
  const [name, about, picture] = app === null ? ['Home', 'Fifteen apps, five across and three down. Tap one.', 'home'] : DECK[app];
  const tap = (next: number | null) => {
    if (!mine) track('stage_used', { project: 'prats-deck' });
    setMine({ app: next });
  };

  return (
    <div className={s.deck}>
      <div className={s.unit}>
        <div className={s.glass} data-screen={picture}>
          {/* Every picture is there from the start, so a change of app never waits for a download. */}
          {['home', ...DECK.map((item) => item[2])].map((shot) => (
            <img key={shot} src={`/deck/${shot}.webp`} width={640} height={480} alt="" loading="lazy" data-on={shot === picture || undefined} />
          ))}
          {app === null ? (
            DECK.map(([label], i) => (
              <button
                key={label}
                type="button"
                className={s.icon}
                style={{ left: `${(i % 5) * 20}%`, top: `${22.5 + Math.floor(i / 5) * 25.8}%` }}
                onClick={() => tap(i)}
                aria-label={`Open ${label}`}
              />
            ))
          ) : (
            <button type="button" className={s.back} onClick={() => tap(null)} aria-label="Back to the home page" />
          )}
        </div>
        <i className={s.cable} aria-hidden="true" />
      </div>
      <p className={s.onScreen} aria-live="polite" data-on-screen>
        <span>On the screen</span>
        <strong key={name}>{name}</strong>
        <em key={about}>{about}</em>
        <small>Real pictures, from the simulator that runs the code of the deck on a PC.</small>
      </p>
    </div>
  );
}

// Eight frames of a clip. The handles close in on the part to keep, and the rest is cut away.
const FRAMES = [34, 52, 44, 66, 58, 72, 48, 38];
const CUTS = [
  { from: 0, to: 8, says: 'the whole clip, 16 s' },
  { from: 1, to: 8, says: 'drag the first handle' },
  { from: 2, to: 7, says: 'then the second' },
  { from: 2, to: 6, says: 'keep 4 s to 12 s' },
  { from: 2, to: 6, says: 'cut' },
  { from: 2, to: 6, says: 'cut' },
];

/** Scrub: a strip of frames, two handles, and the command that the handles write. */
function Scrub() {
  const tick = useTick(1100, 3) % CUTS.length;
  const cut = CUTS[tick];
  const done = tick >= 4;
  return (
    <div className={s.scrub} role="img" aria-label="Two handles close in on a strip of video frames, and the command for the cut is written under it.">
      <div className={s.strip} aria-hidden="true" style={at({ '--from': cut.from, '--to': cut.to })} data-done={done || undefined}>
        {FRAMES.map((shade, i) => (
          <i key={i} data-out={i < cut.from || i >= cut.to || undefined} style={at({ '--shade': `${shade}%` })} />
        ))}
        <b />
        <b />
      </div>
      <p className={s.command} aria-hidden="true">
        <span>the command, before it runs</span>
        <code>
          ffmpeg -ss <mark key={cut.from}>{cut.from * 2}</mark> -to <mark key={cut.to}>{cut.to * 2}</mark> -i clip.mp4 out.mp4
        </code>
      </p>
      <p className={s.caption} aria-hidden="true">
        {cut.says}
      </p>
    </div>
  );
}

// What lands in a Downloads folder, and the pile each one belongs in.
const FILES = [
  ['setup_v2.exe', 0],
  ['report.pdf', 1],
  ['photos.zip', 2],
  ['report (1).pdf', 1],
  ['driver_installer.exe', 0],
  ['movie.mp4.crdownload', 2],
  ['report (2).pdf', 1],
  ['photos', 2],
  ['launcher_setup.msi', 0],
] as const;
const PILES = ['Installers you ran once', 'The same file, three times', 'Left behind'];

/** Neat: a messy folder, and then the same files in three tidy piles. */
function Neat() {
  const tidy = useTick(2800, 1) % 2 === 1;
  const seat = [0, 0, 0];
  return (
    <div className={s.neat} role="img" aria-label="Nine files in a messy pile sort themselves into three groups: installers, copies of the same file, and things left behind." data-tidy={tidy || undefined}>
      <div className={s.piles} aria-hidden="true">
        {PILES.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <ul className={s.files} aria-hidden="true">
        {FILES.map(([name, pile], i) => {
          const row = seat[pile]++;
          return (
            <li
              key={name}
              style={at({
                '--mx': `${4 + ((i * 37) % 52)}%`,
                '--my': `${6 + ((i * 53) % 66)}%`,
                '--turn': `${((i * 47) % 31) - 15}deg`,
                '--pile': pile,
                '--row': row,
                '--i': i,
              })}
            >
              {name}
            </li>
          );
        })}
      </ul>
      <p className={s.caption} aria-hidden="true">
        {tidy ? 'moved, not deleted. Each one can be put back' : 'Downloads, on a normal day'}
      </p>
    </div>
  );
}

// The two questions that come back as a picture: a line through the year, and a map of the floats.
const ASKED = [ASKS[0], ASKS[2]];

/** FloatChat: one question, start to end. It is asked, the model picks a tool, and a picture comes back. */
function Float() {
  const tick = useTick(1500, 2);
  const ask = ASKED[Math.floor(tick / 5) % ASKED.length];
  // Asked, then the tool, then the answer, which stays up for two beats.
  const step = tick % 5;
  const line = ask.values?.map((value, i) => `${12 + i * 16},${92 - value * 1.35}`).join(' ');

  return (
    <div className={s.float} role="img" aria-label="A question about the sea is asked in plain words. The model picks a tool, the tool runs a real query, and a chart or a map comes back.">
      <p className={s.ask} aria-hidden="true" key={ask.q}>
        <span>You ask</span>
        <strong>{ask.q}</strong>
      </p>
      <p className={s.pick} aria-hidden="true" data-on={step >= 1 || undefined}>
        <span>It picks a tool</span>
        <code>{ask.picks}</code>
        <em>{ask.rows}, from the float data</em>
      </p>
      <div className={s.answer} aria-hidden="true" data-on={step >= 2 || undefined}>
        <span>You get</span>
        <svg viewBox="0 0 200 96">
          {line ? (
            <polyline className={s.trace} points={line} pathLength={100} />
          ) : (
            FLOATS.map((float, i) => <circle key={i} className={s.spot} cx={float.x} cy={float.y} r="2.6" style={at({ '--i': i })} />)
          )}
        </svg>
        <em>{ask.a}</em>
      </div>
    </div>
  );
}

const DESK_FOR: Record<string, string> = { Video: 'Grievance', Voice: 'Loans', Typed: 'Operations' };

/** iDEA: one visit, in three steps. A face at the door, the thing said, and the desk it lands on. */
function Idea() {
  const tick = useTick(1400, 3);
  const said = SAID[Math.floor(tick / 5) % SAID.length];
  const step = tick % 5;

  return (
    <div className={s.idea} role="img" aria-label="A customer logs in with a face check, says what is wrong by video, voice or typing, and it goes to the right department of the bank.">
      <div className={s.door} aria-hidden="true">
        <span>1. Log in</span>
        {/* A face in a frame, with the line of a scan going down it. */}
        <svg viewBox="0 0 100 100" key={said.how}>
          <path className={s.corners} d="M8 26 V8 H26 M74 8 H92 V26 M92 74 V92 H74 M26 92 H8 V74" />
          <circle className={s.head} cx="50" cy="40" r="15" />
          <path className={s.head} d="M22 84 C 24 62, 76 62, 78 84 Z" />
          <path className={s.sweep} d="M12 20 H88" />
        </svg>
        <em>a password, then your face</em>
      </div>
      <div className={s.say} aria-hidden="true" data-on={step >= 1 || undefined}>
        <span>2. Say it your way</span>
        <p>
          {SAID.map((item) => (
            <b key={item.how} data-on={item === said || undefined}>
              {item.how}
            </b>
          ))}
        </p>
        <strong key={said.how}>{said.text}</strong>
      </div>
      <div className={s.lands} aria-hidden="true" data-on={step >= 2 || undefined}>
        <span>3. It lands</span>
        <strong key={said.how}>{DESK_FOR[said.how]}</strong>
        <em>a place in the queue, or a booked slot</em>
      </div>
    </div>
  );
}

// A page of bytes that starts as a Windows program does: with MZ. The same bytes each time.
const BYTES = Array.from({ length: 96 }, (_, i) => (i === 0 ? '4d' : i === 1 ? '5a' : ((i * 73 + 41) % 256).toString(16).padStart(2, '0')));
// Two runs of bytes, one for each of the two rules that match.
const BAD = new Set([17, 18, 19, 20, 53, 54, 55]);

/** MalShield: a scan line goes down a page of bytes, and the ones that match a rule light up. */
function Mal() {
  // Eight rows to read, then a rest on the verdict before it starts again.
  const line = Math.min(useTick(420, 12) % 14, 8);
  return (
    <div
      className={s.mal}
      role="img"
      aria-label="A scan line goes down a page of bytes. The bytes that match a rule light up, and the verdict is: do not open."
      data-done={line >= 8 || undefined}
    >
      <ol className={s.bytes} aria-hidden="true">
        {BYTES.map((byte, i) => (
          <li key={i} data-hit={(BAD.has(i) && Math.floor(i / 12) < line) || undefined}>
            {byte}
          </li>
        ))}
      </ol>
      <i className={s.scan} aria-hidden="true" style={at({ '--line': line })} />
      <p className={s.verdict} aria-hidden="true">
        <span>2 of 74 rules matched</span>
        <strong>Do not open</strong>
      </p>
    </div>
  );
}

const DAY = Array.from({ length: 24 }, (_, hour) => STORED[hour * 2] + STORED[hour * 2 + 1]);
const BUSIEST = Math.max(...DAY);

/** Chronicle: my day of listening as a clock. First on the clock Spotify stores, then on mine. */
function Chronicle() {
  const home = useTick(3400, 1) % 2 === 1;
  return (
    <div className={s.chronicle} role="img" aria-label="A 24-hour clock of when I listen. On the clock Spotify stores, the peak is at noon. Turned to Mumbai time, it is at 5 pm." data-home={home || undefined}>
      <div className={s.dial} aria-hidden="true">
        {/* The bars are the plays. They turn against the hours: the same plays, read on another clock. */}
        <ol style={at({ '--turn': `${home ? (HOME / 48) * 360 : 0}deg` })}>
          {DAY.map((amount, hour) => (
            <li key={hour} style={at({ '--hour': hour, '--share': amount / BUSIEST })} />
          ))}
        </ol>
        <span>12 am</span>
        <span>6 am</span>
        <span>12 pm</span>
        <span>6 pm</span>
      </div>
      <p className={s.clock} aria-hidden="true">
        <span>{home ? 'on my clock, in Mumbai' : 'as Spotify stores it, in UTC'}</span>
        <strong key={String(home)}>{home ? '5 pm' : '12 pm'}</strong>
        <em>is when I listen the most. Same plays. Only the clock changed.</em>
      </p>
    </div>
  );
}

// One run of a bubble sort on a fixed list, written down first: each entry is the list after a swap.
const SORT = (() => {
  const list = [7, 3, 9, 1, 6, 12, 4, 10, 2, 8, 11, 5];
  const steps: { list: number[]; pair: [number, number] }[] = [{ list: [...list], pair: [-1, -1] }];
  for (let end = list.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      if (list[i] <= list[i + 1]) continue;
      [list[i], list[i + 1]] = [list[i + 1], list[i]];
      steps.push({ list: [...list], pair: [list[i], list[i + 1]] });
    }
  }
  return steps;
})();

/** Algomotion: a sort that was run once and written down, played back one swap at a time. */
function Algo() {
  const tick = useTick(260, SORT.length - 1) % (SORT.length + 8);
  const step = SORT[Math.min(tick, SORT.length - 1)];
  return (
    <div className={s.algo} role="img" aria-label="Twelve bars are sorted by height, one swap at a time.">
      <ol className={s.bars} aria-hidden="true" data-sorted={tick >= SORT.length - 1 || undefined}>
        {SORT[0].list.map((value) => (
          <li key={value} data-on={step.pair.includes(value) || undefined} style={at({ '--at': step.list.indexOf(value), '--tall': value / 12 })} />
        ))}
      </ol>
      <p className={s.caption} aria-hidden="true">
        swap {Math.min(tick, SORT.length - 1)} of {SORT.length - 1}
      </p>
    </div>
  );
}

type Kind = 'tool' | 'study' | 'hardware' | 'field';
// `clue` says, in one line, what the scene is. `try` is there when the visitor can drive it.
const STAGES: Record<string, { kind: Kind; scene: () => ReactElement; clue: string; try?: string }> = {
  omnicompiler: { kind: 'tool', scene: Omni, clue: 'One small program, stepped through in five languages.', try: 'Press a language or a button to take over.' },
  'local-llm-lab': { kind: 'study', scene: Lab, clue: 'My real results, ranked two ways.', try: 'Press a ranking to hold it.' },
  'prats-deck': { kind: 'hardware', scene: Deck, clue: 'The real screens of the deck.', try: 'Tap an app to open it.' },
  scrub: { kind: 'tool', scene: Scrub, clue: 'A trim: two handles on your frames, and one command.' },
  neat: { kind: 'hardware', scene: Neat, clue: 'What Neat does to a Downloads folder.' },
  floatchat: { kind: 'field', scene: Float, clue: 'A question in plain words, the tool the model picks, and what comes back.' },
  'idea-hackathon': { kind: 'hardware', scene: Idea, clue: 'A visit to the desk: you log in, you say it your way, and it lands with the right people.' },
  malshield: { kind: 'field', scene: Mal, clue: 'A file being read, without being run.' },
  chronicle: { kind: 'study', scene: Chronicle, clue: 'When I listen, from my own 104,329 plays.' },
  algomotion: { kind: 'tool', scene: Algo, clue: 'A bubble sort, run once and played back.' },
};

/** What kind of page a project gets. Without a stage it keeps the plain one. */
export const kindOf = (slug: string) => STAGES[slug]?.kind;

/** The live scene at the top of a project page: the project doing its one thing, on a loop. */
export function Stage({ slug }: { slug: string }) {
  const { scene: Scene, kind, clue, try: hint } = STAGES[slug];
  return (
    <figure className={s.frame} data-in>
      <div className={s.stage} data-stage={slug} data-wide={kind === 'field' || undefined}>
        <Scene />
      </div>
      {/* A small light, as on a camera, and one line that says what is on the stage. */}
      <figcaption className={s.clue} data-clue>
        <b>Live</b>
        <span>
          {clue}
          {hint && <em> {hint}</em>}
        </span>
      </figcaption>
    </figure>
  );
}
