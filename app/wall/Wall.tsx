import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { projects } from '~/content';

import { Cat } from './Cat';
import { Centre } from './Centre';
import { playEntry } from './entry';
import { computeWall, wallRows, type Columns } from './layout';
import { Light } from './Light';
import { Poster } from './Poster';
import { useDepth } from './useDepth';
import styles from './Wall.module.css';

const MODES: Columns[] = [2, 3, 5];
const emptyCount = (columns: Columns) => computeWall(projects, columns).filter((c) => c.kind === 'empty').length;
const EMPTY = { 2: emptyCount(2), 3: emptyCount(3), 5: emptyCount(5) };
const ROWS = wallRows(projects.length);
// How far each poster stands off the wall, in pixels.
const DEPTHS = [10, 28, 6, 34, 18, 40, 14, 30, 8, 24];

function useColumns(): Columns {
  const [columns, setColumns] = useState<Columns>(5);
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 900px) and (orientation: landscape)');
    const mid = window.matchMedia('(min-width: 600px)');
    const update = () => setColumns(wide.matches ? 5 : mid.matches ? 3 : 2);
    update();
    wide.addEventListener('change', update);
    mid.addEventListener('change', update);
    return () => {
      wide.removeEventListener('change', update);
      mid.removeEventListener('change', update);
    };
  }, []);
  return columns;
}

export function Wall() {
  const columns = useColumns();
  const wall = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useDepth(wall);
  useEffect(() => {
    if (wall.current) playEntry(wall.current);
  }, []);
  const frames = Math.max(...MODES.map((m) => EMPTY[m]));
  const style = { '--rows': ROWS, '--middle': Math.floor(ROWS / 2) + 1 } as CSSProperties;

  return (
    <section
      id="wall"
      ref={wall}
      className={styles.wall}
      style={{ '--view-x': 0, '--view-y': 0 } as CSSProperties}
      data-wall
      data-columns={columns}
      aria-label="Projects"
    >
      <Light />
      <div className={styles.grid} style={style} ref={grid}>
        <Centre className={styles.centre} />
        {projects.map((project, i) => (
          <div key={project.slug} className={styles.cell} style={{ '--z': `${DEPTHS[i % DEPTHS.length]}px` } as CSSProperties}>
            <Poster project={project} index={i} />
          </div>
        ))}
        {Array.from({ length: frames }, (_, i) => (
          <div
            key={i}
            className={[styles.cell, ...MODES.filter((m) => i < EMPTY[m]).map((m) => styles[`show${m}`])].join(' ')}
            data-empty
            aria-hidden="true"
          >
            <div className={styles.frame} />
          </div>
        ))}
        <Cat grid={grid} />
      </div>
    </section>
  );
}
