import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';

import { track } from '~/lib/analytics';
import { prefersReducedMotion } from '~/lib/motion';

import s from './Demo.module.css';

/* One small working part per project. Each shows the idea of the project in a few seconds. */

/**
 * Walks through the stages of a run, one at a time. `at` is the stage that is running now,
 * and it equals `count` when the run is over. With reduced motion a run is over at once.
 */
function useRun(count: number, pace = 520) {
  const [at, setAt] = useState(count);
  const timer = useRef(0);
  useEffect(() => () => clearInterval(timer.current), []);
  const run = () => {
    clearInterval(timer.current);
    if (prefersReducedMotion()) return setAt(count);
    setAt(0);
    let now = 0;
    timer.current = window.setInterval(() => {
      now += 1;
      if (now >= count) clearInterval(timer.current);
      setAt(now);
    }, pace);
  };
  return { at, run, over: at >= count };
}

type Stage = { name: string; detail: string };

/**
 * What goes on underneath, as a row of stages. Each one lights up as the run reaches it.
 * A halted run goes no further: the stages after it stay dark.
 */
function Stages({ stages, at, halted = false }: { stages: Stage[]; at: number; halted?: boolean }) {
  return (
    <ol className={s.stages} data-stages data-over={at >= stages.length || undefined}>
      {stages.map((stage, i) => (
        <li key={stage.name} data-state={i < at ? 'done' : i === at && !halted ? 'now' : 'todo'}>
          <b>{stage.name}</b>
          <span>{stage.detail}</span>
        </li>
      ))}
    </ol>
  );
}

/** Scrub: pick a size limit and a clip length, and see the bitrate it would encode at. */
function Scrub() {
  const limits = [
    { name: 'Discord', mb: 10 },
    { name: 'WhatsApp', mb: 16 },
    { name: 'Email', mb: 25 },
  ];
  const [mb, setMb] = useState(10);
  const [seconds, setSeconds] = useState(60);
  const AUDIO = 128;
  const video = Math.max(Math.floor((mb * 8192) / seconds) - AUDIO, 0);
  const size = ((video + AUDIO) * seconds) / 8192;
  const { at, run } = useRun(5, 560);
  const stages = [
    { name: 'Probe', detail: `ffprobe reads it: ${seconds} s long` },
    { name: 'Budget', detail: `${mb} MB over ${seconds} s is ${video + AUDIO} kbps in all` },
    { name: 'Pass 1', detail: 'looks at every frame, writes nothing' },
    { name: 'Pass 2', detail: `encodes at ${video.toLocaleString('en')} kbps` },
    { name: 'Check', detail: `${size.toFixed(2)} MB. Under.` },
  ];
  return (
    <div className={s.scrub}>
      <div className={s.choices} role="group" aria-label="Size limit">
        {limits.map((limit) => (
          <button
            key={limit.name}
            type="button"
            aria-pressed={mb === limit.mb}
            onClick={() => {
              setMb(limit.mb);
              run();
            }}
          >
            {limit.name} <span>{limit.mb} MB</span>
          </button>
        ))}
      </div>
      <label className={s.range}>
        <span>
          Clip length <b>{seconds}s</b>
        </span>
        <input type="range" min={10} max={300} step={5} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} />
      </label>
      <p className={s.result} data-result>
        <b>{video.toLocaleString('en')}</b> kbps of video, plus {AUDIO} for sound. Two passes, and it lands under {mb} MB.
      </p>
      {/* The command is on screen before it runs. It changes as the numbers do. */}
      <p className={s.command}>
        <span>the command, before it runs</span>
        <code data-command>
          ffmpeg -i clip.mp4 -c:v libx264 -b:v <b>{video}k</b> -pass 2 -c:a aac -b:a {AUDIO}k out.mp4
        </code>
      </p>
      <button type="button" className={s.action} onClick={run}>
        Run it
      </button>
      <Stages stages={stages} at={at} />
    </div>
  );
}

type Group = {
  id: string;
  title: string;
  why: string;
  /** What Neat suggests, as the words on the button and on the line that is left after. */
  act: string;
  done: string;
  /** Megabytes that come back when the group is recycled. Moves free nothing. */
  frees: number;
  /** Sure groups go in one press. The rest wait for a decision. */
  sure: boolean;
  files: [name: string, from: string, note: string][];
};

const GROUPS: Group[] = [
  {
    id: 'installers',
    title: 'Installers for apps you already have',
    why: 'All 3 apps are installed, at the same version or a newer one.',
    act: 'Recycle',
    done: 'Recycled 3 installers',
    frees: 316,
    sure: true,
    files: [
      ['Figma-124.1.2.exe', 'figma.com', 'Installed: 124.3'],
      ['VSCodeUserSetup-1.104.0.exe', 'code.visualstudio.com', 'Installed: 1.105'],
      ['python-3.13.5-amd64.exe', 'python.org', 'Installed: 3.13.7'],
    ],
  },
  {
    id: 'duplicates',
    title: 'Same file, downloaded 3 times',
    why: 'All 3 have the same hash. The copy with the first name stays.',
    act: 'Recycle the copies',
    done: 'Recycled 2 copies, kept 1',
    frees: 3,
    sure: true,
    files: [
      ['Semester 5 Timetable.pdf', 'classroom.google.com', 'Kept'],
      ['Semester 5 Timetable (1).pdf', 'classroom.google.com', 'Copy'],
      ['Semester 5 Timetable (2).pdf', 'classroom.google.com', 'Copy'],
    ],
  },
  {
    id: 'receipts',
    title: 'Receipts and invoices',
    why: 'From 2 shopping sites, and the names say invoice or order.',
    act: 'Move to Finance / Receipts',
    done: 'Moved 3 receipts to Finance / Receipts',
    frees: 0,
    sure: false,
    files: [
      ['Invoice_402-8831127.pdf', 'amazon.in', ''],
      ['OD331942773514900.pdf', 'flipkart.com', ''],
      ['Invoice_171-2210094.pdf', 'amazon.in', ''],
    ],
  },
];

// The stage of the scan that finds each group: the hash, the installed apps, then the grouping.
const FOUND: Record<string, number> = { duplicates: 3, installers: 4, receipts: 5 };

/** Neat: its review queue. One decision per group, a reason for each, and undo on everything. */
function Neat() {
  const [done, setDone] = useState<string[]>([]);
  const [rule, setRule] = useState(false);
  const [arrived, setArrived] = useState(0);
  const open = GROUPS.filter((group) => !done.includes(group.id));
  const left = open.reduce((sum, group) => sum + group.files.length, 0);
  const freed = GROUPS.filter((group) => done.includes(group.id)).reduce((sum, group) => sum + group.frees, 0);
  const sure = open.filter((group) => group.sure).map((group) => group.id);
  const learned = rule && done.includes('receipts');
  const undo = (id: string) => {
    setDone(done.filter((other) => other !== id));
    if (id === 'receipts') setArrived(0);
  };
  // The scan that makes the groups. Each group comes into view as its stage ends.
  const { at, run } = useRun(5, 480);
  const stages = [
    { name: 'Scan', detail: '9 files at the top of Downloads' },
    { name: 'Source', detail: 'the site each one came from' },
    { name: 'Hash', detail: '3 files are the same inside' },
    { name: 'Apps', detail: '3 installers match installed apps' },
    { name: 'Group', detail: '3 decisions, not 9' },
  ];
  const scan = () => {
    setDone([]);
    setArrived(0);
    run();
  };

  return (
    <div className={s.neat}>
      <p className={s.result} data-result>
        <b>{left}</b>
        {left ? `files to look at, in ${open.length} ${open.length === 1 ? 'decision' : 'decisions'}.` : 'files to look at. Downloads is clean.'}
        {freed > 0 && ` ${freed} MB back, all of it still in the Recycle Bin.`}
      </p>
      <Stages stages={stages} at={at} />
      <div className={s.choices}>
        <button type="button" className={s.action} disabled={!sure.length || at < 5} onClick={() => setDone([...done, ...sure])}>
          Apply the {sure.length || ''} sure ones
        </button>
        <button type="button" onClick={scan}>
          Scan again
        </button>
      </div>
      <ul className={s.queue}>
        {GROUPS.map((group) =>
          // A group is not there until the stage that finds it has ended.
          at < FOUND[group.id] ? null : done.includes(group.id) ? (
            <li key={group.id} className={s.settled} data-group={group.id}>
              <span>{group.done}</span>
              <button type="button" onClick={() => undo(group.id)}>
                Undo
              </button>
            </li>
          ) : (
            <li key={group.id} data-group={group.id}>
              <h3>{group.title}</h3>
              <p className={s.why}>{group.why}</p>
              <ul className={s.files}>
                {group.files.map(([name, from, note]) => (
                  <li key={name}>
                    <span>{name}</span>
                    <span>{from}</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
              <div className={s.choices}>
                <button type="button" aria-pressed="true" onClick={() => setDone([...done, group.id])}>
                  {group.act}
                </button>
                {!group.sure && (
                  <label className={s.always}>
                    <input type="checkbox" checked={rule} onChange={(event) => setRule(event.target.checked)} />
                    Always move files like these
                  </label>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
      {learned && (
        <div className={s.learned} data-learned>
          <button type="button" onClick={() => setArrived(arrived + 1)}>
            Download one more invoice
          </button>
          <p aria-live="polite">
            {arrived
              ? `Filed ${arrived} by itself. Neat did not ask, because you already answered.`
              : 'Neat has a rule now. See what happens to the next one.'}
          </p>
        </div>
      )}
    </div>
  );
}

// The home page of the deck, in the order of its icons: five across, three down.
// Each one opens a picture of that app, taken in the simulator.
const DECK: [name: string, about: string, picture: string][] = [
  ['Chindi', 'A pet cat. She gets hungry, sleepy and bored, and she wants attention.', 'chindi'],
  ['Galaxy', 'Glowing dots that follow the stylus. Only for fun.', 'galaxy'],
  ['Macros', 'Buttons that control the PC. The deck is a USB keyboard, so the PC needs no software.', 'macros-song'],
  ['Monitor', 'How hard the PC works: processor, memory, graphics card, heat and network.', 'monitor'],
  ['Clock', 'A clock set from the internet, with three days of weather.', 'clock'],
  ['Wi-Fi', 'The networks near you, how strong each one is, and the best channel for your router.', 'wifi'],
  ['Scope', 'An oscilloscope. It draws the signal on one of the pins.', 'scope'],
  ['Guide', 'It explains each app, on the device itself.', 'guide'],
  ['Paint', 'Paint with light. Lines that cross get brighter.', 'paint'],
  ['Bricks', 'Hit the ball, break the bricks. Three lives.', 'bricks'],
  ['Life', 'The Game of Life. Draw on it to add living dots.', 'life'],
  ['Snake', 'The classic. Tap beside its head to turn it.', 'snake'],
  ['2048', 'Slide the tiles. Two of the same number join.', '2048'],
  ['Trackpad', 'The screen is a mouse pad. The deck is a USB mouse too.', 'trackpad'],
  ['Settings', 'Brightness, touch calibration, and the tear-free switch.', 'settings'],
];

/** Prats-Deck: its real home page. Tap an app to open it, and the arrow to go back. */
function Deck() {
  const [open, setOpen] = useState<number | null>(null);
  const [cat, setCat] = useState<'chindi' | 'chindi-dancing' | 'chindi-zoomies'>('chindi');
  const app = open === null ? null : DECK[open];
  const picture = !app ? 'home' : app[0] === 'Chindi' ? cat : app[2];
  const home = () => {
    setOpen(null);
    setCat('chindi');
  };

  return (
    <div className={s.deck}>
      <div className={s.device}>
        <div className={s.screen} data-screen={picture}>
          <img src={`/deck/${picture}.webp`} width={640} height={480} alt={app ? `The ${app[0]} app on the deck` : 'The home page of the deck, with 15 app icons'} />
          {app ? (
            <button type="button" className={s.back} onClick={home} aria-label="Back to the home page" />
          ) : (
            DECK.map(([name], i) => (
              <button
                key={name}
                type="button"
                className={s.icon}
                style={{ left: `${(i % 5) * 20}%`, top: `${22.5 + Math.floor(i / 5) * 25.8}%` }}
                onClick={() => setOpen(i)}
                aria-label={`Open ${name}`}
              />
            ))
          )}
        </div>
      </div>
      <div className={s.about} aria-live="polite">
        <h3>{app ? app[0] : 'Home'}</h3>
        <p>{app ? app[1] : 'Fifteen apps on a 2.8 inch screen. Tap one.'}</p>
        {app?.[0] === 'Chindi' && (
          <div className={s.choices}>
            <button type="button" aria-pressed={cat === 'chindi-dancing'} onClick={() => setCat(cat === 'chindi-dancing' ? 'chindi' : 'chindi-dancing')}>
              Play a song on the PC
            </button>
            <button type="button" aria-pressed={cat === 'chindi-zoomies'} onClick={() => setCat(cat === 'chindi-zoomies' ? 'chindi' : 'chindi-zoomies')}>
              Zoomies
            </button>
          </div>
        )}
        {app && (
          <button type="button" onClick={home}>
            Home
          </button>
        )}
        <p className={s.small}>These pictures come from the simulator, which runs the code of the deck on a PC.</p>
      </div>
    </div>
  );
}

// One small program, the same in five languages, line for line: a function, a loop that calls it, a print.
const CODE: Record<string, string[]> = {
  Python: ['def area(w, h):', '    return w * h', 'total = 0', 'for size in [2, 3, 4]:', '    total += area(size, size)', 'print(total)'],
  JavaScript: ['function area(w, h) {', '  return w * h; }', 'let total = 0;', 'for (const size of [2, 3, 4]) {', '  total += area(size, size); }', 'console.log(total);'],
  Java: ['static int area(int w, int h) {', '  return w * h; }', 'int total = 0;', 'for (int size : new int[]{2, 3, 4}) {', '  total += area(size, size); }', 'System.out.println(total);'],
  'C++': ['int area(int w, int h) {', '  return w * h; }', 'int total = 0;', 'for (int size : {2, 3, 4}) {', '  total += area(size, size); }', 'std::cout << total;'],
  Go: ['func area(w, h int) int {', '  return w * h }', 'total := 0', 'for _, size := range []int{2, 3, 4} {', '  total += area(size, size) }', 'fmt.Println(total)'],
};

// The same run in every language: the line the debugger is on, how deep it is, and what it can see there.
type Frame = { line: number; deep: 0 | 1; seen: [name: string, value: string][] };
const main = (line: number, total: string, size: string): Frame => ({ line, deep: 0, seen: [['total', total], ['size', size]] });
const inside = (side: string): Frame => ({ line: 1, deep: 1, seen: [['w', side], ['h', side]] });
const RUN: Frame[] = [
  main(2, '-', '-'),
  main(3, '0', '-'),
  main(4, '0', '2'),
  inside('2'),
  main(3, '4', '2'),
  main(4, '4', '3'),
  inside('3'),
  main(3, '13', '3'),
  main(4, '13', '4'),
  inside('4'),
  main(3, '29', '4'),
  main(5, '29', '4'),
];

// The debugger each language really runs on. The page never shows these: that is the point.
const NATIVE: Record<string, string> = { Python: 'bdb', JavaScript: 'Node Inspector', Java: 'jdb', 'C++': 'gdb', Go: 'Delve' };
type Press = 'step_over' | 'step_in' | 'step_out' | 'continue';
// What each debugger is really told for each button. The page only ever says the button's own word.
const SAYS: Record<string, Record<Press, string>> = {
  Python: { step_over: 'set_next(frame)', step_in: 'set_step()', step_out: 'set_return(frame)', continue: 'set_continue()' },
  JavaScript: { step_over: 'Debugger.stepOver', step_in: 'Debugger.stepInto', step_out: 'Debugger.stepOut', continue: 'Debugger.resume' },
  Java: { step_over: 'next', step_in: 'step', step_out: 'step up', continue: 'cont' },
  'C++': { step_over: '-exec-next', step_in: '-exec-step', step_out: '-exec-finish', continue: '-exec-continue' },
  Go: { step_over: 'next', step_in: 'step', step_out: 'stepout', continue: 'continue' },
};
// The line the model would mark: the one in the loop that calls the function.
const SUGGESTED = 4;

/** OmniCompiler: one set of debugger controls. Change the language and nothing else changes. */
function Omni() {
  const [lang, setLang] = useState('Python');
  const [step, setStep] = useState(2);
  const [stops, setStops] = useState<number[]>([]);
  const at = RUN[step];
  const last = RUN.length - 1;
  const ended = step === last;
  const toggle = (line: number) => setStops(stops.includes(line) ? stops.filter((other) => other !== line) : [...stops, line]);

  // Where each button lands. A step over stays at this depth, a step out goes up one, and
  // continue runs to the next breakpoint. With nowhere to go, each one runs to the end.
  const land = (what: Press) => {
    if (ended) return 0;
    if (what === 'step_in') return step + 1;
    const next = RUN.findIndex((frame, i) => {
      if (i <= step) return false;
      if (what === 'continue') return stops.includes(frame.line);
      return what === 'step_over' ? frame.deep <= at.deep : frame.deep < at.deep;
    });
    return next === -1 ? last : next;
  };

  // One press, followed down to the debugger and back.
  const [said, setSaid] = useState<Press>('step_over');
  const { at: hop, run } = useRun(4, 190);
  const press = (what: Press) => {
    setSaid(what);
    run();
    setStep(land(what));
  };
  const trip = [
    { name: 'Page', detail: `{ "type": "${said}" }` },
    // Four languages have a small adapter in the container. For Go the server talks to Delve itself.
    { name: lang === 'Go' ? 'Server' : 'Adapter', detail: lang === 'Go' ? 'talks to Delve itself' : 'puts it in that debugger\'s words' },
    { name: NATIVE[lang], detail: SAYS[lang][said] },
    { name: 'Back', detail: `{ "event": "${ended ? 'terminated' : 'stopped'}", "line": ${at.line + 1} }` },
  ];

  return (
    <div className={s.omni}>
      {/* One dark window, laid out as a debugger: tabs, controls, code, state, and the wire under it. */}
      <div className={s.ide}>
        <div className={s.tabs} role="group" aria-label="Language">
          {Object.keys(CODE).map((name) => (
            <button key={name} type="button" aria-pressed={lang === name} onClick={() => setLang(name)}>
              {name}
            </button>
          ))}
        </div>
        <div className={s.tools}>
          <button type="button" className={s.go} onClick={() => press('step_over')}>
            {ended ? 'Restart' : 'Step over'}
          </button>
          <button type="button" disabled={ended} onClick={() => press('step_in')}>
            Step in
          </button>
          <button type="button" disabled={ended || at.deep === 0} onClick={() => press('step_out')}>
            Step out
          </button>
          <button type="button" disabled={ended} onClick={() => press('continue')}>
            Continue
          </button>
          <span data-state>{ended ? 'finished' : `paused on line ${at.line + 1}`}</span>
        </div>
        <div className={s.panes}>
          <ol className={s.code}>
            {CODE[lang].map((text, i) => (
              <li key={i} data-here={i === at.line || undefined}>
                <button
                  type="button"
                  className={s.gutter}
                  aria-pressed={stops.includes(i)}
                  aria-label={`Breakpoint on line ${i + 1}`}
                  data-suggested={(i === SUGGESTED && !stops.includes(i)) || undefined}
                  onClick={() => toggle(i)}
                >
                  {i + 1}
                </button>
                <code>{text}</code>
              </li>
            ))}
          </ol>
          <div className={s.side}>
            <h3>Variables</h3>
            <dl className={s.watch} data-watch>
              {at.seen.map(([name, value]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <h3>Call stack</h3>
            <ol className={s.frames} data-stack>
              {at.deep === 1 && <li>area, line 2</li>}
              <li>main, line {at.deep === 1 ? 5 : at.line + 1}</li>
            </ol>
            <h3>Debugger under it</h3>
            <p className={s.native} data-native>
              {NATIVE[lang]}
            </p>
          </div>
        </div>
        <div className={s.wire}>
          <Stages stages={trip} at={hop} />
          <p>
            <span>output</span>
            <code>{ended ? '29' : ' '}</code>
          </p>
        </div>
      </div>
      <p className={s.small}>
        Click a line number to set a breakpoint. The ringed one is where the model would put it. Press Step in on line 5, in two languages, and
        watch the row at the bottom: the page says the same thing, and each debugger hears its own.
      </p>
    </div>
  );
}

// Four questions, and what really happens to each. Three go the whole way. One is stopped at the gate.
type Ask = { q: string; picks?: string; plots?: string; sql?: string; rows?: string; a: string; values?: number[] };
const ASKS: Ask[] = [
  {
    q: 'How warm was the Arabian Sea this year?',
    picks: 'timeseries_line',
    plots: 'generate_time_series',
    sql: "SELECT date_trunc('month', p.juld_time) AS time, avg(l.temp) AS avg_temp FROM profiles p JOIN levels_core l ON l.profile_id = p.id WHERE l.pres < 10 AND p.latitude BETWEEN 8 AND 25 AND p.longitude BETWEEN 55 AND 75 GROUP BY 1 ORDER BY 1",
    rows: '12 rows',
    a: 'Warmest in May, near 30 °C at the surface. Coolest in January.',
    values: [22, 26, 34, 46, 58, 52, 44, 40, 42, 38, 30, 24],
  },
  {
    q: 'Where is the water saltiest?',
    picks: 'heatmap_grid',
    plots: 'generate_heatmap',
    sql: 'SELECT round(p.latitude) AS lat, round(p.longitude) AS lon, avg(l.psal) AS value FROM profiles p JOIN levels_core l ON l.profile_id = p.id WHERE l.pres < 10 GROUP BY 1, 2',
    rows: '50 cells',
    a: 'The north of the Arabian Sea. It gets fresher toward the Bay of Bengal.',
  },
  {
    q: 'Show me the floats near India.',
    picks: 'map_points',
    plots: 'generate_map_points',
    sql: 'SELECT p.latitude AS lat, p.longitude AS lon FROM profiles p WHERE p.latitude BETWEEN 5 AND 25 AND p.longitude BETWEEN 55 AND 95',
    rows: '26 points',
    a: 'Each dot is one float that reported in. Most are west of the coast.',
  },
  // Not about the ocean. The first model call says so, and nothing after it runs.
  { q: 'Best pizza in Pune?', a: 'Your query is irrelevant or off-topic. Please ask a relevant question about ARGO float data.' },
];

// A fixed scatter of floats, and a fixed salt field, so the pictures are the same on every visit.
const FLOATS = Array.from({ length: 26 }, (_, i) => ({ x: 18 + ((i * 97) % 150) + (i % 3) * 6, y: 14 + ((i * 53) % 68) }));
const SALT = Array.from({ length: 50 }, (_, i) => {
  const column = i % 10;
  const row = Math.floor(i / 10);
  return Math.max(0.12, 1 - column * 0.085 - row * 0.09 + ((i * 7) % 5) * 0.03);
});

/** FloatChat: ask a question and follow it through the real chain: a gate, four model calls, and two tools. */
function Float() {
  const [asked, setAsked] = useState(0);
  const ask = ASKS[asked];
  const refused = !ask.picks;
  const path = (ask.values ?? []).map((y, i) => `${i ? 'L' : 'M'}${i * 24 + 18} ${92 - y}`).join(' ');
  // The answer is built in the order it really happens. Each part shows when its stage ends.
  const { at, run } = useRun(6, 520);
  const stages = [
    { name: 'Gate', detail: refused ? 'call 1: not about the floats. Stop.' : 'call 1: about the floats, and clear. Go on.' },
    { name: 'Pick', detail: `call 2 chooses ${ask.picks ?? 'a picture'}` },
    { name: 'SQL', detail: 'call 3 writes it, from the schema only' },
    { name: 'Query', detail: `sql_query gives back ${ask.rows ?? 'rows'}` },
    { name: 'Draw', detail: `${ask.plots ?? 'a tool'} makes the picture` },
    { name: 'Sum', detail: 'call 4 writes the answer for you' },
  ];
  // A refused question never gets past the gate, so the run stops there.
  const reach = refused ? Math.min(at, 1) : at;
  const drawn = !refused && at > 4;
  return (
    <div className={s.float}>
      <div className={s.choices} role="group" aria-label="Question">
        {ASKS.map((item, i) => (
          <button
            key={item.q}
            type="button"
            aria-pressed={asked === i}
            onClick={() => {
              setAsked(i);
              run();
            }}
          >
            {item.q}
          </button>
        ))}
      </div>
      <Stages stages={stages} at={reach} halted={refused && at > 0} />
      <div className={s.answer}>
        <div className={s.thread}>
          <p className={s.asked}>{ask.q}</p>
          {!refused && at > 1 && (
            <p className={s.tool} data-tool>
              <span>the orchestrator picks</span>
              <b>{ask.picks}</b>
            </p>
          )}
          {!refused && at > 2 && (
            <p className={s.tool}>
              <span>the model writes this. The tool lets only a SELECT through.</span>
              <code>{ask.sql}</code>
            </p>
          )}
          {(refused ? at > 0 : at > 5) && (
            <p className={s.reply} data-answer data-refused={refused || undefined}>
              {ask.a}
            </p>
          )}
        </div>
        <figure className={s.chart}>
          <svg viewBox="0 0 300 110" role="img" aria-label="The picture that comes with the answer" data-picture={ask.picks ?? 'none'} key={asked}>
            {drawn && ask.picks === 'timeseries_line' && (
              <>
                <path d="M18 92 H282" className={s.axis} />
                <path d={path} className={s.line} pathLength={1} />
                {(ask.values ?? []).map((y, i) => (
                  <circle key={i} cx={i * 24 + 18} cy={92 - y} r="3" className={s.dot} style={{ animationDelay: `${i * 45}ms` }} />
                ))}
                {['Jan', 'May', 'Sep', 'Dec'].map((month, i) => (
                  <text key={month} x={[18, 114, 210, 282][i]} y="106" className={s.tick}>
                    {month}
                  </text>
                ))}
              </>
            )}
            {drawn &&
              ask.picks === 'heatmap_grid' &&
              SALT.map((value, i) => (
                <rect
                  key={i}
                  x={(i % 10) * 28 + 10}
                  y={Math.floor(i / 10) * 20 + 5}
                  width="26"
                  height="18"
                  className={s.cell}
                  style={{ '--to': value, animationDelay: `${((i % 10) + Math.floor(i / 10)) * 30}ms` } as CSSProperties}
                />
              ))}
            {drawn && ask.picks === 'map_points' && (
              <>
                <rect x="10" y="5" width="280" height="96" className={s.sea} />
                {[80, 150, 220].map((x) => (
                  <path key={x} d={`M${x} 5 V101`} className={s.axis} />
                ))}
                <path d="M10 53 H290" className={s.axis} />
                {/* The coast, as one rough line. */}
                <path d="M196 5 L190 30 L204 58 L222 82 L232 101" className={s.coast} />
                {FLOATS.map((float, i) => (
                  <circle key={i} cx={float.x} cy={float.y} r="3" className={s.float1} style={{ animationDelay: `${i * 25}ms` }} />
                ))}
              </>
            )}
          </svg>
          <figcaption>
            {refused
              ? 'No picture. Nothing ran.'
              : !drawn
                ? 'Waiting for the rows'
                : ask.picks === 'timeseries_line'
                  ? 'Surface temperature, by month'
                  : ask.picks === 'heatmap_grid'
                    ? 'Salinity. Brighter is saltier.'
                    : 'Float positions'}
          </figcaption>
        </figure>
      </div>
      <p className={s.small}>
        Sample answers and sample queries, on the real tables. The refusal is the real one, word for word. The real app runs all of this on the
        live float data.
      </p>
    </div>
  );
}

const CUSTOMERS = [
  { said: '"My card was declined twice."', kind: 'Card problem', priority: 'High', desk: 'Desk 2' },
  { said: '"I want to update my address."', kind: 'Account details', priority: 'Low', desk: 'Desk 5' },
  { said: '"Money left my account and I did not send it."', kind: 'Possible fraud', priority: 'Urgent', desk: 'Desk 1' },
];

/** iDEA: one customer walks in, and the desk works out the rest. */
function Idea() {
  const [who, setWho] = useState(0);
  const customer = CUSTOMERS[who];
  const steps = [
    ['Face', 'Recognised. No card or form needed.'],
    ['Voice', customer.said],
    ['Sorted', customer.kind],
    ['Queue', `${customer.priority} priority. ${customer.desk}.`],
  ];
  return (
    <div className={s.idea}>
      <ol key={who} className={s.flow}>
        {steps.map(([label, text], i) => (
          <li key={label} style={{ animationDelay: `${i * 260}ms` }}>
            <span>{label}</span>
            <p>{text}</p>
          </li>
        ))}
      </ol>
      <button type="button" className={s.action} onClick={() => setWho((who + 1) % CUSTOMERS.length)}>
        Next customer
      </button>
      <p className={s.small}>Three made-up customers, to show the flow.</p>
    </div>
  );
}

const DAYS = {
  'Night owl': [9, 7, 6, 3, 1, 0, 0, 1, 2, 2, 3, 3, 4, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10, 10],
  'Early bird': [0, 0, 0, 0, 1, 4, 8, 10, 9, 6, 5, 4, 4, 3, 4, 4, 5, 5, 4, 3, 2, 1, 0, 0],
};

/** Chronicle: a day of listening, hour by hour. */
function Chronicle() {
  const [kind, setKind] = useState<keyof typeof DAYS>('Night owl');
  return (
    <div className={s.chronicle}>
      <div className={s.choices} role="group" aria-label="Listener">
        {(Object.keys(DAYS) as (keyof typeof DAYS)[]).map((name) => (
          <button key={name} type="button" aria-pressed={kind === name} onClick={() => setKind(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className={s.hours} aria-hidden="true">
        {DAYS[kind].map((plays, hour) => (
          <i key={hour} style={{ transform: `scaleY(${Math.max(plays / 10, 0.02)})` }} data-night={hour < 6 || hour > 21 || undefined} />
        ))}
      </div>
      <p className={s.scale}>
        <span>midnight</span>
        <span>noon</span>
        <span>midnight</span>
      </p>
      <p className={s.small}>Two made-up listeners. Yours comes from your own Spotify export.</p>
    </div>
  );
}

const START = [8, 3, 11, 5, 14, 2, 9, 6, 13, 1, 10, 4, 12, 7];

/** Algomotion: a real bubble sort, one comparison at a time. */
function Algo() {
  const [bars, setBars] = useState(START);
  const [state, setState] = useState({ i: 0, pass: 0, compares: 0, running: false, at: -1 });

  useEffect(() => {
    if (!state.running) return;
    const timer = setTimeout(() => {
      const end = bars.length - 1 - state.pass;
      if (end <= 0) return setState({ ...state, running: false, at: -1 });
      const next = [...bars];
      if (next[state.i] > next[state.i + 1]) [next[state.i], next[state.i + 1]] = [next[state.i + 1], next[state.i]];
      setBars(next);
      const last = state.i + 1 >= end;
      setState({ ...state, at: state.i, i: last ? 0 : state.i + 1, pass: last ? state.pass + 1 : state.pass, compares: state.compares + 1 });
    }, 45);
    return () => clearTimeout(timer);
  }, [bars, state]);

  const reset = () => {
    setBars(START);
    setState({ i: 0, pass: 0, compares: 0, running: false, at: -1 });
  };

  return (
    <div className={s.algo}>
      <div className={s.sortBars} aria-hidden="true">
        {bars.map((value, i) => (
          <i key={i} style={{ height: `${(value / 14) * 100}%` }} data-at={i === state.at || i === state.at + 1 || undefined} />
        ))}
      </div>
      <p className={s.count} data-count>
        Comparisons: <b>{state.compares}</b>
      </p>
      <div className={s.choices}>
        <button type="button" onClick={() => setState({ ...state, running: true })} disabled={state.running}>
          Sort
        </button>
        <button type="button" onClick={reset}>
          Shuffle
        </button>
      </div>
    </div>
  );
}

const SCAN = [
  'reading file structure',
  'matching known patterns ...... 2 hits',
  'model verdict ................ 0.91 suspicious',
  'starting sealed container',
  'running the file',
  'it tried to write to the startup folder',
  'it tried to reach an unknown address',
  'container destroyed',
];

/** MalShield: a sample scan, line by line. */
function Mal() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown === 0 || shown >= SCAN.length) return;
    const timer = setTimeout(() => setShown(shown + 1), 320);
    return () => clearTimeout(timer);
  }, [shown]);
  return (
    <div className={s.mal}>
      <button type="button" className={s.action} onClick={() => setShown(1)}>
        {shown >= SCAN.length ? 'Scan again' : 'Scan a sample file'}
      </button>
      <ol className={s.log} aria-live="polite">
        {SCAN.slice(0, shown).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      {shown >= SCAN.length && (
        <p className={s.verdict} data-verdict>
          Verdict: do not open this.
        </p>
      )}
      <p className={s.small}>A scripted example of one report. No file is run in your browser.</p>
    </div>
  );
}

// From my own report: 4,101 runs on an RTX 5070.
const MODELS = [
  { name: 'Gemma 4 12B coder', pass: 79, perHour: 1588 },
  { name: 'Gemma 4 12B', pass: 87, perHour: 1519 },
  { name: 'Gemma 4 E4B', pass: 70, perHour: 1357 },
  { name: 'Gemma 4 26B', pass: 96, perHour: 1054 },
  { name: 'GPT-OSS 20B', pass: 81, perHour: 792 },
];

/** Local LLM lab: the same five models, ranked by two different numbers. */
function Lab() {
  const [byHour, setByHour] = useState(false);
  const key = byHour ? 'perHour' : 'pass';
  const top = Math.max(...MODELS.map((m) => m[key]));
  const ranked = [...MODELS].sort((a, b) => b[key] - a[key]);
  return (
    <div className={s.lab}>
      <div className={s.choices} role="group" aria-label="Rank by">
        <button type="button" aria-pressed={!byHour} onClick={() => setByHour(false)}>
          Tasks passed
        </button>
        <button type="button" aria-pressed={byHour} onClick={() => setByHour(true)}>
          Right answers per hour
        </button>
      </div>
      <ol className={s.ranks}>
        {ranked.map((model) => (
          <li key={model.name}>
            <span>{model.name}</span>
            <i style={{ transform: `scaleX(${model[key] / top})` }} />
            <b>{byHour ? model.perHour.toLocaleString('en') : `${model.pass}%`}</b>
          </li>
        ))}
      </ol>
      <p className={s.small}>Real results. The biggest model wins the first list and comes fourth in the second.</p>
    </div>
  );
}

const DEMOS: Record<string, { title: string; body: () => ReactElement }> = {
  scrub: { title: 'Fit a size', body: Scrub },
  neat: { title: 'The review queue', body: Neat },
  'prats-deck': { title: 'Tap through it', body: Deck },
  omnicompiler: { title: 'Debug it', body: Omni },
  floatchat: { title: 'Ask it', body: Float },
  'idea-hackathon': { title: 'One customer', body: Idea },
  chronicle: { title: 'A day of listening', body: Chronicle },
  algomotion: { title: 'Watch one', body: Algo },
  malshield: { title: 'One scan', body: Mal },
  'local-llm-lab': { title: 'Two ways to rank', body: Lab },
};

const touched = new Set<string>();
function used(slug: string) {
  if (touched.has(slug)) return;
  touched.add(slug);
  track('demo_used', { project: slug });
}

export function Demo({ slug }: { slug: string }) {
  const demo = DEMOS[slug];
  if (!demo) return null;
  const Body = demo.body;
  return (
    // One event per visit to the page, the first time the visitor touches the demo.
    <section className={s.demo} data-demo={slug} data-in onClickCapture={() => used(slug)}>
      <h2>{demo.title}</h2>
      <Body />
    </section>
  );
}
