import type { Project } from '~/content/schema';

export type Place = { project: Project; col: number; row: number };
export type WallPlan = { rows: number; centreRow: number; places: Place[] };

const COLUMNS = 5;
const CENTRE = { from: 2, to: 4 }; // grid columns the centre piece covers, 1-based

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

/** Where each project hangs on the five-column wall. The centre piece sits in the middle row. */
export function placeWall(projects: Project[]): WallPlan {
  const queue = wallOrder(projects);
  let rows = 2;
  while (COLUMNS * rows - (CENTRE.to - CENTRE.from + 1) < queue.length) rows++;
  const centreRow = Math.floor(rows / 2) + 1;

  const places: Place[] = [];
  for (let row = 1; row <= rows; row++) {
    const slots = Array.from({ length: COLUMNS }, (_, i) => i + 1).filter(
      (col) => row !== centreRow || col < CENTRE.from || col > CENTRE.to,
    );
    const take = row === rows ? queue.length : Math.min(slots.length, queue.length);
    for (const col of spread(slots, take)) places.push({ project: queue.shift()!, col, row });
  }
  return { rows, centreRow, places };
}
