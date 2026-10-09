import { Link } from 'react-router';

import { projects, timeline, you } from '~/content';
import { track } from '~/lib/analytics';
import { pageMeta, SITE } from '~/lib/meta';

import s from './brief.module.css';

export function meta() {
  return pageMeta({
    title: 'Pratham Panchal - the one-page version',
    description: 'Software engineer in Pune, India. Experience, education, projects and contact details on one page.',
    path: '/brief',
    image: 'home',
  });
}

// The wall names its tool groups in its own voice. This page uses the plain names.
const PLAIN: Record<string, string> = {
  'Servers and data': 'Backend and data',
  Models: 'Machine learning',
  'Close to the metal': 'Systems and hardware',
  'On screen': 'Frontend',
  'Every day': 'Tooling',
};

// The college row is education. Everything else in the list is work.
const isStudy = (role: string) => /B\.Tech|degree/i.test(role);

/**
 * The same facts as the wall, with no wall: one plain page for someone with two minutes.
 * It prints on one sheet, so "save as PDF" gives a page to pass on.
 */
export default function Brief() {
  const work = timeline.filter((item) => !isStudy(item.role));
  const study = timeline.filter((item) => isStudy(item.role));

  return (
    <main className={s.brief}>
      <nav className={s.bar}>
        <Link to="/" onClick={() => track('brief_to_wall')}>
          ← The full site
        </Link>
        <button
          type="button"
          onClick={() => {
            track('brief_printed');
            window.print();
          }}
        >
          Print, or save as PDF
        </button>
      </nav>

      <header className={s.head}>
        <h1>Pratham Panchal</h1>
        <p className={s.role}>Software Engineer at Barclays. Pune, India.</p>
        <ul className={s.reach}>
          <li>
            <a href={`mailto:${you.email}`}>{you.email}</a>
          </li>
          <li>
            <a href={you.github}>{you.github.replace('https://', '')}</a>
          </li>
          <li>
            <a href={you.linkedin}>
              <span className={s.onScreen}>LinkedIn</span>
              <span className={s.onPaper}>{you.linkedin.replace('https://www.', '').replace(/\/$/, '')}</span>
            </a>
          </li>
          <li className={s.onPaper}>
            <a href={SITE}>{SITE.replace('https://', '')}</a>
          </li>
        </ul>
        <p className={s.lede}>
          Outside work I design and build developer tools, data systems and small hardware projects. Each project
          below links to a page with a working demo and to its source code.
        </p>
      </header>

      <section>
        <h2>Experience</h2>
        <ul className={s.rows}>
          {work.map((item) => (
            <li key={item.org + item.when}>
              <b>{item.org}</b>
              <span>{item.role}</span>
              <time>{item.when}</time>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Education</h2>
        <ul className={s.rows}>
          {study.map((item) => (
            <li key={item.org}>
              <b>{item.org}</b>
              <span>{item.role}</span>
              <time>{item.when}</time>
            </li>
          ))}
        </ul>
        <p className={s.fine}>{you.quiet}</p>
      </section>

      <section>
        <h2>Projects</h2>
        <ul className={s.projects}>
          {projects.map((project) => (
            <li key={project.slug}>
              <b>
                <Link to={`/work/${project.slug}`}>{project.title}</Link>
              </b>
              <span>{project.summary ?? project.tagline}</span>
              <small>
                {project.stack.join(', ')}
                <a href={project.links.repo} className={s.code}>
                  code
                </a>
                {project.links.live && (
                  <a href={project.links.live} className={s.code}>
                    live
                  </a>
                )}
              </small>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Skills</h2>
        <dl className={s.tools}>
          <div>
            <dt>Languages</dt>
            <dd>{you.stack.languages.map((language) => language.name).join(', ')}</dd>
          </div>
          {you.stack.groups.map((group) => (
            <div key={group.name}>
              <dt>{PLAIN[group.name] ?? group.name}</dt>
              <dd>{group.items.join(', ')}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
