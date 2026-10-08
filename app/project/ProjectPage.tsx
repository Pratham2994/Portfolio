import { useEffect, useRef, type CSSProperties } from 'react';
import Markdown from 'react-markdown';
import { Link, useNavigate } from 'react-router';

import { neighbours, projects } from '~/content';
import type { Project } from '~/content/schema';

import s from './ProjectPage.module.css';

const pad = (n: number) => String(n).padStart(2, '0');
const longestWord = (text: string) => Math.max(...text.split(/\s+/).map((word) => word.length));

export function ProjectPage({ project }: { project: Project }) {
  const navigate = useNavigate();
  const title = useRef<HTMLHeadingElement>(null);
  const { prev, next } = neighbours(project.slug);
  const position = projects.findIndex((p) => p.slug === project.slug) + 1;

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [project.slug]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate('/', { preventScrollReset: true });
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.dataset.projectOpen = '';
    return () => {
      window.removeEventListener('keydown', onKey);
      delete document.documentElement.dataset.projectOpen;
    };
  }, [navigate]);

  const style = {
    '--bg': project.palette.bg,
    '--fg': project.palette.fg,
    '--accent': project.palette.accent,
  } as CSSProperties;

  return (
    <article
      className={s.page}
      style={style}
      data-project={project.slug}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-title"
    >
      <div className={s.inner}>
        <header className={s.bar} data-in>
          <Link to="/" className={s.close} data-close preventScrollReset>
            Back to the wall
          </Link>
          <span className={s.count}>
            {pad(position)} / {pad(projects.length)}
          </span>
          <span className={s.status}>{project.status}</span>
        </header>

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

        <div className={s.why} data-in>
          <Markdown>{project.body}</Markdown>
        </div>

        <dl className={s.stats} data-in>
          {project.stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

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
    </article>
  );
}
