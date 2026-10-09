import { useEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';

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

type Kind = 'film' | 'folder' | 'device' | 'wave' | 'file' | 'model' | 'maze' | 'clock';

// What is printed at the head of the slip, for each kind of job.
const JOBS: Record<Kind, string> = { film: 'Encode job', folder: 'Folder scan', device: 'One tap', wave: 'One question', file: 'One file', model: 'One model', maze: 'One search', clock: 'One history' };

type Step = { name: string; value: string; live?: boolean };

/**
 * The long half of the slip. It prints one line for each step as the step ends, the way a
 * till prints a receipt: the name, a row of dots, and what came out. A halted run prints no more.
 */
function Console({ kind, steps, at, halted = false }: { kind: Kind; steps: Step[]; at: number; halted?: boolean }) {
  const running = at < steps.length && !halted;
  return (
    <div className={s.printed} data-running={running || undefined}>
      <span className={s.label}>{JOBS[kind]}</span>
      <ol className={s.steps} data-stages data-over={at >= steps.length || undefined}>
        {steps.map((step, i) => {
          const state = i < at ? 'done' : i === at && !halted ? 'now' : 'todo';
          return (
            <li key={step.name} data-state={state}>
              <b>{step.name}</b>
              <i aria-hidden="true" />
              <span>{state === 'done' || (state === 'now' && step.live) ? step.value : ''}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The stub at the end of the slip, past the tear line. It stays blank until the run is over. */
function Report({ ready, wait, stamp, tone = 'good', children }: { ready: boolean; wait: string; stamp: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className={s.stub} data-report data-ready={ready || undefined}>
      <span className={s.label}>Result</span>
      {ready ? (
        <>
          <strong className={s.verdict} data-tone={tone} data-stamp>
            {stamp}
          </strong>
          {children}
        </>
      ) : (
        <p className={s.waiting}>{wait}</p>
      )}
    </div>
  );
}

/** A bar that fills to a share of its length, with a line under it that says what it is. */
function Meter({ share, label }: { share: number; label: string }) {
  return (
    <p className={s.meter}>
      <i style={{ '--share': Math.min(Math.max(share, 0), 1) } as CSSProperties} />
      <span>{label}</span>
    </p>
  );
}

/** Scrub: pick a size limit and a clip length, and watch it encode to fit. */
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
  const { at, run } = useRun(6, 520);
  const steps = [
    { name: 'Upload', value: 'a copy, in a working folder' },
    { name: 'Probe', value: `${seconds} s of video` },
    { name: 'Budget', value: `${video + AUDIO} kbps in all` },
    { name: 'Pass 1', value: 'every frame read, nothing written' },
    { name: 'Pass 2', value: `encoded at ${video.toLocaleString('en')} kbps` },
    { name: 'Check', value: `${size.toFixed(2)} MB` },
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
      <div className={s.bench}>
        <Console kind="film" steps={steps} at={at} />
        <Report ready={at >= steps.length} wait="Encoding" stamp="Fits">
          <p className={s.result} data-result>
            <b>{video.toLocaleString('en')}</b> kbps of video, plus {AUDIO} for sound.
          </p>
          <Meter share={size / mb} label={`${size.toFixed(2)} of ${mb} MB`} />
          <ul className={s.points}>
            <li>Two passes, so the size is planned and not hoped for</li>
            <li>It lands a little under, on purpose</li>
            <li>The file never left this PC</li>
          </ul>
        </Report>
      </div>
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
  const steps = [
    { name: 'Scan', value: '9 files at the top of Downloads' },
    { name: 'Source', value: 'each one has a site it came from' },
    { name: 'Hash', value: '3 files are the same inside' },
    { name: 'Apps', value: '3 installers match installed apps' },
    { name: 'Group', value: '3 groups, not 9 files' },
  ];
  const scan = () => {
    setDone([]);
    setArrived(0);
    run();
  };

  return (
    <div className={s.neat}>
      <div className={s.bench}>
        <Console kind="folder" steps={steps} at={at} />
        <Report ready={at >= steps.length} wait="Scanning" stamp={left ? `${open.length} to decide` : 'Tidy'}>
          <p className={s.result} data-result>
            <b>{left}</b>
            {left ? `files to look at, in ${open.length} ${open.length === 1 ? 'decision' : 'decisions'}.` : 'files to look at. Downloads is clean.'}
          </p>
          <Meter share={(9 - left) / 9} label={`${9 - left} of 9 files dealt with`} />
          <ul className={s.points}>
            <li>{freed > 0 ? `${freed} MB back, all of it still in the Recycle Bin` : 'Nothing is recycled until you say so'}</li>
            <li>Every change can be undone</li>
          </ul>
        </Report>
      </div>
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
  // What the deck does with one tap, from the stylus to the screen.
  const { at, run } = useRun(5, 240);
  const tap = (next: number | null) => {
    setOpen(next);
    setCat('chindi');
    run();
  };
  const home = () => tap(null);
  const isCat = app?.[0] === 'Chindi';
  const steps = [
    { name: 'Touch', value: 'the stylus is down, then up' },
    { name: 'Filter', value: 'a tap. A lift counts after 100 ms' },
    { name: 'App', value: app ? `${app[0]} opens` : 'back to the home page' },
    { name: 'Draw', value: isCat ? 'about 24 ms, on both cores' : 'into a 320 by 240 buffer' },
    { name: 'Sync', value: 'sent between two redraws' },
  ];

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
                onClick={() => tap(i)}
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
      <div className={s.bench}>
        <Console kind="device" steps={steps} at={at} />
        <Report ready={at >= steps.length} wait="Drawing" stamp={isCat ? '37 fps' : '41 fps'}>
          <ul className={s.points}>
            {isCat ? (
              <>
                <li>One frame: the cat 9 ms, the room 6.5, the rest 7</li>
                <li>She drew at 5 frames a second at the start</li>
              </>
            ) : (
              <>
                <li>The screen redraws 46 times a second</li>
                <li>No frame is sent across a redraw, so none is torn</li>
              </>
            )}
            <li>Measured on the real board</li>
          </ul>
        </Report>
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
  // A new language is a new session: a new container, a new debugger. The run shows it start.
  const { at: boot, run: start } = useRun(5, 260);
  const IMAGE: Record<string, string> = { Python: 'python', JavaScript: 'javascript', Java: 'java', 'C++': 'cpp', Go: 'go' };
  const session = [
    { name: 'Detect', detail: `${lang}, from the code alone` },
    { name: 'Container', detail: `omni-runner:${IMAGE[lang]}, about 300 ms` },
    { name: 'Attach', detail: lang === 'Go' ? 'Delve starts the program' : `${NATIVE[lang]}, through its adapter` },
    { name: 'Mark', detail: 'the model rings line 5' },
    { name: 'Ready', detail: 'paused. It waits for you' },
  ];
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
            <button
              key={name}
              type="button"
              aria-pressed={lang === name}
              onClick={() => {
                setLang(name);
                start();
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div className={s.boot}>
          <Stages stages={session} at={boot} />
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
  // The chain, in the order it really runs. A refused question stops at the gate.
  const { at, run } = useRun(6, 520);
  const steps = [
    { name: 'Gate', value: refused ? 'call 1 says: irrelevant' : 'call 1 says: proceed' },
    { name: 'Pick', value: `call 2 picks ${ask.picks}` },
    { name: 'SQL', value: 'call 3 wrote one SELECT' },
    { name: 'Query', value: `Postgres gave ${ask.rows}` },
    { name: 'Draw', value: `${ask.plots} saved a picture` },
    { name: 'Sum', value: 'call 4 wrote the answer' },
  ];
  const reach = refused ? Math.min(at, 1) : at;
  const ready = refused ? at > 0 : at >= steps.length;
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
      <div className={s.bench}>
        <Console kind="wave" steps={steps} at={reach} halted={refused && at > 0} />
        <Report ready={ready} wait="Working on it" stamp={refused ? 'Refused' : 'Answered'} tone={refused ? 'bad' : 'good'}>
          <p className={s.reply} data-answer data-refused={refused || undefined}>
            {ask.a}
          </p>
          {!refused && (
            <>
              <figure className={s.chart}>
                <svg viewBox="0 0 300 110" role="img" aria-label="The picture that comes with the answer" data-picture={ask.picks} key={asked}>
                  {ask.picks === 'timeseries_line' && (
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
                  {ask.picks === 'heatmap_grid' &&
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
                  {ask.picks === 'map_points' && (
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
                  {ask.picks === 'timeseries_line' ? 'Surface temperature, by month' : ask.picks === 'heatmap_grid' ? 'Salinity. Brighter is saltier.' : 'Float positions'}
                </figcaption>
              </figure>
              <p className={s.tool} data-tool>
                <span>picked</span>
                <b>{ask.picks}</b>
                <span>and ran this. Only a SELECT is let through.</span>
                <code>{ask.sql}</code>
              </p>
            </>
          )}
          {refused && (
            <ul className={s.points}>
              <li>No tool ran, and no query was written</li>
              <li>This is the real reply, word for word</li>
            </ul>
          )}
        </Report>
      </div>
      <p className={s.small}>Sample answers and sample queries, on the real tables. The real app runs all of this on the live float data.</p>
    </div>
  );
}

// The four departments of the branch, and some of the words that send a message to each.
// The words are from the project's own lists, which hold misspellings too: speech comes in through Whisper.
const DESKS: { name: string; short: string; words: string[] }[] = [
  { name: 'Loan Services', short: 'Loans', words: ['loan', 'mortgage', 'refinance', 'repayment', 'credit', 'interest', 'installment', 'collateral', 'eligibility', 'lone'] },
  { name: 'Deposit and Account Services', short: 'Accounts', words: ['account', 'deposit', 'savings', 'balance', 'transfer', 'statement', 'withdrawal', 'cheque', 'kyc', 'acct'] },
  { name: 'Operations and Service Requests', short: 'Operations', words: ['password', 'login', 'log in', 'reset', 'update', 'error', 'mobile app', 'access', 'timeout', 'server'] },
  { name: 'Customer Grievance and Fraud', short: 'Grievance', words: ['complaint', 'fraud', 'dispute', 'unauthorized', 'unauthorised', 'theft', 'suspicious', 'chargeback', 'compensation', 'dissatisfied'] },
];

/** Sorts a message the way the project does: count each department's words in it, and the most wins. */
function sortMessage(text: string) {
  const low = text.toLowerCase();
  const counts = DESKS.map((desk) => {
    const found = desk.words.filter((word) => low.includes(word));
    return { desk, found, count: found.reduce((sum, word) => sum + low.split(word).length - 1, 0) };
  });
  // The first department wins a tie, and a message with none of the words, as in the real code.
  return counts.reduce((best, next) => (next.count > best.count ? next : best));
}

const SAID = [
  { how: 'Video', text: 'Someone made an unauthorized transfer. This is fraud and I want to file a complaint.' },
  { how: 'Voice', text: 'I want to know the interest and the eligibility for a home loan.' },
  { how: 'Typed', text: 'I forgot my password and the mobile app shows an error at login.' },
];
// How many live tickets are ahead, for the made-up branch. The real wait is five minutes for each.
const AHEAD = 3;

/** iDEA: say what is wrong, in any of three ways, and follow it to the right department and a place in the queue. */
function Idea() {
  const [text, setText] = useState(SAID[0].text);
  const [how, setHow] = useState(SAID[0].how);
  const { at, run } = useRun(5, 480);
  const sorted = sortMessage(text);
  const steps = [
    { name: 'Login', value: 'the password, then a face check' },
    { name: 'Hear', value: how === 'Typed' ? 'typed, so nothing to hear' : `${how === 'Video' ? 'sound pulled out, then ' : ''}Whisper wrote ${text.trim().split(/\s+/).length} words` },
    { name: 'Sort', value: sorted.count ? `${sorted.count} ${sorted.count === 1 ? 'word' : 'words'} for ${sorted.desk.short}` : 'no department word. It falls back to Loans' },
    { name: 'Ticket', value: `saved under ${sorted.desk.short}` },
    { name: 'Queue', value: `place ${AHEAD + 1}. About ${(AHEAD + 1) * 5} minutes` },
  ];
  return (
    <div className={s.idea}>
      <div className={s.choices} role="group" aria-label="A customer">
        {SAID.map((said) => (
          <button
            key={said.how}
            type="button"
            aria-pressed={text === said.text}
            onClick={() => {
              setText(said.text);
              setHow(said.how);
              run();
            }}
          >
            {said.how}
          </button>
        ))}
      </div>
      <label className={s.said}>
        <span>What the customer says. Change it and see where it goes.</span>
        <textarea
          rows={2}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setHow('Typed');
          }}
          data-said
        />
      </label>
      <button type="button" className={s.action} onClick={run}>
        Raise it
      </button>
      <div className={s.bench}>
        <Console kind="wave" steps={steps} at={at} />
        <Report ready={at >= steps.length} wait="Working on it" stamp={sorted.desk.short}>
          <p className={s.reply} data-desk>
            {sorted.desk.name}
          </p>
          <ul className={s.points}>
            <li>{sorted.found.length ? `The words that decided it: ${sorted.found.join(', ')}` : 'None of the words were in it, so it took the first department'}</li>
            <li>
              Wait for a live turn: place {AHEAD + 1}, about {(AHEAD + 1) * 5} minutes
            </li>
            <li>Or book a slot: every half hour, 9 to 6, in the next 7 days</li>
          </ul>
        </Report>
      </div>
      <p className={s.small}>The sorting here is the real method, with a shorter word list. The queue is made up.</p>
    </div>
  );
}

// One made-up listener who lives in Mumbai: how much they play in each half hour of their day.
const AT_HOME = [8, 7, 6, 5, 3, 2, 1, 1, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 3, 3, 2, 2, 2, 3, 3, 4, 4, 3, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 9, 10, 12, 12, 11, 10, 9, 9];
// Spotify writes every play down in UTC. Mumbai is 11 half hours ahead of it.
const HOME = 11;
const STORED = AT_HOME.map((_, i) => AT_HOME[(i + HOME) % 48]);
const ZONES = [
  { name: 'UTC', id: 'UTC', ahead: 0 },
  { name: 'Mumbai', id: 'Asia/Kolkata', ahead: 11 },
  { name: 'Tokyo', id: 'Asia/Tokyo', ahead: 18 },
];
const hourName = (h: number) => (h === 0 ? '12 am' : h === 12 ? '12 pm' : h < 12 ? `${h} am` : `${h - 12} pm`);

/** Chronicle: the same plays, read on three clocks. Only one of them is true. */
function Chronicle() {
  const [picked, setPicked] = useState(0);
  const { at, run } = useRun(5, 420);
  const zone = ZONES[picked];
  // The project's own step: move each stored play to local time, then count by hour.
  const hours = Array.from({ length: 24 }, (_, h) => [0, 1].reduce((sum, half) => sum + STORED[(h * 2 + half - zone.ahead + 48) % 48], 0));
  const most = Math.max(...hours);
  const peak = hours.indexOf(most);
  const total = hours.reduce((sum, n) => sum + n, 0);
  const night = hours.reduce((sum, n, h) => sum + (h >= 23 || h < 5 ? n : 0), 0);
  const day = hours.reduce((sum, n, h) => sum + (h >= 9 && h < 17 ? n : 0), 0);
  const off = Math.abs(zone.ahead - HOME) / 2;
  const steps: Step[] = [
    { name: 'Load', value: 'the zip from Spotify, into DuckDB' },
    { name: 'Clock', value: zone.ahead ? `UTC to ${zone.id}, +${Math.floor(zone.ahead / 2)}:${zone.ahead % 2 ? '30' : '00'}` : 'left in UTC, as stored' },
    { name: 'Count', value: `by weekday and hour. Peak: ${hourName(peak)}` },
    { name: 'Night', value: `${(night / day).toFixed(2)}x night against day` },
    { name: 'Chapters', value: 'cut at the dates you gave' },
  ];

  return (
    <div className={s.chronicle}>
      <div className={s.choices} role="group" aria-label="Clock">
        {ZONES.map((item, i) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={picked === i}
            onClick={() => {
              setPicked(i);
              run();
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className={s.hours} aria-hidden="true">
        {hours.map((plays, hour) => (
          <i key={hour} style={{ transform: `scaleY(${Math.max(plays / 24, 0.02)})` }} data-night={hour >= 23 || hour < 5 || undefined} />
        ))}
      </div>
      <p className={s.scale}>
        <span>midnight</span>
        <span>noon</span>
        <span>midnight</span>
      </p>
      <div className={s.bench}>
        <Console kind="clock" steps={steps} at={at} />
        <Report ready={at >= steps.length} wait="Reading the history" stamp={hourName(peak)} tone={off ? 'bad' : 'good'}>
          <Meter share={night / total} label={`${Math.round((night / total) * 100)}% of plays between 11 pm and 5 am`} />
          <ul className={s.points}>
            <li>{off ? `Wrong by ${off} hours. This listener lives in Mumbai` : 'This is where the listener lives. These hours are true'}</li>
            <li>The same plays each time. Only the clock they are read on changes</li>
          </ul>
        </Report>
      </div>
      <p className={s.small}>One made-up listener. Spotify stores every play in UTC, so the first thing Chronicle does is move it home.</p>
    </div>
  );
}

const ROWS = 11;
const COLS = 23;
const FROM = COLS + 1;
const TO = (ROWS - 2) * COLS + COLS - 2;

/** A maze from a seed: the same seed gives the same maze, as in the project. True is a wall. */
function maze(seed: number) {
  const walls = new Array<boolean>(ROWS * COLS).fill(true);
  let t = seed * 7919 + 13;
  const random = (n: number) => {
    t = (t * 1664525 + 1013904223) >>> 0;
    return t % n;
  };
  const stack = [FROM];
  walls[FROM] = false;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const ways = [2 * COLS, 2, -2 * COLS, -2].filter((d) => {
      const next = cur + d;
      const col = next % COLS;
      return next > COLS && next < walls.length - COLS && col > 0 && col < COLS - 1 && Math.abs(col - (cur % COLS)) <= 2 && walls[next];
    });
    if (!ways.length) {
      stack.pop();
      continue;
    }
    const d = ways[random(ways.length)];
    walls[cur + d / 2] = false;
    walls[cur + d] = false;
    stack.push(cur + d);
  }
  // A few extra openings, so there is more than one way round
  for (let i = COLS + 1; i < walls.length - COLS - 1; i++) {
    const col = i % COLS;
    if (!walls[i] || col === 0 || col === COLS - 1) continue;
    const across = !walls[i - 1] && !walls[i + 1] && walls[i - COLS] && walls[i + COLS];
    const down = !walls[i - COLS] && !walls[i + COLS] && walls[i - 1] && walls[i + 1];
    if ((across || down) && random(100) < 14) walls[i] = false;
  }
  return walls;
}

type Trace = { kind: 'wait' | 'seen' | 'path'; at: number };
const SEARCHES: Record<string, string> = {
  BFS: 'It spreads out evenly, so the first path it finds is the shortest',
  'A*': 'Like BFS, but it tries the cells nearer the goal first',
  Greedy: 'It runs straight at the goal. Fast, and not always the shortest',
  DFS: 'It follows one corridor to its end before it tries another',
};

/**
 * The project's own method: the search runs to the end first, at full speed, and writes down
 * every cell it puts in line and every cell it looks at. The page then plays that list.
 */
function search(walls: boolean[], how: string) {
  const guess = (i: number) => Math.abs(Math.floor(i / COLS) - (ROWS - 2)) + Math.abs((i % COLS) - (COLS - 2));
  const cost = new Map<number, number>([[FROM, 0]]);
  const from = new Map<number, number>();
  const line = [FROM];
  const seen = new Set<number>();
  const trace: Trace[] = [];
  const rank = (i: number) => (how === 'A*' ? cost.get(i)! : 0) + guess(i);

  while (line.length) {
    let pick = how === 'DFS' ? line.length - 1 : 0;
    if (how === 'A*' || how === 'Greedy') {
      for (let k = 1; k < line.length; k++) {
        if (rank(line[k]) < rank(line[pick]) || (rank(line[k]) === rank(line[pick]) && guess(line[k]) < guess(line[pick]))) pick = k;
      }
    }
    const cur = line.splice(pick, 1)[0];
    if (seen.has(cur)) continue;
    seen.add(cur);
    trace.push({ kind: 'seen', at: cur });
    if (cur === TO) break;
    for (const d of [COLS, 1, -COLS, -1]) {
      const next = cur + d;
      if (walls[next] || seen.has(next)) continue;
      const far = cost.get(cur)! + 1;
      if (how === 'A*' ? far < (cost.get(next) ?? Infinity) : !cost.has(next)) {
        cost.set(next, far);
        from.set(next, cur);
        line.push(next);
        trace.push({ kind: 'wait', at: next });
      }
    }
  }

  let path = 0;
  if (seen.has(TO)) {
    for (let at = TO; at !== FROM; at = from.get(at)!) {
      trace.push({ kind: 'path', at });
      path++;
    }
    trace.push({ kind: 'path', at: FROM });
  }
  return { trace, looked: seen.size, path };
}

/** Algomotion: a real search on a maze, recorded first, then played. Drag the bar to go back. */
function Algo() {
  const [how, setHow] = useState('BFS');
  const [seed, setSeed] = useState(1);
  // The cells you flipped, kept only for the maze they were flipped on
  const [flips, setFlips] = useState<{ seed: number; cells: number[] }>({ seed: 1, cells: [] });
  const [played, setPlayed] = useState(0);
  const [playing, setPlaying] = useState(false);

  const walls = maze(seed);
  if (flips.seed === seed) for (const i of flips.cells) walls[i] = !walls[i];
  const run = search(walls, how);
  const best = how === 'BFS' ? run : search(walls, 'BFS');
  const total = run.trace.length;
  const open = walls.filter((wall) => !wall).length;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setPlayed((now) => {
        if (now + 2 >= total) setPlaying(false);
        return Math.min(now + 2, total);
      });
    }, 30);
    return () => clearInterval(timer);
  }, [playing, total]);

  // The grid comes from the maze and the steps played so far, so it can go back as well as on.
  const cells = new Map<number, Trace['kind']>();
  let looked = 0;
  for (const step of run.trace.slice(0, played)) {
    cells.set(step.at, step.kind);
    if (step.kind === 'seen') looked++;
  }
  const done = played >= total;
  const reset = (next: () => void) => {
    next();
    setPlayed(0);
    setPlaying(false);
  };
  const steps: Step[] = [
    { name: 'Record', value: `ran to the end: ${total} steps written down` },
    { name: 'Play', value: `step ${played} of ${total}`, live: true },
    { name: 'Count', value: run.path ? `${run.looked} cells looked at, a path of ${run.path}` : `${run.looked} cells looked at, no way out` },
  ];

  return (
    <div className={s.algo}>
      <div className={s.choices} role="group" aria-label="Algorithm">
        {Object.keys(SEARCHES).map((item) => (
          <button key={item} type="button" aria-pressed={how === item} onClick={() => reset(() => setHow(item))}>
            {item}
          </button>
        ))}
      </div>
      <div
        className={s.maze}
        style={{ '--cols': COLS } as CSSProperties}
        data-maze
        onClick={(event) => {
          const at = Number((event.target as HTMLElement).dataset.at);
          if (!at || at === FROM || at === TO || at % COLS === 0 || at % COLS === COLS - 1 || at < COLS || at >= walls.length - COLS) return;
          const before = flips.seed === seed ? flips.cells : [];
          reset(() => setFlips({ seed, cells: before.includes(at) ? before.filter((i) => i !== at) : [...before, at] }));
        }}
      >
        {walls.map((wall, i) => (
          <i key={i} data-at={i} data-cell={i === FROM || i === TO ? 'end' : wall ? 'wall' : cells.get(i)} />
        ))}
      </div>
      <div className={s.choices}>
        <button
          type="button"
          className={s.action}
          disabled={playing}
          onClick={() => {
            // With reduced motion there is no playback: it goes to the last step.
            if (prefersReducedMotion()) return setPlayed(total);
            if (done) setPlayed(0);
            setPlaying(true);
          }}
        >
          Search
        </button>
        <button type="button" onClick={() => reset(() => setSeed(seed + 1))}>
          New maze
        </button>
        <label className={s.seek}>
          <span>Drag to go back</span>
          <input
            type="range"
            min={0}
            max={total}
            value={played}
            data-seek
            onChange={(event) => {
              setPlaying(false);
              setPlayed(Number(event.target.value));
            }}
          />
        </label>
      </div>
      <p className={s.count} data-count>
        Cells looked at: <b>{looked}</b>
      </p>
      <div className={s.bench}>
        <Console kind="maze" steps={steps} at={done ? 3 : 1} />
        <Report ready={done} wait={playing ? 'Playing it back' : 'Press Search'} stamp={`${run.looked} cells`}>
          <Meter share={run.looked / open} label={`${run.looked} of the ${open} open cells`} />
          <ul className={s.points}>
            <li data-path>
              {run.path ? `Path: ${run.path} moves${run.path === best.path ? ', the shortest there is' : `. The shortest is ${best.path}`}` : 'There is no way out of this one'}
            </li>
            {how !== 'BFS' && <li>BFS looks at {best.looked} on this maze</li>}
            <li>{SEARCHES[how]}</li>
          </ul>
        </Report>
      </div>
      <p className={s.small}>A real search. It ran to the end before the first cell lit up. What you watch is the recording. Click a cell to add or remove a wall.</p>
    </div>
  );
}

// Three made-up files, and what each step of the real pipeline would say about them.
// A program and a document go down different roads after the type is known.
type Sample = {
  file: string;
  steps: Step[];
  bad: boolean;
  share: number;
  points: string[];
  families?: [name: string, share: number][];
};
const SAMPLES: Sample[] = [
  {
    file: 'photo_viewer.exe',
    bad: true,
    share: 0.97,
    steps: [
      { name: 'Unpack', value: 'not an archive' },
      { name: 'Identify', value: 'starts with MZ: a Windows program' },
      { name: 'Model', value: 'LightGBM on its structure: 0.97' },
      { name: 'Read', value: '212 imports, 5 sections, 1 packed' },
      { name: 'YARA', value: '2 of 74 rules matched' },
      { name: 'Family', value: 'Gemini read the report' },
    ],
    points: ['One section has entropy 7.4, so it is packed', 'It imports VirtualAlloc and WriteProcessMemory', 'It reads the browser profile folders'],
    families: [
      ['Info Stealers', 0.46],
      ['Trojan Family', 0.31],
      ['Backdoor and C2', 0.14],
    ],
  },
  {
    file: 'salary_slip.xlsm',
    bad: true,
    share: 0.88,
    steps: [
      { name: 'Unpack', value: 'not an archive' },
      { name: 'Identify', value: 'a zip with a workbook in it: a spreadsheet' },
      { name: 'Macros', value: '1 VBA macro pulled out' },
      { name: 'Words', value: 'AutoOpen, Shell, powershell' },
      { name: 'YARA', value: 'no rule matched' },
      { name: 'Verdict', value: 'Gemini read the findings: 0.88' },
    ],
    points: ['The macro runs by itself when the file opens', 'It starts PowerShell with a hidden window', 'It builds a web address out of pieces'],
  },
  {
    file: 'notes.zip',
    bad: false,
    share: 0.03,
    steps: [
      { name: 'Unpack', value: 'a zip in a zip. One file inside: notes.pdf' },
      { name: 'Identify', value: 'a PDF, by its first bytes' },
      { name: 'Keys', value: 'no /JavaScript, no /OpenAction' },
      { name: 'Words', value: 'nothing embedded' },
      { name: 'YARA', value: 'no rule matched' },
      { name: 'Verdict', value: 'Gemini read the findings: 0.03' },
    ],
    points: ['No script in it, and nothing that runs on open', 'No file hidden inside it', 'No rule matched'],
  },
];

/** MalShield: pick a made-up file and follow it down the real pipeline to a verdict. */
function Mal() {
  const [picked, setPicked] = useState(0);
  const sample = SAMPLES[picked];
  const { at, run } = useRun(6, 500);
  return (
    <div className={s.mal}>
      <div className={s.choices} role="group" aria-label="A file">
        {SAMPLES.map((item, i) => (
          <button
            key={item.file}
            type="button"
            aria-pressed={picked === i}
            onClick={() => {
              setPicked(i);
              run();
            }}
          >
            {item.file}
          </button>
        ))}
      </div>
      <div className={s.bench}>
        <Console kind="file" steps={sample.steps} at={at} />
        <Report ready={at >= sample.steps.length} wait="Checking it" stamp={sample.bad ? 'Do not open' : 'Clean'} tone={sample.bad ? 'bad' : 'good'}>
          <Meter share={sample.share} label={`${Math.round(sample.share * 100)}% likely to be malware`} />
          <ul className={s.points} data-verdict>
            {sample.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          {sample.families && (
            <dl className={s.families}>
              {sample.families.map(([name, share]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>
                    <i style={{ '--share': share } as CSSProperties} />
                    {Math.round(share * 100)}%
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Report>
      </div>
      <p className={s.small}>Three made-up files and made-up results, to show the road each one takes. No file is checked or run in your browser.</p>
    </div>
  );
}

// From my own report: 4,101 runs on an RTX 5070. Each model did 33 checked tasks, 5 times each.
const MODELS = [
  { name: 'Gemma 4 12B coder', pass: 79, right: 131, perHour: 1588 },
  { name: 'Gemma 4 12B', pass: 87, right: 143, perHour: 1519 },
  { name: 'Gemma 4 E4B', pass: 70, right: 115, perHour: 1357 },
  { name: 'Gemma 4 26B', pass: 93, right: 154, perHour: 808 },
  { name: 'GPT-OSS 20B', pass: 81, right: 134, perHour: 792 },
];
const place = (n: number) => ['1st', '2nd', '3rd', '4th', '5th'][n];

/** Local LLM lab: the same five models, ranked by two different numbers. Pick one to see its run. */
function Lab() {
  const [byHour, setByHour] = useState(false);
  const [picked, setPicked] = useState('Gemma 4 26B');
  const { at, run } = useRun(5, 460);
  const key = byHour ? 'perHour' : 'pass';
  const top = Math.max(...MODELS.map((m) => m[key]));
  const ranked = [...MODELS].sort((a, b) => b[key] - a[key]);
  const model = MODELS.find((m) => m.name === picked)!;
  const rank = (by: 'pass' | 'perHour') => [...MODELS].sort((a, b) => b[by] - a[by]).indexOf(model);
  const steps = [
    { name: 'Load', value: 'llama-server starts with this model' },
    { name: 'Ask', value: '33 tasks, 5 times each' },
    { name: 'Check', value: 'tests run, SQL rows compared' },
    { name: 'Count', value: `${model.right} of 165 right` },
    { name: 'Rate', value: `${model.perHour.toLocaleString('en')} right answers an hour` },
  ];
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
        {ranked.map((item) => (
          <li key={item.name}>
            <button
              type="button"
              aria-pressed={picked === item.name}
              onClick={() => {
                setPicked(item.name);
                run();
              }}
            >
              {item.name}
            </button>
            <i style={{ transform: `scaleX(${item[key] / top})` }} />
            <b>{byHour ? item.perHour.toLocaleString('en') : `${item.pass}%`}</b>
          </li>
        ))}
      </ol>
      <div className={s.bench}>
        <Console kind="model" steps={steps} at={at} />
        <Report ready={at >= steps.length} wait="Running the tasks" stamp={`${model.pass}%`}>
          <p className={s.reply} data-model>
            {model.name}
          </p>
          <Meter share={model.right / 165} label={`${model.right} of 165 runs right`} />
          <ul className={s.points}>
            <li>{place(rank('pass'))} of 5 on tasks passed</li>
            <li>{place(rank('perHour'))} of 5 on right answers per hour</li>
          </ul>
        </Report>
      </div>
      <p className={s.small}>Real results. The biggest model wins the first list and comes fourth in the second. Pick a model to see its run.</p>
    </div>
  );
}

const DEMOS: Record<string, { title: string; body: () => ReactElement }> = {
  scrub: { title: 'Fit a size', body: Scrub },
  neat: { title: 'The review queue', body: Neat },
  'prats-deck': { title: 'Tap through it', body: Deck },
  omnicompiler: { title: 'Debug it', body: Omni },
  floatchat: { title: 'Ask it', body: Float },
  'idea-hackathon': { title: 'Raise a query', body: Idea },
  chronicle: { title: 'Three clocks', body: Chronicle },
  algomotion: { title: 'Find the way out', body: Algo },
  malshield: { title: 'Check a file', body: Mal },
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
