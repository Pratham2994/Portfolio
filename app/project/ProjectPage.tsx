import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { neighbours, projects } from '~/content';
import type { Project } from '~/content/schema';
import { Art } from '~/wall/art';
import { Paragraphs } from '~/lib/Paragraphs';

import s from './ProjectPage.module.css';
import { cancelTransition, closeLive, closeTo, openFrom, takeClosed, takeIntent } from './transition';

const pad = (n: number) => String(n).padStart(2, '0');
const longestWord = (text: string) => Math.max(...text.split(/\s+/).map((word) => word.length));

export function ProjectPage({ project }: { project: Project }) {
  const navigate = useNavigate();
  const title = useRef<HTMLHeadingElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const { prev, next } = neighbours(project.slug);
  const position = projects.findIndex((p) => p.slug === project.slug) + 1;

  useLayoutEffect(() => {
    const node = page.current!;
    const poster = () => document.querySelector<HTMLElement>(`[data-poster="${project.slug}"]`);
    if (takeIntent(project.slug)) void openFrom(poster(), node);
    // A page that opens with a cut (history, next, previous) must not sit under a closing sheet.
    else cancelTransition();
    return () => {
      // Runs before the page leaves the DOM. Only a return to the wall shrinks back to the poster.
      if (takeClosed()) return;
      if (window.location.pathname === '/') void closeTo(poster(), node);
    };
  }, [project.slug]);

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [project.slug]);

  // Closes with the fold-down move, then goes to the wall. A second call while it runs does nothing.
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current || !page.current) return;
    closing.current = true;
    const poster = document.querySelector<HTMLElement>(`[data-poster="${project.slug}"]`);
    void closeLive(poster, page.current).then(() => navigate('/', { preventScrollReset: true }));
  }, [navigate, project.slug]);

  // A layout effect, so Escape works from the first frame the page is on screen.
  useLayoutEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const root = document.documentElement;
    window.addEventListener('keydown', onKey);
    root.dataset.projectOpen = '';
    // The scrollbar gutter shows the root background, so it takes the page colour while open.
    root.style.backgroundColor = project.palette.bg;
    return () => {
      window.removeEventListener('keydown', onKey);
      delete root.dataset.projectOpen;
      root.style.backgroundColor = '';
    };
  }, [close, project.palette.bg]);

  // A plain click plays the close. A modified click (new tab) is left to the browser.
  const onCloseClick = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    close();
  };

  const style = {
    '--bg': project.palette.bg,
    '--fg': project.palette.fg,
    '--accent': project.palette.accent,
    '--page-bg': project.palette.bg,
    '--page-fg': project.palette.fg,
  } as CSSProperties;

  return (
    <div
      className={s.page}
      style={style}
      ref={page}
      data-project={project.slug}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-title"
    >
      <div className={s.inner}>
        <header className={s.bar} data-in>
          <Link to="/" className={s.close} data-close preventScrollReset onClick={onCloseClick}>
            Back to the wall
          </Link>
          <span className={s.count}>
            {pad(position)} / {pad(projects.length)}
          </span>
          <span className={s.status}>{project.status}</span>
        </header>

        <div className={s.hero}>
          <div className={s.heroText}>
            <h1
              id="project-title"
              className={s.title}
              style={{ '--chars': longestWord(project.title) } as CSSProperties}
              tabIndex={-1}
              ref={title}
              data-in
            >
              {project.title}
            </h1>
            <p className={s.tagline} data-in>
              {project.tagline}
            </p>
          </div>
          {/* The poster's own art, drawn large in swapped colours. */}
          <div className={s.plate} data-in>
            <Art art={project.art} />
          </div>
        </div>

        <div className={s.brief}>
          <div className={s.why} data-in>
            <Paragraphs text={project.body} />
          </div>

          <dl className={s.stats} data-in>
            {project.stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section className={s.sectors} data-in>
          <h2>How it works</h2>
          <ol>
            {project.sectors.map((sector, i) => (
              <li key={sector.title}>
                <span className={s.sectorTag}>S{i + 1}</span>
                <h3>{sector.title}</h3>
                <p>{sector.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {project.media.length > 0 && (
          <section className={s.media} data-media data-in>
            <h2>On screen</h2>
            <div>
              {project.media.map((item) =>
                item.kind === 'video' ? (
                  <video key={item.src} src={item.src} aria-label={item.alt} controls muted playsInline preload="none" />
                ) : (
                  <img key={item.src} src={item.src} alt={item.alt} loading="lazy" />
                ),
              )}
            </div>
          </section>
        )}

        <section className={s.facts} data-in>
          <h2>Built with</h2>
          <ul className={s.stack}>
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {project.role && (
            <p className={s.role} data-role>
              {project.role}
            </p>
          )}
          <p className={s.links}>
            <a href={project.links.repo} target="_blank" rel="noreferrer">
              Code on GitHub
            </a>
            {project.links.live && (
              <a href={project.links.live} target="_blank" rel="noreferrer" data-live>
                Open it live
              </a>
            )}
          </p>
        </section>

        <nav className={s.pager} aria-label="Other projects" data-in>
          <Link to={`/work/${prev.slug}`} data-prev preventScrollReset>
            <span>Previous</span>
            {prev.title}
          </Link>
          <Link to={`/work/${next.slug}`} data-next preventScrollReset>
            <span>Next</span>
            {next.title}
          </Link>
        </nav>
      </div>
    </div>
  );
}
