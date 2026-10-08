import type { Project } from '~/content/schema';

export type Place = { project: Project; col: number; row: number; span: 1 | 2 };
export type WallPlan = { rows: number; centreRow: number; places: Place[] };

const COLUMNS = 5;
const CENTRE = { from: 2, to: 4 }; // grid columns the centre piece covers, 1-based
const CENTRE_WIDTH = CENTRE.to - CENTRE.from + 1;

/**
 * Mixes postcards in between posters, so small and large pieces are spread over the wall
 * instead of sitting in separate rows. Each group keeps its own order.
 */
export function wallOrder(projects: Project[]): Project[] {
  const posters = projects.filter((p) => p.size === 'poster');
  const postcards = projects.filter((p) => p.size === 'postcard');
  const total = projects.length;
  const small = postcards.length;
  const mixed: Project[] = [];
  for (let i = 0; i < total; i++) {
    const due = Math.floor(((i + 1) * small) / total) > Math.floor((i * small) / total);
    const next = due && postcards.length ? postcards.shift() : (posters.shift() ?? postcards.shift());
    mixed.push(next!);
  }
  return mixed;
}

/** Picks `count` slots out of `slots`, spread evenly, so a short row has no empty corner. */
function spread<T>(slots: T[], count: number): T[] {
  if (count >= slots.length) return slots;
  if (count === 1) return [slots[Math.floor(slots.length / 2)]];
  return Array.from({ length: count }, (_, i) => slots[Math.round((i * (slots.length - 1)) / (count - 1))]);
}

/**
 * Where each project hangs on the five-column wall. The centre piece sits in the middle row.
 * When the wall has more cells than projects, some pieces hang double-wide to fill it, so no
 * row is left with holes. Postcards are widened first.
 */
export function placeWall(projects: Project[]): WallPlan {
  const queue = wallOrder(projects);
  let rows = 2;
  while (COLUMNS * rows - CENTRE_WIDTH < queue.length) rows++;
  const centreRow = Math.floor(rows / 2) + 1;

  // Share the spare cells between the full-width rows, from the bottom up, two per row at most.
  let spare = COLUMNS * rows - CENTRE_WIDTH - queue.length;
  const wide = new Map<number, number>();
  for (let row = rows; row >= 1 && spare > 0; row--) {
    if (row === centreRow) continue;
    const take = Math.min(2, spare);
    wide.set(row, take);
    spare -= take;
  }

  const places: Place[] = [];
  for (let row = 1; row <= rows; row++) {
    if (row === centreRow) {
      const sides = [CENTRE.from - 1, CENTRE.to + 1];
      for (const col of sides.slice(0, queue.length)) places.push({ project: queue.shift()!, col, row, span: 1 });
      continue;
    }

    const widen = wide.get(row) ?? 0;
    const items = queue.splice(0, COLUMNS - widen);
    if (items.length < COLUMNS - widen) {
      // Too few pieces to fill this row even with wide ones: spread them out instead.
      const slots = Array.from({ length: COLUMNS }, (_, i) => i + 1);
      spread(slots, items.length).forEach((col, i) => places.push({ project: items[i], col, row, span: 1 }));
      continue;
    }

    // Widen postcards first, then the pieces nearest the ends of the row.
    const middle = (items.length - 1) / 2;
    const order = items
      .map((_, i) => i)
      .sort((a, b) => {
        const small = Number(items[b].size === 'postcard') - Number(items[a].size === 'postcard');
        return small || Math.abs(b - middle) - Math.abs(a - middle);
      });
    const chosen = new Set(order.slice(0, widen));
    let col = 1;
    items.forEach((project, i) => {
      const span = chosen.has(i) ? 2 : 1;
      places.push({ project, col, row, span });
      col += span;
    });
  }
  return { rows, centreRow, places };
}
