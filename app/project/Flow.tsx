import type { CSSProperties } from 'react';

import type { Flow as FlowData } from '~/content/schema';

import s from './Flow.module.css';

// One cell of the grid, and the box inside it, in drawing units.
const CELL = { w: 190, h: 104 };
const BOX = { w: 160, h: 68 };
const NOTE = 26; // letters in one line of a note

/** Breaks a note into two short lines at most. */
function lines(note: string): string[] {
  const out: string[] = [];
  for (const word of note.split(' ')) {
    const last = out[out.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= NOTE) out[out.length - 1] = `${last} ${word}`;
    else out.push(word);
  }
  return out.length > 2 ? [out[0], out.slice(1).join(' ')] : out;
}

/**
 * The drawing. `tall` turns it on its side for a narrow screen: columns become rows, so a
 * chain that runs left to right runs top to bottom.
 */
function Drawing({ flow, tall, label }: { flow: FlowData; tall: boolean; label: string }) {
  const place = (at: [number, number]) => {
    const [column, row] = tall ? [at[1], at[0]] : at;
    return { x: (column - 0.5) * CELL.w, y: (row - 0.5) * CELL.h };
  };
  const spots = new Map(flow.nodes.map((node) => [node.id, place(node.at)]));
  const columns = Math.max(...flow.nodes.map((node) => (tall ? node.at[1] : node.at[0])));
  const rows = Math.max(...flow.nodes.map((node) => (tall ? node.at[0] : node.at[1])));

  // A link leaves the side of a box that faces the next one, and turns once if it has to.
  const route = ([from, to]: [string, string]) => {
    const a = spots.get(from)!;
    const b = spots.get(to)!;
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);
    if (!dy) return `M${a.x + (dx * BOX.w) / 2} ${a.y} H${b.x - dx * (BOX.w / 2 + 5)}`;
    if (!dx) return `M${a.x} ${a.y + (dy * BOX.h) / 2} V${b.y - dy * (BOX.h / 2 + 5)}`;
    return `M${a.x + (dx * BOX.w) / 2} ${a.y} H${b.x} V${b.y - dy * (BOX.h / 2 + 5)}`;
  };
  // The beat on which each box lights: when the first link into it lands. The start is beat 0.
  const beat = (id: string) => flow.links.findIndex(([, to]) => to === id) + 1;
  const marker = tall ? 'flow-arrow-tall' : 'flow-arrow-wide';

  return (
    <svg
      className={tall ? s.tall : s.wide}
      viewBox={`0 0 ${columns * CELL.w} ${rows * CELL.h}`}
      role="img"
      aria-label={label}
      style={{ '--n': flow.links.length } as CSSProperties}
    >
      <defs>
        <marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" className={s.head} />
        </marker>
      </defs>
      {flow.links.map((link, i) => (
        <g key={link.join('>')} style={{ '--i': i } as CSSProperties}>
          <path d={route(link)} className={s.link} markerEnd={`url(#${marker})`} />
          {/* A short light that runs along the link, on its turn. */}
          <path d={route(link)} className={s.pulse} pathLength={100} />
        </g>
      ))}
      {flow.nodes.map((node) => {
        const { x, y } = spots.get(node.id)!;
        return (
          <g key={node.id} className={s.node} data-kind={node.kind} style={{ '--i': beat(node.id) } as CSSProperties}>
            <rect x={x - BOX.w / 2} y={y - BOX.h / 2} width={BOX.w} height={BOX.h} rx={node.kind === 'store' ? 16 : 3} />
            <text x={x} y={y - 12} className={s.name}>
              {node.name}
            </text>
            {lines(node.note).map((line, i) => (
              <text key={line} x={x} y={y + 6 + i * 13} className={s.note}>
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** What happens under a project, as boxes and the links between them. It is a picture, not a control. */
export function Flow({ flow, title }: { flow: FlowData; title: string }) {
  const label = `How ${title} works underneath: ${flow.nodes.map((node) => `${node.name}, ${node.note}`).join('. ')}.`;
  return (
    <div className={s.flow}>
      <Drawing flow={flow} tall={false} label={label} />
      <Drawing flow={flow} tall label={label} />
    </div>
  );
}
