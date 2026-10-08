import gsap from 'gsap';
import { useRef, type CSSProperties, type PointerEvent } from 'react';
import { Link } from 'react-router';

import type { Project } from '~/content/schema';
import { finePointer, prefersReducedMotion } from '~/lib/motion';
import { markIntent } from '~/project/transition';

import { Art } from './art';
import styles from './Poster.module.css';

// A small fixed tilt per poster, as if pinned by hand.
const tilt = (index: number) => (((index * 37) % 7) - 3) * 0.55;

// How far a poster leans toward the pointer, in degrees.
const LEAN = 13;

export function Poster({ project, index }: { project: Project; index: number }) {
  const style = {
    '--bg': project.palette.bg,
    '--fg': project.palette.fg,
    '--accent': project.palette.accent,
    '--tilt': `${tilt(index)}deg`,
  } as CSSProperties;

  const el = useRef<HTMLAnchorElement>(null);
  const lean = (rx: number, ry: number, settle = false) =>
    gsap.to(el.current, {
      '--rx': rx,
      '--ry': ry,
      duration: settle ? 1.1 : 0.45,
      ease: settle ? 'elastic.out(1, 0.45)' : 'power3.out',
      overwrite: 'auto',
    });

  // The poster leans toward the pointer like a loose sheet, and springs back when it leaves.
  const onMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== 'mouse' || !finePointer() || prefersReducedMotion()) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    lean(-y * LEAN, x * LEAN);
  };

  return (
    <Link
      ref={el}
      onPointerMove={onMove}
      onPointerLeave={() => lean(0, 0, true)}
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
