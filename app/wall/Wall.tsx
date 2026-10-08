import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { projects } from '~/content';

import { Cat } from './Cat';
import { Centre } from './Centre';
import { playEntry } from './entry';
import { placeWall } from './layout';
import { Light } from './Light';
import { Poster } from './Poster';
import { useDepth } from './useDepth';
import styles from './Wall.module.css';

type Columns = 2 | 3 | 5;

const PLAN = placeWall(projects);

// Hung by hand: each piece has its own size, place in its cell, and distance from the wall.
const HANG = [
  { size: 1, x: 'center', y: 'end', z: 10 },
  { size: 0.9, x: 'start', y: 'start', z: 28 },
  { size: 1, x: 'end', y: 'center', z: 6 },
  { size: 0.94, x: 'center', y: 'start', z: 34 },
  { size: 0.86, x: 'start', y: 'end', z: 18 },
  { size: 1, x: 'end', y: 'start', z: 40 },
  { size: 0.92, x: 'center', y: 'center', z: 14 },
];

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

  const style = { '--rows': PLAN.rows, '--middle': PLAN.centreRow } as CSSProperties;

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
        {PLAN.places.map(({ project, col, row, span }, i) => {
          const hang = HANG[i % HANG.length];
          const cell = {
            '--col': `${col} / span ${span}`,
            '--row': row,
            '--z': `${hang.z}px`,
            '--size': hang.size,
            '--x': span === 2 ? 'center' : hang.x,
            '--y': hang.y,
          } as CSSProperties;
          return (
            <div key={project.slug} className={styles.cell} style={cell} data-wide={span === 2 || undefined}>
              <Poster project={project} index={i} />
            </div>
          );
        })}
        <Cat grid={grid} />
      </div>
    </section>
  );
}
