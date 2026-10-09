import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { projects } from '~/content';
import { track } from '~/lib/analytics';

import { Cat } from './Cat';
import { Centre } from './Centre';
import { dropWall } from './drop';
import { playEntry } from './entry';
import { hangWall, OUTSIDE, type WallItem } from './layout';
import { Light } from './Light';
import { Piece, PIECES } from './Piece';
import { Poster } from './Poster';
import { HINTS, initSecrets, SECRETS, type Secrets } from './secrets';
import { useDepth } from './useDepth';
import { useScrollTilt } from './useScrollTilt';
import { useSpotlight } from './useSpotlight';
import styles from './Wall.module.css';

type Columns = 2 | 3 | 5;

// Projects first, in their own order, then the personal pieces.
const ITEMS: WallItem[] = [
  ...projects.map((p) => ({ key: p.slug, weight: p.hero ? ('hero' as const) : p.size === 'poster' ? ('large' as const) : ('small' as const) })),
  ...PIECES.map((key) => ({ key, weight: 'small' as const })),
];
const PLAN = hangWall(ITEMS);
const HAS_HERO = PLAN.hung.some((piece) => piece.paper === 'a3');
const PLACE = new Map(PLAN.hung.map((piece) => [piece.key, piece]));

// How far each piece stands off the wall, in pixels.
const DEPTHS = [10, 28, 6, 34, 18, 40, 14, 30, 8, 24, 20, 12, 36];

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

function Cell({ id, index, children }: { id: string; index: number; children: ReactNode }) {
  const place = PLACE.get(id)!;
  const style = {
    '--col': place.col,
    '--row': place.row,
    '--x': place.x,
    '--y': place.y,
    '--z': `${DEPTHS[index % DEPTHS.length]}px`,
  } as CSSProperties;
  return (
    <div className={styles.cell} style={style} data-paper={place.paper} data-outside={place.col === OUTSIDE || undefined}
      data-under-hero={(HAS_HERO && place.col === 1 && place.row === 3) || undefined}
    >
      {children}
    </div>
  );
}

export function Wall() {
  const columns = useColumns();
  const wall = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useDepth(wall);
  useScrollTilt(wall);
  useSpotlight(grid);
  useEffect(() => {
    if (wall.current) playEntry(wall.current);
  }, []);
  const secrets = useRef<Secrets>(null);
  const [found, setFound] = useState<string[]>([]);
  const [listOpen, setListOpen] = useState(false);
  useEffect(() => {
    if (!wall.current) return;
    secrets.current = initSecrets(wall.current, setFound);
    return secrets.current.stop;
  }, []);
  const hint = HINTS[!found.includes('meow') ? 0 : !found.includes('lights') ? 1 : 2];

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
      <div className={styles.grid} style={{ '--rows': PLAN.rows } as CSSProperties} ref={grid}>
        <Centre className={styles.centre} />
        {projects.map((project, i) => (
          <Cell key={project.slug} id={project.slug} index={i}>
            <Poster project={project} index={i} />
          </Cell>
        ))}
        {PIECES.map((id, i) => (
          <Cell key={id} id={id} index={projects.length + i}>
            <Piece id={id} index={projects.length + i} />
          </Cell>
        ))}
        <Cat grid={grid} />
      </div>
      {/* A footer, not a div: the grid stays the only div directly in the wall. */}
      <footer className={styles.secrets} data-secrets>
        <button type="button" className={styles.cheat} aria-expanded={listOpen} aria-controls="secret-list" onClick={() => setListOpen((open) => !open)} data-cheat>
          secrets {found.length}/{SECRETS.length}
        </button>
        {/* One line along the bottom of the wall, so the list covers nothing. */}
        {listOpen ? (
          <ul className={styles.list} id="secret-list" aria-label="Words to type on the wall, or to click">
            {SECRETS.map((secret) => (
              <li key={secret.name} data-found={found.includes(secret.name) || undefined}>
                <button type="button" title={secret.about} onClick={() => secrets.current?.run(secret.name)}>
                  {secret.word}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.hint} aria-hidden="true" data-hint>
            {hint}
          </p>
        )}
      </footer>
      <button type="button" className={styles.lever} onClick={() => {
          track('lever_pressed');
          if (wall.current) dropWall(wall.current);
        }} data-lever>
        Do not press
      </button>
    </section>
  );
}
