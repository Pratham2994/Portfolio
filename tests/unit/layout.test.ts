import { describe, expect, it } from 'vitest';

import { CENTRE, hangWall, OUTSIDE, type WallItem, type Weight } from '~/wall/layout';

const make = (hero: number, large: number, small: number): WallItem[] => {
  const of = (weight: Weight, count: number) => Array.from({ length: count }, (_, i) => ({ key: `${weight}${i}`, weight }));
  return [...of('hero', hero), ...of('large', large), ...of('small', small)];
};

const cellOf = (piece: { col: number; row: number }) => `${piece.col},${piece.row}`;

describe('hangWall', () => {
  it('hangs the launch wall like the real one: an A3 hero, nine A4, three A5', () => {
    const { rows, hung } = hangWall(make(1, 7, 5));
    expect(rows).toBe(3);
    expect(hung).toHaveLength(13);
    expect(hung.filter((p) => p.paper === 'a3')).toEqual([expect.objectContaining({ key: 'hero0', col: 1, row: 2 })]);
    expect(hung.filter((p) => p.paper === 'a4')).toHaveLength(9);
    expect(hung.filter((p) => p.paper.startsWith('a5'))).toHaveLength(3);
  });

  it('puts small pieces in the four corners and one outside the block', () => {
    const small = hangWall(make(1, 7, 5)).hung.filter((p) => p.key.startsWith('small'));
    expect(small.map(cellOf).sort()).toEqual(['1,1', '1,3', '5,1', '5,3', `${OUTSIDE},2`].sort());
    // The two in the top row are full sheets, so that row has no holes.
    expect(small.filter((p) => p.row === 1).every((p) => p.paper === 'a4')).toBe(true);
  });

  it('never hangs a piece over the centre, and shares a cell only below the hero', () => {
    for (let large = 3; large <= 14; large++) {
      for (let small = 0; small <= 8; small++) {
        const { hung } = hangWall(make(1, large, small));
        expect(hung).toHaveLength(1 + large + small);
        expect(new Set(hung.map((p) => p.key)).size).toBe(hung.length);
        const cells = hung.filter((p) => p.paper !== 'a3').map(cellOf);
        expect(new Set(cells).size).toBe(cells.length);
        for (const piece of hung) {
          const overCentre = piece.row === CENTRE.row && piece.col >= CENTRE.from && piece.col <= CENTRE.to;
          expect(overCentre).toBe(false);
        }
      }
    }
  });

  it('adds rows below when the first three are full', () => {
    const { rows, hung } = hangWall(make(1, 9, 5));
    expect(rows).toBe(4);
    expect(hung.filter((p) => p.row === 4)).toHaveLength(2);
  });

  it('gives the hero place to an A4 piece when there is no hero', () => {
    const { hung } = hangWall(make(0, 8, 0));
    expect(hung.every((p) => p.paper === 'a4')).toBe(true);
    expect(hung[0]).toMatchObject({ col: 1, row: 2 });
  });
});
