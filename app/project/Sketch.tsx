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

const SKETCHES: Record<string, { draw: () => ReactElement; says: string; label: string }> = {
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
