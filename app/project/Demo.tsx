import { useEffect, useRef, useState, type ReactElement } from 'react';

import { drawCat } from '~/wall/cat-sprite';
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

const FILES = [
  ['setup_v2.exe', 'Installers'],
  ['report (1).pdf', 'Duplicates'],
  ['photos.zip', 'Archives'],
  ['invoice_oct.pdf', 'Receipts'],
  ['report.pdf', 'Duplicates'],
  ['driver_installer.msi', 'Installers'],
  ['photos', 'Archives'],
  ['report (2).pdf', 'Duplicates'],
  ['ticket_4821.pdf', 'Receipts'],
  ['game_launcher.exe', 'Installers'],
] as const;

/** Neat: a messy folder, and the same folder after one press. */
function Neat() {
  const [tidy, setTidy] = useState(false);
  const groups = [...new Set(FILES.map(([, group]) => group))];
  return (
    <div className={s.neat} data-tidy={tidy || undefined}>
      <button type="button" className={s.action} onClick={() => setTidy(!tidy)}>
        {tidy ? 'Mess it up again' : 'Tidy it'}
      </button>
      {tidy ? (
        <div className={s.groups}>
          {groups.map((group) => (
            <div key={group}>
              <h3>{group}</h3>
              <ul>
                {FILES.filter(([, g]) => g === group).map(([name]) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className={s.pile}>
          {FILES.map(([name], i) => (
            <li key={name} style={{ rotate: `${((i * 53) % 9) - 4}deg` }}>
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Prats-Deck: the small screen, with four of its apps. */
function Deck() {
  const apps = ['Clock', 'Monitor', 'Macros', 'Cat'] as const;
  const [app, setApp] = useState<(typeof apps)[number]>('Cat');
  const [now, setNow] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const read = () => setNow(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(read, 10_000);
    const first = setTimeout(read, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, []);

  // The cat dances: two frames, swapped twice a second.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (app !== 'Cat' || !ctx) return;
    let frame: 0 | 1 = 0;
    drawCat(ctx, frame);
    const timer = setInterval(() => {
      frame = frame ? 0 : 1;
      drawCat(ctx, frame);
    }, 260);
    return () => clearInterval(timer);
  }, [app]);

  return (
    <div className={s.deck}>
      <div className={s.device}>
        <div className={s.screen} data-app={app}>
          {app === 'Clock' && <p className={s.big}>{now}</p>}
          {app === 'Monitor' && (
            <ul className={s.meters}>
              {[
                ['CPU', 34],
                ['GPU', 71],
                ['RAM', 52],
              ].map(([name, value]) => (
                <li key={name}>
                  <span>{name}</span>
                  <i style={{ width: `${value}%` }} />
                </li>
              ))}
            </ul>
          )}
          {app === 'Macros' && (
            <ul className={s.macros}>
              {['Code', 'Mute', 'Shot', 'Build', 'Lock', 'Play'].map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          )}
          {app === 'Cat' && <canvas ref={canvas} width={16} height={10} className={s.pet} aria-label="A pixel cat, dancing" />}
        </div>
      </div>
      <div className={s.choices} role="group" aria-label="Apps">
        {apps.map((name) => (
          <button key={name} type="button" aria-pressed={app === name} onClick={() => setApp(name)}>
            {name}
          </button>
        ))}
      </div>
      <p className={s.small}>The meter values here are examples. On the real one they come from the PC.</p>
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
  neat: { title: 'Try it', body: Neat },
  'prats-deck': { title: 'On the screen', body: Deck },
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
