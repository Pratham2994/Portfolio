import type { CSSProperties } from 'react';
import { Link } from 'react-router';

import type { Project } from '~/content/schema';

import { markIntent } from '~/project/transition';

import { Art } from './art';
import styles from './Poster.module.css';

// A small fixed tilt per poster, as if pinned by hand.
const tilt = (index: number) => (((index * 37) % 7) - 3) * 0.3;

export function Poster({ project, index }: { project: Project; index: number }) {
  const style = {
    '--bg': project.palette.bg,
    '--fg': project.palette.fg,
    '--accent': project.palette.accent,
    '--tilt': `${tilt(index)}deg`,
  } as CSSProperties;

  return (
    <Link
      to={`/work/${project.slug}`}
      className={styles.poster}
      data-poster={project.slug}
      data-size={project.size}
      style={style}
      preventScrollReset
      onClick={() => markIntent(project.slug)}
    >
      <Art art={project.art} />
      <span className={styles.caption}>
        <strong className={styles.title}>{project.title}</strong>
        <span className={styles.tagline}>{project.tagline}</span>
      </span>
    </Link>
  );
}
