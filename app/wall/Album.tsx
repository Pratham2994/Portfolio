import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Link } from 'react-router';

import { projects } from '~/content';
import { track } from '~/lib/analytics';
import { markIntent } from '~/project/transition';

import styles from './Album.module.css';

const KEY = 'wall-album';
const CHANGED = 'wall:album';

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    // Storage can be turned off. Then nothing is collected, and nothing breaks.
    return '';
  }
}

/** Puts the sticker of a project in the album. Called when its page is opened. */
export function collect(slug: string): void {
  const have = read().split(',').filter(Boolean);
  if (have.includes(slug)) return;
  try {
    localStorage.setItem(KEY, [...have, slug].join(','));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * A sticker album, like the football ones. Every project page you open puts its sticker in.
 * It gives a reason to open all ten, and it says how many are left.
 */
export function Album() {
  // The built page has an empty album. The real one is read in the browser.
  const have = useSyncExternalStore(subscribe, read, () => '').split(',').filter(Boolean);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const got = projects.filter((project) => have.includes(project.slug)).length;
  const full = got === projects.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    const onDown = (event: PointerEvent) => !box.current?.contains(event.target as Node) && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <div className={styles.album} ref={box} data-album data-full={full || undefined}>
      <button
        type="button"
        className={styles.cover}
        aria-expanded={open}
        aria-controls="album-page"
        onClick={() => {
          setOpen(!open);
          track('album_opened', { got });
        }}
        data-album-button
      >
        album {got}/{projects.length}
      </button>
      {open && (
        <div className={styles.page} id="album-page" role="group" aria-label="Sticker album">
          <p className={styles.head}>
            <b>{full ? 'Album complete' : 'Sticker album'}</b>
            <span>{full ? 'All ten. You have seen the lot.' : 'Open a project to get its sticker.'}</span>
          </p>
          <ol className={styles.slots}>
            {projects.map((project, i) => {
              const stuck = have.includes(project.slug);
              const style = { '--bg': project.palette.bg, '--fg': project.palette.fg, '--accent': project.palette.accent, '--i': i } as CSSProperties;
              return (
                <li key={project.slug} style={style} data-stuck={stuck || undefined}>
                  <Link
                    to={`/work/${project.slug}`}
                    preventScrollReset
                    onClick={() => {
                      markIntent(project.slug);
                      setOpen(false);
                    }}
                    aria-label={stuck ? `${project.title}, collected` : `Sticker ${i + 1}, not collected yet. Opens ${project.title}`}
                  >
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    <strong>{stuck ? project.title : '?'}</strong>
                  </Link>
                </li>
              );
            })}
          </ol>
          {full && (
            <a className={styles.prize} href="#contact" onClick={() => setOpen(false)}>
              Last sticker: say hello
            </a>
          )}
        </div>
      )}
    </div>
  );
}
