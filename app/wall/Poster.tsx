import type { CSSProperties } from 'react';
import { Link } from 'react-router';

import { projects } from '~/content';
import type { Project } from '~/content/schema';
import { markIntent, peelNow } from '~/project/transition';
import { track } from '~/lib/analytics';
import { contrast } from '~/lib/colour';

import { Art } from './art';
import styles from './Poster.module.css';
import { useLean } from './useLean';

// Months since a start point, so two dates can be compared.
const months = (made?: string) => (made ? Number(made.slice(0, 4)) * 12 + Number(made.slice(5)) : null);
const DATES = projects.map((project) => months(project.made)).filter((n): n is number => n !== null);
const NEWEST = Math.max(...DATES);
const OLDEST = Math.min(...DATES);

/** 0 for the newest sheet on the wall, 1 for the oldest. Paper yellows and curls with it. */
function age(made?: string): number {
  const at = months(made);
  return at === null || NEWEST === OLDEST ? 0 : (NEWEST - at) / (NEWEST - OLDEST);
}

// A poster is set like a print, not like a card: on some the name is at the head of the sheet.
const HEAD = new Set(['scrub', 'floatchat', 'malshield']);
// The longest word of a name. The name is set as large as that word allows. A name of a few
// short words is set as if it had one of eight letters, so it takes two lines and not four.
const longest = (title: string) => {
  const words = title.split(/\s+/);
  return Math.max(...words.map((word) => word.length), words.length > 1 ? 8 : 0);
};

// A small fixed tilt per poster, as if pinned by hand.
const tilt = (index: number) => (((index * 37) % 7) - 3) * 0.28;

export function Poster({ project, index }: { project: Project; index: number }) {
  const lean = useLean<HTMLAnchorElement>();
  const style = {
    '--bg': project.palette.bg,
    '--fg': project.palette.fg,
    '--accent': project.palette.accent,
    '--tilt': `${tilt(index)}deg`,
    '--chars': longest(project.title),
    '--age': age(project.made).toFixed(2),
  } as CSSProperties;
  const fresh = months(project.made) === NEWEST;

  return (
    <Link
      {...lean}
      to={`/work/${project.slug}`}
      className={styles.poster}
      data-poster={project.slug}
      data-size={project.size}
      data-lay={HEAD.has(project.slug) ? 'head' : 'foot'}
      // The second ink: the name is printed in the accent where large type in it can be read.
      data-ink={contrast(project.palette.accent, project.palette.bg) >= 3 || undefined}
      style={style}
      preventScrollReset
      onClick={(event) => {
        // A click that opens a new tab or window leaves the sheet on the wall.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        markIntent(project.slug);
        // The sheet starts to peel at the click, before the page behind it is built.
        peelNow(event.currentTarget);
        track('poster_opened', { project: project.slug });
      }}
    >
      <Art art={project.art} />
      {/* Old paper curls at a corner. The newest sheet still has its tape. */}
      <svg className={styles.curl} viewBox="0 0 100 100" aria-hidden="true" data-curl>
        {/* The wall, where the corner has come away. Its edge is a curve, as paper bends. */}
        <path className={styles.gap} d="M100 22 C 84 60, 60 84, 22 100 L22 140 L140 140 L140 22 Z" />
        {/* The corner itself, rolled back over the sheet: pale, with a shadow along the roll. */}
        <path className={styles.roll} d="M100 22 C 84 60, 60 84, 22 100 C 44 78, 50 62, 52 52 C 62 50, 78 44, 100 22 Z" />
        <path className={styles.crease} d="M100 22 C 84 60, 60 84, 22 100" />
      </svg>
      {fresh && (
        <b className={styles.fresh} aria-hidden="true">
          New
        </b>
      )}
      {/* A project that runs on the web says so on the sheet, as a broadcast says it is live. */}
      {project.links.live && (
        <b className={styles.onAir} data-on-air>
          Live
        </b>
      )}
      <span className={styles.caption}>
        <strong className={styles.title}>{project.title}</strong>
        <span className={styles.tagline}>{project.tagline}</span>
      </span>
    </Link>
  );
}
