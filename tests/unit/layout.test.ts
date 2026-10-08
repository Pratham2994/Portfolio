import { describe, expect, it } from 'vitest';

import type { Project } from '~/content/schema';
import { placeWall, wallOrder } from '~/wall/layout';

const make = (posters: number, postcards: number) =>
  [
    ...Array.from({ length: posters }, (_, i) => ({ slug: `big${i}`, size: 'poster' })),
    ...Array.from({ length: postcards }, (_, i) => ({ slug: `small${i}`, size: 'postcard' })),
  ] as Project[];

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
    it(`gives ${n} projects one free cell each, clear of the centre piece`, () => {
      const { rows, centreRow, places } = placeWall(make(Math.ceil(n * 0.6), Math.floor(n * 0.4)));
      expect(places).toHaveLength(n);
      expect(new Set(places.map((p) => `${p.col},${p.row}`)).size).toBe(n);
      for (const place of places) {
        expect(place.col).toBeGreaterThanOrEqual(1);
        expect(place.col).toBeLessThanOrEqual(5);
        expect(place.row).toBeLessThanOrEqual(rows);
        if (place.row === centreRow) expect([1, 5]).toContain(place.col);
      }
    });
  }

  it('spreads a short last row to both corners', () => {
    const { rows, places } = placeWall(make(6, 4));
    expect(rows).toBe(3);
    expect(places.filter((p) => p.row === 3).map((p) => p.col)).toEqual([1, 3, 5]);
  });

  it('centres a single leftover poster', () => {
    const { rows, places } = placeWall(make(5, 3));
    expect(places.filter((p) => p.row === rows).map((p) => p.col)).toEqual([3]);
  });
});
