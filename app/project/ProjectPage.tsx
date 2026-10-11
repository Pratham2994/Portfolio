import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { neighbours, projects } from '~/content';
import type { Project } from '~/content/schema';
import { collect } from '~/wall/Album';
import { Art } from '~/wall/art';
import { Paragraphs } from '~/lib/Paragraphs';
import { contrast } from '~/lib/colour';
import { track } from '~/lib/analytics';

import { Demo } from './Demo';
import { Flap } from './Flap';
import { Flow } from './Flow';
import { follow } from './follow';
import s from './ProjectPage.module.css';
import { Sketch, hasSketch } from './Sketch';
import { Stage, kindOf } from './Stage';
import { cancelTransition, closeLive, closeTo, openFrom, riseIn, takeClosed, takeIntent, takeTurned, turnTo } from './transition';

const pad = (n: number) => String(n).padStart(2, '0');
const longestWord = (text: string) => Math.max(...text.split(/\s+/).map((word) => word.length));

/** The accent, if small type in it can be read on the page colour. If not, the text colour. */
const readable = ({ bg, fg, accent }: Project['palette']) => (contrast(accent, bg) >= 4.5 ? accent : fg);

// Arrow keys belong to these when one of them has the focus.
const USES_ARROWS = 'input, select, textarea, video, audio, [contenteditable], [role="slider"]';

export function ProjectPage({ project }: { project: Project }) {
  const navigate = useNavigate();
  const title = useRef<HTMLHeadingElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const { prev, next } = neighbours(project.slug);
  const position = projects.findIndex((p) => p.slug === project.slug) + 1;

  useLayoutEffect(() => {
    const node = page.current!;
    const poster = () => document.querySelector<HTMLElement>(`[data-poster="${project.slug}"]`);
    if (takeIntent(project.slug)) {
      fromWall.current = true;
      void openFrom(poster(), node);
    }
    // A page that opens with a cut (history, next, previous) must not sit under a closing sheet.
    else {
      cancelTransition();
      if (takeTurned()) riseIn(node);
    }
    return () => {
      // Runs before the page leaves the DOM. Only a return to the wall shrinks back to the poster.
      if (takeClosed()) return;
      if (window.location.pathname === '/') void closeTo(poster(), node);
    };
  }, [project.slug]);

  // The bar at the top and the pinned steps both follow the scroll of this page.
  useEffect(() => follow(page.current!), [project.slug]);

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    // Opening a page is what puts its sticker in the album on the wall.
    collect(project.slug);
  }, [project.slug]);

  // Closes with the fold-down move, then goes to the wall. A second call while it runs does nothing.
  const closing = useRef(false);
  const fromWall = useRef(false);
  const close = useCallback(() => {
    if (closing.current || !page.current) return;
    closing.current = true;
    const poster = document.querySelector<HTMLElement>(`[data-poster="${project.slug}"]`);
    // Opened from the wall: step back in history, so the Back button does not reopen this page.
    void closeLive(poster, page.current).then(() =>
      fromWall.current ? navigate(-1) : navigate('/', { preventScrollReset: true }),
    );
  }, [navigate, project.slug]);

  // Turns to the next or the previous project. The sheet covers this page, then the page changes.
  const upNext = useRef<HTMLAnchorElement>(null);
  const turn = useCallback(
    (to: Project, side: 'left' | 'right') => {
      if (closing.current) return;
      closing.current = true;
      track('project_turned', { from: project.slug, to: to.slug });
      void turnTo(to.palette.bg, side, side === 'right' ? upNext.current : null).then(() =>
        navigate(`/work/${to.slug}`, { preventScrollReset: true }),
      );
    },
    [navigate, project.slug],
  );

  // A layout effect, so Escape works from the first frame the page is on screen.
  useLayoutEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return close();
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest(USES_ARROWS)) return;
      if (event.key === 'ArrowRight') turn(next, 'right');
      if (event.key === 'ArrowLeft') turn(prev, 'left');
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
  }, [close, turn, next, prev, project.palette.bg]);

  // A plain click plays the close. A modified click (new tab) is left to the browser.
  const onCloseClick = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    close();
  };

  const onTurnClick = (to: Project, side: 'left' | 'right') => (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    turn(to, side);
  };

  // "Under review" is a decision that has not come yet, so the page shows it the way a match does.
  const underReview = /under review/i.test(project.status);

  const style = {
    '--bg': project.palette.bg,
    '--fg': project.palette.fg,
    '--accent': project.palette.accent,
    '--page-bg': project.palette.bg,
    '--page-fg': project.palette.fg,
    // The same accent on a sheet in the swapped colours, where the page's text colour is the ground.
    '--sheet-accent': readable({ bg: project.palette.fg, fg: project.palette.bg, accent: project.palette.accent }),
  } as CSSProperties;

  // A project with a stage gets a page of its own kind. The others keep the plain one.
  const kind = kindOf(project.slug);

  const heading = (
    <div className={s.heroText}>
      {/* On a phone the bar has no room for the status, so it sits here. */}
      <span className={s.statusBelow} data-var={underReview || undefined}>
        {underReview && <b aria-hidden="true">VAR</b>}
        {project.status}
      </span>
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
  );

  const why = (
    <div className={s.why} data-in>
      <Paragraphs text={project.body} />
      {/* On a team project, exactly what was mine. */}
      {project.role && (
        <p className={s.role} data-role>
          <b>My part</b>
          {project.role}
        </p>
      )}
    </div>
  );

  const stats = (
    <dl className={s.stats} data-in>
      {project.stats.map((stat) => (
        <div key={stat.label}>
          <dt>{stat.label}</dt>
          <dd>
            <Flap text={stat.value} />
          </dd>
        </div>
      ))}
    </dl>
  );

  const steps = project.sectors.map((sector, i) => (
    <li key={sector.title}>
      <span className={s.sectorTag}>S{i + 1}</span>
      <h3>{sector.title}</h3>
      <p>{sector.body}</p>
    </li>
  ));

  // With a small drawing, the three steps are pinned beside it and the scroll goes through them.
  const how = hasSketch(project.slug) ? (
    <section className={s.how} data-how data-at="0">
      <div className={s.pin} data-in>
        <div>
          <h2>How it works</h2>
          <ol className={s.steps}>{steps}</ol>
        </div>
        <Sketch slug={project.slug} />
      </div>
    </section>
  ) : (
    <section className={s.sectors} data-in>
      <h2>How it works</h2>
      <ol>{steps}</ol>
    </section>
  );

  const demo = <Demo slug={project.slug} />;

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
      {/* Keyed by the project, so it plays again when the next or the previous one opens. */}
      <div className={s.third} key={project.slug} aria-hidden="true" data-third>
        <b>{pad(position)}</b>
        <span>
          <strong>{project.title}</strong>
          <i>{project.status}</i>
        </span>
      </div>
      <div className={s.inner}>
        <header className={s.bar} data-in>
          <Link to="/" className={s.close} data-close preventScrollReset onClick={onCloseClick}>
            Back to the wall
            <kbd aria-hidden="true">Esc</kbd>
          </Link>
          <span className={s.count}>
            {pad(position)} / {pad(projects.length)}
          </span>
          <span className={s.status} data-var={underReview || undefined}>
            {underReview && <b aria-hidden="true">VAR</b>}
            {project.status}
          </span>
          {/* Three sectors, as on a timing screen. Each one fills as the page goes by. */}
          <i className={s.laps} aria-hidden="true" data-laps>
            <b />
            <b />
            <b />
          </i>
        </header>

        {kind ? (
          <>
            {/* The project at work, large, with its name beside it. */}
            <div className={s.hero} data-kind={kind}>
              {heading}
              <Stage slug={project.slug} />
            </div>
            <div className={s.intro} data-kind={kind}>
              {why}
              {stats}
            </div>
            {how}
            {demo}
          </>
        ) : (
          <>
            {/* Two columns on a wide page: the words on the left, the art and the numbers on the right. */}
            <div className={s.top}>
              <div className={s.lead}>
                {heading}
                {why}
              </div>
              <div className={s.aside}>
                {/* The poster's own art, drawn large in swapped colours. */}
                <div className={s.plate} data-in>
                  <Art art={project.art} />
                </div>
                {stats}
              </div>
            </div>
            {how}
            {demo}
            {project.flow && (
              <section className={s.under} data-flow data-in>
                <h2>Under the hood</h2>
                <Flow flow={project.flow} title={project.title} />
              </section>
            )}
          </>
        )}

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
          <p className={s.links}>
            <a href={project.links.repo} target="_blank" rel="noreferrer" onClick={() => track('repo_clicked', { project: project.slug })}>
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
          {/* The next project is already there, in its own colours, with its sheet half out. */}
          <Link
            to={`/work/${next.slug}`}
            className={s.upNext}
            style={{ '--bg': next.palette.bg, '--fg': next.palette.fg, '--accent': next.palette.accent } as CSSProperties}
            ref={upNext}
            data-next
            preventScrollReset
            onClick={onTurnClick(next, 'right')}
          >
            <span className={s.upText}>
              <span>
                Next project
                <kbd aria-hidden="true">&rarr;</kbd>
              </span>
              <strong>{next.title}</strong>
              <em>{next.tagline}</em>
            </span>
            <span
              className={s.sheet}
              style={{ '--bg': next.palette.fg, '--fg': next.palette.bg } as CSSProperties}
              aria-hidden="true"
            >
              <Art art={next.art} />
            </span>
          </Link>
          <Link to={`/work/${prev.slug}`} className={s.before} data-prev preventScrollReset onClick={onTurnClick(prev, 'left')}>
            <span>
              <kbd aria-hidden="true">&larr;</kbd>
              Previous
            </span>
            {prev.title}
          </Link>
        </nav>
      </div>
    </div>
  );
}
