import { describe, expect, it } from 'vitest';

import type { Project } from '~/content/schema';
import { computeWall, type Columns } from '~/wall/layout';

const make = (n: number) => Array.from({ length: n }, (_, i) => ({ slug: `p${i}`, order: i }) as Project);
const slugs = (cells: ReturnType<typeof computeWall>) =>
  cells.flatMap((c) => (c.kind === 'project' ? [c.project.slug] : []));

describe('computeWall', () => {
  for (const columns of [2, 3, 5] as Columns[]) {
    for (let n = 6; n <= 16; n++) {
      it(`places ${n} projects in ${columns} columns once each, in order, with one centre and an empty frame`, () => {
        const cells = computeWall(make(n), columns);
        expect(slugs(cells)).toEqual(make(n).map((p) => p.slug));
        expect(cells.filter((c) => c.kind === 'centre')).toHaveLength(1);
        expect(cells.filter((c) => c.kind === 'empty').length).toBeGreaterThanOrEqual(1);
      });
    }
  }

  it('gives 13 cells with 2 empty frames for 10 projects in 5 columns', () => {
    const cells = computeWall(make(10), 5);
    expect(cells).toHaveLength(13);
    expect(cells.filter((c) => c.kind === 'empty')).toHaveLength(2);
  });

  it('puts the centre in the middle row for 5 columns and first otherwise', () => {
    expect(computeWall(make(10), 5).findIndex((c) => c.kind === 'centre')).toBe(6);
    expect(computeWall(make(10), 3)[0].kind).toBe('centre');
    expect(computeWall(make(10), 2)[0].kind).toBe('centre');
  });
});
