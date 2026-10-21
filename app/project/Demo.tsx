import { useEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';

import { track } from '~/lib/analytics';
import { prefersReducedMotion } from '~/lib/motion';

import { ASKS, FLOATS, HOME, SAID, STORED, YEARS } from './data';
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

type Kind = 'film' | 'folder' | 'device' | 'wave' | 'file' | 'model' | 'clock';

// What is printed at the head of the slip, for each kind of job.
const JOBS: Record<Kind, string> = { film: 'Encode job', folder: 'Folder scan', device: 'One tap', wave: 'One question', file: 'One file', model: 'One model', clock: 'One history' };

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
      <div className={s.bench} data-look="bar">
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
      <div className={s.bench} data-look="list">
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
      <div className={s.bench} data-look="chat">
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
      {/* What was said is shown, not typed: these are three set messages, not a live service. */}
      <p className={s.said}>
        <span>What the customer says</span>
        <q data-said>{text}</q>
      </p>
      <button type="button" className={s.action} onClick={run}>
        Raise it
      </button>
      <div className={s.bench} data-look="steps">
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

const ZONES = [
  { name: 'UTC', id: 'UTC', ahead: 0 },
  { name: 'Mumbai', id: 'Asia/Kolkata', ahead: 11 },
  { name: 'Tokyo', id: 'Asia/Tokyo', ahead: 18 },
];
// Hours listened in each hour of each weekday, in Mumbai time. Row 0 is Monday.
const WEEK = [
  [38, 12, 2, 0, 2, 1, 3, 9, 23, 41, 47, 31, 34, 40, 40, 43, 47, 51, 53, 37, 43, 39, 43, 43],
  [38, 11, 3, 1, 1, 0, 3, 7, 24, 36, 43, 41, 36, 46, 39, 36, 43, 56, 64, 46, 37, 42, 42, 50],
  [40, 15, 5, 3, 2, 4, 3, 7, 22, 40, 44, 37, 41, 49, 43, 42, 53, 52, 44, 40, 39, 40, 33, 37],
  [38, 15, 5, 2, 0, 1, 2, 4, 18, 33, 45, 32, 35, 42, 36, 42, 50, 53, 52, 42, 40, 35, 46, 47],
  [37, 18, 4, 0, 0, 3, 3, 5, 21, 30, 30, 33, 43, 43, 47, 42, 41, 44, 44, 38, 40, 33, 37, 47],
  [43, 13, 4, 1, 1, 2, 0, 2, 7, 12, 21, 27, 39, 40, 36, 34, 34, 38, 39, 40, 43, 49, 44, 43],
  [44, 24, 9, 1, 0, 0, 0, 3, 4, 9, 19, 31, 50, 50, 56, 69, 76, 72, 63, 63, 56, 53, 48, 50],
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourName = (h: number) => (h === 0 ? '12 am' : h === 12 ? '12 pm' : h < 12 ? `${h} am` : `${h - 12} pm`);

/** Chronicle: my own listening history. The same plays, read on three clocks, then cut by week and by year. */
function Chronicle() {
  // It opens on the clock Spotify stores, which is the wrong one. Picking home puts it right.
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
  const heat = Math.max(...WEEK.flat());
  const tallest = Math.max(...YEARS.map(([, n]) => n));
  const steps: Step[] = [
    { name: 'Load', value: '104,329 plays, 12 files, into DuckDB' },
    { name: 'Clock', value: zone.ahead ? `UTC to ${zone.id}, +${Math.floor(zone.ahead / 2)}:${zone.ahead % 2 ? '30' : '00'}` : 'left in UTC, as stored' },
    { name: 'Count', value: `by weekday and hour. Peak: ${hourName(peak)}` },
    { name: 'Night', value: `${(night / day).toFixed(2)}x night against day` },
    { name: 'Chapters', value: 'cut into the 7 chapters I gave it' },
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
          <i key={hour} style={{ transform: `scaleY(${Math.max(plays / 370, 0.02)})` }} data-night={hour >= 23 || hour < 5 || undefined} />
        ))}
      </div>
      <p className={s.scale}>
        <span>midnight</span>
        <span>noon</span>
        <span>midnight</span>
      </p>
      <div className={s.bench} data-look="pills">
        <Console kind="clock" steps={steps} at={at} />
        <Report ready={at >= steps.length} wait="Reading the history" stamp={hourName(peak)} tone={off ? 'bad' : 'good'}>
          <Meter share={night / total} label={`${Math.round((night / total) * 100)}% of the hours fall between 11 pm and 5 am`} />
          <ul className={s.points}>
            <li>{off ? `Wrong by ${off} hours. I live in Mumbai` : 'This is where I live. These hours are true'}</li>
            <li>The same plays each time. Only the clock they are read on changes</li>
          </ul>
        </Report>
      </div>

      {/* The rest is what it found once the clock was right. Numbers only: what I played stays with me. */}
      <div className={s.found}>
        <figure className={s.week}>
          <figcaption>My week, in Mumbai time. Each square is one hour.</figcaption>
          <div className={s.weekGrid} role="img" aria-label="Listening by weekday and hour. Quiet from 2 am to 7 am, loudest on Sunday afternoon.">
            {WEEK.map((row, d) => (
              <div key={d}>
                <span>{WEEKDAYS[d]}</span>
                {row.map((n, h) => (
                  <i key={h} style={{ '--heat': Math.pow(n / heat, 0.75), '--i': d + h } as CSSProperties} />
                ))}
              </div>
            ))}
          </div>
        </figure>
        <figure className={s.yearly}>
          <figcaption>Hours a year.</figcaption>
          <ol>
            {YEARS.map(([year, n], i) => (
              <li key={year} style={{ '--share': n / tallest, '--i': i } as CSSProperties}>
                <span>{year}</span>
                <i />
                <b>{n.toLocaleString('en')}</b>
              </li>
            ))}
          </ol>
        </figure>
        <dl className={s.records}>
          <div>
            <dt>5,059</dt>
            <dd>hours in all. That is 211 days with no sleep</dd>
          </div>
          <div>
            <dt>1,021</dt>
            <dd>days in a row with music</dd>
          </div>
          <div>
            <dt>218</dt>
            <dd>plays of one song in one day</dd>
          </div>
          <div>
            <dt>70%</dt>
            <dd>of my skips come in the first 30 seconds</dd>
          </div>
        </dl>
      </div>
      <p className={s.small}>My own export, counted on my own PC. Spotify stores every play in UTC, so the first thing Chronicle does is move it home.</p>
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
      <div className={s.bench} data-look="report">
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

const DEMOS: Record<string, { title: string; body: () => ReactElement }> = {
  scrub: { title: 'Fit a size', body: Scrub },
  neat: { title: 'The review queue', body: Neat },
  floatchat: { title: 'Ask it', body: Float },
  'idea-hackathon': { title: 'Raise a query', body: Idea },
  chronicle: { title: 'My own history', body: Chronicle },
  malshield: { title: 'Check a file', body: Mal },
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
