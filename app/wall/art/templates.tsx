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

// Suzuka, from Blind Lap's own data: the line of the circuit, one point every 40 m, 1000 across.
const SUZUKA =
  'M633 0 L653 0 L673 1 L693 1 L713 1 L733 1 L753 1 L773 1 L793 2 L813 2 L833 2 L853 2 L873 2 L893 3 L913 3 L933 3 L953 4 L972 11 L986 24 L997 41 L1000 60 L990 77 L973 86 L953 86 L934 82 L914 78 L894 77 L874 79 L857 89 L842 103 L824 111 L805 109 L787 100 L768 93 L748 93 L731 103 L717 117 L701 129 L682 134 L662 131 L647 119 L638 101 L628 83 L613 71 L594 68 L575 74 L557 82 L540 94 L526 108 L514 123 L505 142 L500 161 L499 181 L502 201 L506 220 L510 240 L513 260 L511 279 L501 296 L490 313 L477 329 L459 335 L441 327 L424 316 L407 307 L389 297 L372 287 L354 277 L337 267 L323 253 L313 236 L305 217 L290 206 L280 220 L286 239 L292 258 L298 277 L302 297 L303 317 L300 336 L291 354 L279 370 L266 385 L250 397 L233 408 L216 418 L197 426 L178 431 L158 433 L138 432 L119 428 L100 422 L80 416 L61 411 L41 409 L23 417 L10 432 L1 450 L0 469 L13 485 L30 493 L50 494 L70 491 L89 486 L109 481 L128 476 L147 469 L165 462 L184 455 L202 447 L220 437 L238 428 L255 418 L272 408 L289 397 L307 387 L324 377 L341 367 L358 357 L376 347 L393 337 L410 326 L427 317 L443 306 L454 289 L461 270 L466 251 L469 231 L470 211 L469 191 L468 171 L467 151 L466 131 L466 111 L477 95 L495 88 L500 70 L502 50 L512 33 L527 20 L544 10 L563 3 L583 1 L603 0 L623 0 Z';

/** Blind Lap: a circuit with a car going round, and a timing tower with the names blacked out. */
function Lap() {
  return (
    <div className={s.lap}>
      <div className={s.road}>
        <svg viewBox="-30 -30 1060 553">
          <path className={s.circuit} d={SUZUKA} />
        </svg>
        <b className={s.racer} />
      </div>
      {/* The model's three guesses: who it thinks it is, and how sure, with no names. */}
      <ol className={s.tower}>
        {[0.62, 0.24, 0.09].map((share, i) => (
          <li key={share} style={vars({ '--share': share, '--name': `${[58, 44, 52][i]}%` })}>
            <b>{i + 1}</b>
            <i />
            <u />
          </li>
        ))}
      </ol>
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
  lap: Lap,
};
