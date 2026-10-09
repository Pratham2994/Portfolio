/**
 * The wide wall is hung like a real poster wall, in paper sizes. Most pieces are A4. One
 * hero is A3 and hangs left of the centre piece, lower than its row. Small A5 pieces take
 * the corners, and one hangs outside the block on the right.
 */
export type Paper = 'a3' | 'a4' | 'a5-tall' | 'a5-wide';
export type Weight = 'hero' | 'large' | 'small';
export type Edge = 'start' | 'center' | 'end';
export type WallItem = { key: string; weight: Weight };
export type Hung = { key: string; col: number; row: number; paper: Paper; x: Edge; y: Edge };
export type WallPlan = { rows: number; hung: Hung[] };

type Slot = Omit<Hung, 'key'>;

export const COLUMNS = 5;
export const OUTSIDE = COLUMNS + 1; // a narrow sixth column for the piece that hangs outside
export const CENTRE = { from: 2, to: 4, row: 2 };

const a4 = (col: number, row: number): Slot => ({ col, row, paper: 'a4', x: 'center', y: 'center' });

const HERO: Slot = { col: 1, row: 2, paper: 'a3', x: 'end', y: 'start' };
const LARGE: Slot[] = [a4(2, 1), a4(3, 1), a4(4, 1), a4(5, 2), a4(2, 3), a4(3, 3), a4(4, 3)];
const SMALL: Slot[] = [
  // The two ends of the top row. A small piece here is a full sheet, so the row has no holes.
  a4(1, 1),
  a4(5, 1),
  { col: 5, row: 3, paper: 'a5-tall', x: 'start', y: 'start' },
  // Under the hero. The wall CSS pushes it down to one gap below the bottom edge of the hero.
  { col: 1, row: 3, paper: 'a5-wide', x: 'end', y: 'start' },
  { col: OUTSIDE, row: 2, paper: 'a5-tall', x: 'start', y: 'center' },
];

/** Extra rows below the block, for walls with more pieces than the first three rows hold. */
function* overflow(): Generator<Slot> {
  for (let row = 4; ; row++) for (let col = 1; col <= COLUMNS; col++) yield a4(col, row);
}

export function hangWall(items: WallItem[]): WallPlan {
  const hero = items.find((item) => item.weight === 'hero');
  const large = items.filter((item) => item.weight === 'large' || (item.weight === 'hero' && item !== hero));
  const small = items.filter((item) => item.weight === 'small');

  // Without a hero, its place is one more A4 place.
  const largeSlots = hero ? [...LARGE] : [a4(1, 2), ...LARGE];
  const smallSlots = [...SMALL];
  const more = overflow();
  const hung: Hung[] = [];

  if (hero) hung.push({ key: hero.key, ...HERO });
  for (const item of large) hung.push({ key: item.key, ...(largeSlots.shift() ?? more.next().value) });
  for (const item of small) {
    // When the corners are full, a small piece takes a free A4 place and stays small in it.
    const slot = smallSlots.shift() ?? { ...(largeSlots.shift() ?? more.next().value), paper: 'a5-tall' as const };
    hung.push({ key: item.key, ...slot });
  }

  return { rows: Math.max(3, ...hung.map((piece) => piece.row)), hung };
}
