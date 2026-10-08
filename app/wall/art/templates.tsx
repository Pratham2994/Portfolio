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
  if (motif === 'sort') {
    const start = series(11, 12, 14, 100);
    return (
      <div className={s.sort}>
        {start.map((height, i) => (
          <i key={i} style={vars({ '--a': `${height}%`, '--b': `${Math.round(((i + 1) / 12) * 100)}%` })} />
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

function Code() {
  const widths = [70, 92, 54, 84, 62, 40];
  return (
    <div className={s.code}>
      <u />
      <b />
      {widths.map((width, i) => (
        <i key={i} style={vars({ '--w': `${width}%` })} />
      ))}
    </div>
  );
}

function Device() {
  return (
    <div className={s.device}>
      {times(6, (i) => (
        <i key={i} style={{ animationDelay: `${i * 600}ms` }} />
      ))}
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
};
