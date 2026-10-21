import type { CSSProperties, ReactElement } from 'react';

import type { ArtTemplate } from '~/content/schema';

import s from './art.module.css';

type ArtProps = { motif?: string };

// Fixed pseudo-random values, so the pre-rendered HTML and the client agree.
function series(seed: number, count: number, min: number, max: number): number[] {
  let state = seed;
  return Array.from({ length: count }, () => {
    state = (state * 16807) % 2147483647;
    return Math.round(min + (state / 2147483647) * (max - min));
  });
}

const vars = (values: Record<string, string | number>) => values as CSSProperties;
const times = <T,>(count: number, render: (i: number) => T) => Array.from({ length: count }, (_, i) => render(i));

function Frames() {
  const tones = [18, 34, 52, 40, 26, 60];
  return (
    <div className={s.frames}>
      {tones.map((tone, i) => (
        <i key={i} style={vars({ '--tone': `${tone}%` })} />
      ))}
      <b className={s.trim} />
    </div>
  );
}

function Grid() {
  const x = series(3, 15, -13, 13);
  const y = series(5, 15, -9, 9);
  const r = series(7, 15, -80, 80);
  return (
    <div className={s.grid}>
      {times(15, (i) => (
        <i key={i} style={vars({ '--x': `${x[i]}cqw`, '--y': `${y[i]}cqw`, '--r': `${r[i]}deg`, animationDelay: `${i * 30}ms` })} />
      ))}
    </div>
  );
}

function Bars({ motif }: ArtProps) {
  if (motif === 'rank') {
    const widths = [96, 88, 79, 64, 52, 37];
    return (
      <div className={s.rank}>
        {widths.map((width, i) => (
          <i key={i} style={vars({ '--w': `${width}%`, animationDelay: `${i * 90}ms` })} />
        ))}
      </div>
    );
  }
  const speeds = series(13, 13, 600, 1500);
  return (
    <div className={s.eq}>
      {speeds.map((ms, i) => (
        <i key={i} style={{ animationDuration: `${ms}ms`, animationDelay: `-${(i * 137) % 900}ms` }} />
      ))}
    </div>
  );
}

// The sand world, one unit to a cell, 48 across and 40 down. Worked out once, so the
// pre-rendered page and the client draw the same grains.
const SAND_W = 48;
const SAND_H = 40;
const FLOOR = SAND_H - 1;
type Cell = [x: number, y: number, tone: string];
const SAND = (() => {
  const jitter = series(17, SAND_W, -1, 1);
  const tone = series(19, 600, 0, 9);
  let n = 0;
  const pick = (tones: string[]) => tones[tone[n++ % tone.length] % tones.length];
  const pile: Cell[] = [];
  // A heap under a falling stream: highest under the stream, and a little rough on its slopes.
  for (let x = 1; x <= 31; x++) {
    const tall = Math.max(0, Math.round(15 - Math.abs(x - 16) + (x === 16 ? 0 : jitter[x])));
    for (let y = FLOOR - tall; y < FLOOR; y++) pile.push([x, y, pick(['g0', 'g0', 'g1', 'g2'])]);
  }
  // A pool of lava in a stone basin: hottest at the top, where it meets the air.
  const lava: Cell[] = [];
  for (let y = 32; y < FLOOR; y++) {
    for (let x = 34; x <= 46; x++) lava.push([x, y, y === 32 ? pick(['l0', 'l0', 'l1']) : y > 36 ? pick(['l1', 'l2']) : pick(['l1', 'l1', 'l0'])]);
  }
  const stream = [-4, 0, 4, 8, 12, 16, 20].map((y, i): Cell => [16 + (i % 3 === 1 ? 1 : 0), y, i % 2 ? 'g1' : 'g0']);
  return { pile, lava, stream, top: FLOOR - 15 };
})();

/** Sandglass: a heap under a falling stream, and a pool of lava that lights the air above it. */
function Sand() {
  return (
    <div className={s.sand}>
      <svg viewBox={`1 ${SAND_H - 33} ${SAND_W - 1} 33`} preserveAspectRatio="xMidYMax meet" shapeRendering="crispEdges">
        <defs>
          <filter id="sand-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <clipPath id="sand-fall">
            <rect x="0" y="0" width={SAND_W} height={SAND.top} />
          </clipPath>
        </defs>
        {/* The light, drawn first: the pool again, blurred, so it glows on the air over it. */}
        <g className={s.glow} filter="url(#sand-glow)">
          <rect x="34" y="31" width="13" height="8" />
        </g>
        <rect className={s.stone} x="0" y={FLOOR} width={SAND_W} height="1" />
        <rect className={s.stone} x="33" y="28" width="1" height="11" />
        <rect className={s.stone} x="47" y="28" width="1" height="11" />
        {SAND.pile.map(([x, y, tone]) => (
          <rect key={`p${x}-${y}`} className={s[tone]} x={x} y={y} width="1" height="1" />
        ))}
        {SAND.lava.map(([x, y, tone]) => (
          <rect key={`l${x}-${y}`} className={s[tone]} x={x} y={y} width="1" height="1" />
        ))}
        <g clipPath="url(#sand-fall)">
          <g className={s.fall}>
            {SAND.stream.map(([x, y, tone]) => (
              <rect key={y} className={s[tone]} x={x} y={y} width="1" height="1" />
            ))}
          </g>
        </g>
        {/* Steam off the lava, and a few sparks. */}
        {[35, 38, 41, 44].map((x, i) => (
          <rect key={x} className={s.steam} x={x} y="30" width="1" height="1" style={{ animationDelay: `${i * -0.55}s` }} />
        ))}
        {[37, 43].map((x, i) => (
          <rect key={x} className={s.spark} x={x} y="29" width="1" height="1" style={{ animationDelay: `${i * -0.7}s` }} />
        ))}
      </svg>
    </div>
  );
}

function Code() {
  return (
    <div className={s.code}>
      {/* The line the debugger is on, with its breakpoint. It steps from one language to the next. */}
      <u>
        <b />
      </u>
      {['Python', 'JavaScript', 'Java', 'C++', 'Go'].map((name) => (
        <i key={name}>{name}</i>
      ))}
    </div>
  );
}

function Device() {
  return (
    <div className={s.device}>
      {/* The bar with the clock, the fifteen apps, and the lead out of the case. */}
      <b />
      {times(15, (i) => (
        <i key={i} style={{ animationDelay: `${((i * 7) % 15) * 240}ms` }} />
      ))}
      <u />
    </div>
  );
}

function Waves() {
  const path = `M0 13${' q12.5 -13 25 0 t25 0'.repeat(8)}`;
  const floats = [
    [18, 30],
    [42, 52],
    [66, 24],
    [84, 60],
  ];
  return (
    <div className={s.waves}>
      {times(3, (i) => (
        <svg key={i} viewBox="0 0 400 26" preserveAspectRatio="none">
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
      {floats.map(([x, y], i) => (
        <i key={i} style={vars({ '--x': `${x}%`, '--y': `${y}cqw`, animationDelay: `-${i * 700}ms` })} />
      ))}
    </div>
  );
}

function Type({ motif }: ArtProps) {
  return <div className={s.type}>{motif}</div>;
}

function Hex() {
  const bytes = series(17, 48, 0, 255).map((n) => n.toString(16).padStart(2, '0'));
  return <div className={s.hex}>{bytes.join(' ')}</div>;
}

export const ART: Record<ArtTemplate, (props: ArtProps) => ReactElement> = {
  frames: Frames,
  grid: Grid,
  bars: Bars,
  code: Code,
  device: Device,
  waves: Waves,
  type: Type,
  hex: Hex,
  sand: Sand,
};
