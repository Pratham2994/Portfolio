import { useEffect, useState, type ReactElement } from 'react';

import { track } from '~/lib/analytics';

import s from './Demo.module.css';

/* One small working part per project. Each shows the idea of the project in a few seconds. */

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
  return (
    <div className={s.scrub}>
      <div className={s.choices} role="group" aria-label="Size limit">
        {limits.map((limit) => (
          <button key={limit.name} type="button" aria-pressed={mb === limit.mb} onClick={() => setMb(limit.mb)}>
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

  return (
    <div className={s.neat}>
      <p className={s.result} data-result>
        <b>{left}</b>
        {left ? `files to look at, in ${open.length} ${open.length === 1 ? 'decision' : 'decisions'}.` : 'files to look at. Downloads is clean.'}
        {freed > 0 && ` ${freed} MB back, all of it still in the Recycle Bin.`}
      </p>
      <button type="button" className={s.action} disabled={!sure.length} onClick={() => setDone([...done, ...sure])}>
        Apply the {sure.length || ''} sure ones
      </button>
      <ul className={s.queue}>
        {GROUPS.map((group) =>
          done.includes(group.id) ? (
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

const CODE: Record<string, string[]> = {
  Python: ['total = 0', 'for n in [3, 4, 5]:', '    total += n', 'print(total)'],
  JavaScript: ['let total = 0;', 'for (const n of [3, 4, 5]) {', '  total += n;', '} console.log(total);'],
  Java: ['int total = 0;', 'for (int n : new int[]{3, 4, 5}) {', '  total += n;', '} System.out.println(total);'],
  'C++': ['int total = 0;', 'for (int n : {3, 4, 5}) {', '  total += n;', '} std::cout << total;'],
  Go: ['total := 0', 'for _, n := range []int{3, 4, 5} {', '  total += n', '} fmt.Println(total)'],
};
// The same run in every language: the line the debugger is on, and what it can see there.
const RUN = [
  { line: 0, total: 0, n: '-' },
  { line: 1, total: 0, n: '3' },
  { line: 2, total: 3, n: '3' },
  { line: 1, total: 3, n: '4' },
  { line: 2, total: 7, n: '4' },
  { line: 1, total: 7, n: '5' },
  { line: 2, total: 12, n: '5' },
  { line: 3, total: 12, n: '-' },
];

/** OmniCompiler: switch the language mid-run. The debugger state stays the same. */
function Omni() {
  const [lang, setLang] = useState('Python');
  const [step, setStep] = useState(2);
  const at = RUN[step];
  return (
    <div className={s.omni}>
      <div className={s.choices} role="group" aria-label="Language">
        {Object.keys(CODE).map((name) => (
          <button key={name} type="button" aria-pressed={lang === name} onClick={() => setLang(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className={s.debugger}>
        <ol className={s.code}>
          {CODE[lang].map((text, i) => (
            <li key={i} data-here={i === at.line || undefined}>
              {text}
            </li>
          ))}
        </ol>
        <dl className={s.watch} data-watch>
          <div>
            <dt>total</dt>
            <dd>{at.total}</dd>
          </div>
          <div>
            <dt>n</dt>
            <dd>{at.n}</dd>
          </div>
        </dl>
      </div>
      <button type="button" className={s.action} onClick={() => setStep((step + 1) % RUN.length)}>
        Step
      </button>
    </div>
  );
}

const ASKS = [
  { q: 'How warm was the Arabian Sea in March?', a: 'About 27.4 °C at the surface, from 212 float profiles.', points: [22, 30, 38, 46, 52, 58, 61, 66] },
  { q: 'Where is the water saltiest?', a: 'The northern Arabian Sea: about 36.6 on the salinity scale.', points: [58, 60, 55, 62, 64, 61, 66, 63] },
  { q: 'Show temperature against depth', a: 'It falls fast in the first 200 m, then levels out near 4 °C.', points: [70, 52, 36, 26, 20, 17, 15, 14] },
];

/** FloatChat: ask one of three questions and get an answer with a chart. */
function Float() {
  const [asked, setAsked] = useState(0);
  const { a, points } = ASKS[asked];
  const path = points.map((y, i) => `${i ? 'L' : 'M'}${i * 40 + 10} ${90 - y}`).join(' ');
  return (
    <div className={s.float}>
      <div className={s.choices} role="group" aria-label="Question">
        {ASKS.map((ask, i) => (
          <button key={ask.q} type="button" aria-pressed={asked === i} onClick={() => setAsked(i)}>
            {ask.q}
          </button>
        ))}
      </div>
      <div className={s.answer}>
        <p data-answer>{a}</p>
        <svg viewBox="0 0 300 100" aria-hidden="true">
          <path d="M10 90 H290" className={s.axis} />
          <path d={path} className={s.line} />
          {points.map((y, i) => (
            <circle key={i} cx={i * 40 + 10} cy={90 - y} r="3.5" className={s.dot} />
          ))}
        </svg>
      </div>
      <p className={s.small}>Sample answers, to show the shape of it. The real one asks the live float data.</p>
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
  omnicompiler: { title: 'Step through it', body: Omni },
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
