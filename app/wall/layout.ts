import type { Project } from '~/content/schema';

export type Cell = { kind: 'centre' } | { kind: 'project'; project: Project } | { kind: 'empty' };
export type Columns = 2 | 3 | 5;

const CENTRE_SPAN = 3;

/** Rows needed in the 5-column wall: every project, the centre, and at least one empty frame. */
export function wallRows(count: number): number {
  let rows = 3;
  while (5 * rows - CENTRE_SPAN < count + 1) rows++;
  return rows;
}

export function computeWall(projects: Project[], columns: Columns): Cell[] {
  const queue = projects.map((project): Cell => ({ kind: 'project', project }));
  const next = (): Cell => queue.shift() ?? { kind: 'empty' };

  if (columns !== 5) {
    const rest = projects.length % columns;
    const empties = rest === 0 ? 1 : columns - rest;
    return [{ kind: 'centre' }, ...queue, ...Array.from({ length: empties }, (): Cell => ({ kind: 'empty' }))];
  }

  const rows = wallRows(projects.length);
  const middle = Math.floor(rows / 2);
  const cells: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < 5; col++) {
      if (row === middle && col >= 1 && col <= CENTRE_SPAN) {
        if (col === 1) cells.push({ kind: 'centre' });
        continue;
      }
      cells.push(next());
    }
  }
  return cells;
}
