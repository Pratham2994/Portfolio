import { describe, expect, it } from 'vitest';

import type { Project } from '~/content/schema';
import { placeWall, wallOrder, type Place } from '~/wall/layout';

const make = (posters: number, postcards: number) =>
  [
    ...Array.from({ length: posters }, (_, i) => ({ slug: `big${i}`, size: 'poster' })),
    ...Array.from({ length: postcards }, (_, i) => ({ slug: `small${i}`, size: 'postcard' })),
  ] as Project[];

const cells = (places: Place[]) =>
  places.flatMap((p) => Array.from({ length: p.span }, (_, i) => `${p.col + i},${p.row}`));

describe('wallOrder', () => {
  it('keeps every project once and each size in its own order', () => {
    const mixed = wallOrder(make(6, 4));
    expect(mixed).toHaveLength(10);
    expect(mixed.filter((p) => p.size === 'poster').map((p) => p.slug)).toEqual(['big0', 'big1', 'big2', 'big3', 'big4', 'big5']);
    expect(mixed.filter((p) => p.size === 'postcard').map((p) => p.slug)).toEqual(['small0', 'small1', 'small2', 'small3']);
  });

  it('never puts more than two postcards side by side', () => {
    const sizes = wallOrder(make(6, 4)).map((p) => p.size).join(' ');
    expect(sizes).not.toContain('postcard postcard postcard');
    expect(sizes.startsWith('poster')).toBe(true);
  });

  it('works with only one size', () => {
    expect(wallOrder(make(5, 0))).toHaveLength(5);
    expect(wallOrder(make(0, 5))).toHaveLength(5);
  });
});

describe('placeWall', () => {
  for (let n = 4; n <= 18; n++) {
    it(`gives ${n} projects their own cells, clear of the centre piece`, () => {
      const { rows, centreRow, places } = placeWall(make(Math.ceil(n * 0.6), Math.floor(n * 0.4)));
      expect(places).toHaveLength(n);
      const used = cells(places);
      expect(new Set(used).size).toBe(used.length);
      for (const place of places) {
        expect(place.col).toBeGreaterThanOrEqual(1);
        expect(place.col + place.span - 1).toBeLessThanOrEqual(5);
        expect(place.row).toBeLessThanOrEqual(rows);
        if (place.row === centreRow) expect([1, 5]).toContain(place.col);
      }
    });
  }

  it('fills a short last row with two wide pieces, postcards first', () => {
    const { rows, places } = placeWall(make(6, 4));
    expect(rows).toBe(3);
    const last = places.filter((p) => p.row === 3);
    expect(last.map((p) => [p.col, p.span])).toEqual([
      [1, 2],
      [3, 1],
      [4, 2],
    ]);
    expect(last.filter((p) => p.span === 2).every((p) => p.project.size === 'postcard')).toBe(true);
  });

  it('leaves no empty cell when ten to twelve projects hang on three rows', () => {
    for (const n of [10, 11, 12]) expect(cells(placeWall(make(n - 4, 4)).places)).toHaveLength(12);
  });
});
