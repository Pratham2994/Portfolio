import type { CSSProperties, ReactElement } from 'react';

import { NATIVE } from './data';
import s from './Sketch.module.css';

const at = (i: number) => ({ '--i': i }) as CSSProperties;

/** OmniCompiler: one page in the middle, and the real debugger of each language around it. */
function Hub() {
  const names = Object.keys(NATIVE);
  const spot = (i: number) => {
    const turn = ((-90 + i * 72) * Math.PI) / 180;
    return { x: 180 + Math.cos(turn) * 128, y: 150 + Math.sin(turn) * 108 };
  };
  return (
    <svg viewBox="0 0 360 300">
      {names.map((name, i) => {
        const { x, y } = spot(i);
        return <path key={name} className={s.wire} d={`M180 150 L${x} ${y}`} />;
      })}
      {names.map((name, i) => {
        const { x, y } = spot(i);
        // The word goes out to one debugger and its answer comes back, each one on its turn.
        return <circle key={name} className={s.dot} r="5" style={{ ...at(i), offsetPath: `path('M180 150 L${x} ${y}')` }} />;
      })}
      <g data-part>
        <circle className={s.core} cx="180" cy="150" r="40" />
        <text className={s.name} x="180" y="146">
          ONE
        </text>
        <text className={s.name} x="180" y="162">
          PAGE
        </text>
      </g>
      {names.map((name, i) => {
        const { x, y } = spot(i);
        return (
          <g key={name} data-part>
            <rect className={s.box} x={x - 46} y={y - 19} width="92" height="38" rx="3" />
            <text className={s.name} x={x} y={y - 2}>
              {name}
            </text>
            <text className={s.note} x={x} y={y + 12}>
              {NATIVE[name]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Local LLM lab: many runs go in, each one is checked, and one number comes out. */
function Funnel() {
  const lanes = [34, 62, 90, 118, 146];
  return (
    <svg viewBox="0 0 400 190">
      <path className={s.fill} d="M78 18 L196 66 L196 114 L78 162 Z" />
      {lanes.map((y, i) => (
        <circle key={y} className={s.dot} r="4.5" style={{ ...at(i), offsetPath: `path('M70 ${y} L196 90 L330 90')` }} />
      ))}
      <g data-part>
        {lanes.map((y) => (
          <rect key={y} className={s.box} x="20" y={y - 9} width="50" height="18" rx="2" />
        ))}
        <text className={s.note} x="45" y="182">
          models x tasks
        </text>
      </g>
      <g data-part>
        <rect className={s.box} x="196" y="62" width="112" height="56" rx="3" />
        <text className={s.name} x="252" y="86">
          4,101 RUNS
        </text>
        <text className={s.note} x="252" y="102">
          each one checked
        </text>
      </g>
      <path className={s.wire} d="M308 90 H330" />
      <g data-part>
        <circle className={s.core} cx="364" cy="90" r="34" />
        <text className={s.name} x="364" y="87">
          ONE
        </text>
        <text className={s.name} x="364" y="102">
          NUMBER
        </text>
      </g>
    </svg>
  );
}

// Ten measurements of one corner, each against the field: above the line is more than the others.
const AGAINST = [-14, 9, 17, -6, 12, -18, 5, -10, 15, -4];
const READERS = [
  ['TREES', 'boosted'],
  ['FOREST', 'random'],
  ['LOGISTIC', 'regression'],
] as const;

/** Blind Lap: a corner becomes ten numbers against the field. Three models read them, and one name comes out. */
function Read() {
  const rows = [48, 96, 144];
  const ways = rows.map((y) => `M228 96 C 242 96, 238 ${y}, 252 ${y} H316 C 336 ${y}, 330 96, 346 96`);
  return (
    <svg viewBox="0 0 400 192">
      <path className={s.wire} d="M96 96 H116" />
      {ways.map((way) => (
        <path key={way} className={s.wire} d={way} />
      ))}
      {ways.map((way, i) => (
        <circle key={way} className={s.dot} r="4.5" style={{ ...at(i), offsetPath: `path('M96 96 H228 ${way.slice(8)}')` }} />
      ))}
      <g data-part>
        <rect className={s.box} x="2" y="70" width="94" height="52" rx="3" />
        <text className={s.name} x="49" y="93">
          A CORNER
        </text>
        <text className={s.note} x="49" y="108">
          of a real lap
        </text>
      </g>
      <g data-part>
        <rect className={s.box} x="116" y="54" width="112" height="84" rx="3" />
        <text className={s.name} x="172" y="72">
          10 NUMBERS
        </text>
        <text className={s.note} x="172" y="85">
          against the field
        </text>
        <path className={s.wire} d="M132 114 H212" />
        {AGAINST.map((value, i) => (
          <rect key={i} className={s.core} x={137 + i * 7.4} y={value > 0 ? 114 - value : 114} width="4.4" height={Math.abs(value)} />
        ))}
      </g>
      {READERS.map(([name, note], i) => (
        <g key={name} data-part>
          <rect className={s.box} x="252" y={rows[i] - 17} width="66" height="34" rx="3" />
          <text className={s.name} x="285" y={rows[i] - 2}>
            {name}
          </text>
          <text className={s.note} x="285" y={rows[i] + 10}>
            {note}
          </text>
        </g>
      ))}
      <g data-part>
        <circle className={s.core} cx="370" cy="96" r="28" />
        <text className={s.name} x="370" y="93">
          ONE
        </text>
        <text className={s.name} x="370" y="107">
          NAME
        </text>
      </g>
    </svg>
  );
}

/** Prats-Deck: the PC and the deck, and the one lead between them. */
function Lead() {
  const out = 'M252 62 C 214 34, 150 34, 112 62';
  const back = 'M112 100 C 150 128, 214 128, 252 100';
  return (
    <svg viewBox="0 0 364 170">
      <path className={s.wire} d={out} />
      <path className={s.wire} d={back} />
      <circle className={s.dot} r="5" style={{ ...at(0), offsetPath: `path('${out}')` }} />
      <circle className={s.dot} r="5" style={{ ...at(1), offsetPath: `path('${back}')` }} />
      <text className={s.note} x="182" y="28">
        keys and mouse, as plain USB
      </text>
      <text className={s.note} x="182" y="146">
        what the PC is doing
      </text>
      <g data-part>
        <rect className={s.box} x="14" y="46" width="98" height="64" rx="3" />
        <path className={s.wire} d="M46 124 H80 M63 110 V124" />
        <text className={s.name} x="63" y="76">
          THE PC
        </text>
        <text className={s.note} x="63" y="92">
          Python script
        </text>
      </g>
      <g data-part>
        <rect className={s.core} x="252" y="50" width="98" height="62" rx="10" />
        <text className={s.name} x="301" y="78">
          THE DECK
        </text>
        <text className={s.note} x="301" y="94">
          C++ on a Pico
        </text>
      </g>
    </svg>
  );
}

/** A row of parts, one after the other, with something that goes down the row. */
function Row({ parts }: { parts: [name: string, note: string][] }) {
  const step = 360 / parts.length;
  const mid = (i: number) => step * (i + 0.5);
  return (
    <svg viewBox="0 0 360 130">
      <path className={s.wire} d={`M${mid(0)} 60 H${mid(parts.length - 1)}`} />
      <circle className={s.dot} r="5" style={{ ...at(0), offsetPath: `path('M${mid(0)} 60 H${mid(parts.length - 1)}')` }} />
      {parts.map(([name, note], i) => (
        <g key={name} data-part>
          <rect className={i === parts.length - 1 ? s.core : s.box} x={mid(i) - step * 0.42} y="34" width={step * 0.84} height="52" rx="3" />
          <text className={s.name} x={mid(i)} y="58">
            {name}
          </text>
          <text className={s.note} x={mid(i)} y="73">
            {note}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Scrub: a file goes in, a command is built, a file comes out. */
const Cut = () => (
  <Row
    parts={[
      ['YOUR FILE', 'stays on your PC'],
      ['ONE COMMAND', 'shown, then run'],
      ['A NEW FILE', 'made on your PC'],
    ]}
  />
);

/** Sandglass: general rules are compiled once, into a table that the world reads on every step. */
const Rules = () => (
  <Row
    parts={[
      ['RULES', 'acids, fuels'],
      ['COMPILER', 'once, at load'],
      ['PAIR TABLE', 'what meets what'],
    ]}
  />
);

const LEVELS: [name: string, note: string][] = [
  ['YOUR QUESTION', 'in plain words'],
  ['GATEKEEPER', 'go on, ask back, or refuse'],
  ['ONE OF 5 TOOLS', 'it runs a real query'],
  ['THE FLOAT DATA', 'Postgres'],
];

/** FloatChat: a question goes down, a level at a time, to the data at the bottom. */
function Depth() {
  return (
    <svg viewBox="0 0 300 290">
      <path className={s.wire} d="M150 30 V250" />
      <circle className={s.dot} r="5" style={{ ...at(0), offsetPath: "path('M150 30 V250')" }} />
      {LEVELS.map(([name, note], i) => (
        <g key={name} data-part>
          <rect className={i === 0 ? s.core : s.box} x={50 + i * 14} y={12 + i * 70} width={200 - i * 28} height="46" rx="3" />
          <text className={s.name} x="150" y={32 + i * 70}>
            {name}
          </text>
          <text className={s.note} x="150" y={47 + i * 70}>
            {note}
          </text>
        </g>
      ))}
    </svg>
  );
}

const WAYS = ['TYPED', 'SPOKEN', 'RECORDED'];

/** iDEA: three ways in, one ticket, one desk. */
function Merge() {
  const way = (i: number) => `M96 ${34 + i * 56} C 140 ${34 + i * 56}, 130 90, 170 90`;
  return (
    <svg viewBox="0 0 360 180">
      {WAYS.map((name, i) => (
        <path key={name} className={s.wire} d={way(i)} />
      ))}
      <path className={s.wire} d="M238 90 H270" />
      {WAYS.map((name, i) => (
        <circle key={name} className={s.dot} r="5" style={{ ...at(i), offsetPath: `path('${way(i)} H270')` }} />
      ))}
      {WAYS.map((name, i) => (
        <g key={name} data-part>
          <rect className={s.box} x="10" y={16 + i * 56} width="86" height="36" rx="3" />
          <text className={s.name} x="53" y={38 + i * 56}>
            {name}
          </text>
        </g>
      ))}
      <g data-part>
        <rect className={s.box} x="170" y="66" width="68" height="48" rx="3" />
        <text className={s.name} x="204" y="88">
          TICKET
        </text>
        <text className={s.note} x="204" y="102">
          as text
        </text>
      </g>
      <g data-part>
        <circle className={s.core} cx="306" cy="90" r="36" />
        <text className={s.name} x="306" y="87">
          ONE
        </text>
        <text className={s.name} x="306" y="102">
          DESK
        </text>
      </g>
    </svg>
  );
}

const GATES = ['WHAT IS IT', 'MODEL', '74 RULES', 'SEALED RUN'];

/** MalShield: a row of gates. A file goes through each, and the last one is a sealed box. */
function Gates() {
  return (
    <svg viewBox="0 0 360 170">
      <path className={s.wire} d="M14 85 H346" />
      <circle className={s.dot} r="5" style={{ ...at(0), offsetPath: "path('M14 85 H300')" }} />
      {GATES.map((gate, i) => (
        <g key={gate} data-part>
          <path className={i === GATES.length - 1 ? s.core : s.box} d={`M${40 + i * 76} 26 h44 v118 h-44 Z`} />
          <text className={s.name} transform={`translate(${66 + i * 76} 85) rotate(-90)`}>
            {gate}
          </text>
        </g>
      ))}
      <text className={s.note} x="140" y="164">
        without running it
      </text>
      <text className={s.note} x="290" y="164">
        by running it
      </text>
    </svg>
  );
}

const EXPORT = [22, 46, 70, 94, 118, 142];

/** Chronicle: the files of an export become one table, and the table is read on your own clock. */
function Fan() {
  const file = (y: number) => `M64 ${y} C 110 ${y}, 110 82, 150 82`;
  return (
    <svg viewBox="0 0 360 170">
      {EXPORT.map((y) => (
        <path key={y} className={s.wire} d={file(y)} />
      ))}
      <path className={s.wire} d="M236 82 H268" />
      {[0, 2, 5].map((n, i) => (
        <circle key={n} className={s.dot} r="4.5" style={{ ...at(i), offsetPath: `path('${file(EXPORT[n])} H268')` }} />
      ))}
      <g data-part>
        {EXPORT.map((y) => (
          <rect key={y} className={s.box} x="14" y={y - 9} width="50" height="18" rx="2" />
        ))}
        <text className={s.note} x="39" y="166">
          the export
        </text>
      </g>
      <g data-part>
        <rect className={s.box} x="150" y="54" width="86" height="56" rx="3" />
        <text className={s.name} x="193" y="78">
          ONE TABLE
        </text>
        <text className={s.note} x="193" y="94">
          DuckDB, your PC
        </text>
      </g>
      <g data-part>
        <circle className={s.core} cx="306" cy="82" r="38" />
        <text className={s.name} x="306" y="79">
          YOUR
        </text>
        <text className={s.name} x="306" y="94">
          CLOCK
        </text>
      </g>
    </svg>
  );
}

const SKETCHES: Record<string, { draw: () => ReactElement; says: string; label: string }> = {
  'blind-lap': {
    draw: Read,
    says: 'The model that guesses at Monza never saw Monza, in any year. So it has to read the driver, not the circuit.',
    label: 'A corner of a real lap becomes ten numbers, each set against the field. Three models read them, and their guesses are joined into one name.',
  },
  omnicompiler: {
    draw: Hub,
    says: 'The page says one word. Each language hears it in the words of its own debugger.',
    label: 'One page in the middle, joined to five debuggers: bdb, Node Inspector, jdb, gdb and Delve.',
  },
  'local-llm-lab': {
    draw: Funnel,
    says: 'Every answer is checked for real. Then it all comes down to one number.',
    label: 'Models and tasks go in, 4,101 checked runs in the middle, and one number comes out.',
  },
  scrub: {
    draw: Cut,
    says: 'One function builds the command you see and the command that runs. So the two never disagree.',
    label: 'Your file, then one command that is shown before it runs, then a new file.',
  },
  floatchat: {
    draw: Depth,
    says: 'The model never answers from memory. It picks a tool, and the tool asks the data.',
    label: 'Your question goes to a gatekeeper, then to one of five tools, then to the float data.',
  },
  'idea-hackathon': {
    draw: Merge,
    says: 'Type it, speak it or record it. It becomes one ticket, for one desk.',
    label: 'Typed, spoken and recorded messages all become one ticket, which goes to one desk.',
  },
  malshield: {
    draw: Gates,
    says: 'First it is read without being run. Then it is run, inside a sealed box.',
    label: 'A file goes through four gates: what it is, a model, 74 rules, and a sealed run.',
  },
  chronicle: {
    draw: Fan,
    says: 'The files of your export become one table, on your own PC. Nothing is uploaded.',
    label: 'The files of an export become one table, which is read on your own clock.',
  },
  sandglass: {
    draw: Rules,
    says: 'Most reactions are not written by hand. The rules meet the properties, and the table writes itself.',
    label: 'General rules go into a compiler when the page loads, and it writes the table of what happens when two elements meet.',
  },
  'prats-deck': {
    draw: Lead,
    says: 'To the PC it is only a keyboard and a mouse. A small script sends back what the PC is doing.',
    label: 'The PC and the deck, joined by USB. Keys and mouse go one way, PC statistics go the other.',
  },
};

export const hasSketch = (slug: string) => slug in SKETCHES;

/** A small drawing of what a project is underneath: a few parts, one shape, one sentence. */
export function Sketch({ slug }: { slug: string }) {
  const { draw: Draw, says, label } = SKETCHES[slug];
  return (
    <figure className={s.sketch} data-flow data-sketch={slug}>
      <div role="img" aria-label={label}>
        <Draw />
      </div>
      <figcaption>{says}</figcaption>
    </figure>
  );
}
