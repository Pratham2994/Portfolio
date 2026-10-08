import { useEffect, useState, type CSSProperties } from 'react';

import { projects } from '~/content';

import { Centre } from './Centre';
import { computeWall, wallRows, type Columns } from './layout';
import { Poster } from './Poster';
import styles from './Wall.module.css';

const MODES: Columns[] = [2, 3, 5];
const emptyCount = (columns: Columns) => computeWall(projects, columns).filter((c) => c.kind === 'empty').length;
const EMPTY = { 2: emptyCount(2), 3: emptyCount(3), 5: emptyCount(5) };
const ROWS = wallRows(projects.length);

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
  const frames = Math.max(...MODES.map((m) => EMPTY[m]));
  const style = { '--rows': ROWS, '--middle': Math.floor(ROWS / 2) + 1 } as CSSProperties;

  return (
    <section id="wall" className={styles.wall} data-wall data-columns={columns} aria-label="Projects">
      <div className={styles.grid} style={style}>
        <Centre className={styles.centre} />
        {projects.map((project, i) => (
          <div key={project.slug} className={styles.cell}>
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
      </div>
    </section>
  );
}
