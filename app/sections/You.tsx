import portrait from "~/assets/portrait.webp";
import { useState } from "react";
import { Link } from "react-router";

import { projects, timeline, you } from "~/content";
import { track } from "~/lib/analytics";
import { Paragraphs } from "~/lib/Paragraphs";

import s from "./You.module.css";

// A language that names a project not on the wall is a mistake in the content, so the build stops.
const TITLES = new Map(
  projects.map((project) => [project.slug, project.title]),
);
for (const language of you.stack.languages) {
  for (const slug of language.used)
    if (!TITLES.has(slug))
      throw new Error(
        `site/you: ${language.name} names an unknown project, "${slug}"`,
      );
}

export function You() {
  // One language is open at a time, and shows where it was used.
  const [open, setOpen] = useState(0);
  const language = you.stack.languages[open];
  return (
    <section id="you" className={s.you} aria-labelledby="you-title">
      {/* Two columns on a wide screen: the photo with the tools under it, and the words with the history. */}
      <div className={s.side}>
        <figure className={s.portrait} data-reveal>
          <div className={s.print}>
            <img
              src={portrait}
              alt={you.portraitAlt}
              width={960}
              height={1200}
              loading="lazy"
              decoding="async"
            />
          </div>
        </figure>

        <div className={s.stack} data-reveal data-stack>
          <h3>What I build with</h3>
          <div className={s.languages} role="group" aria-label="Languages">
            {you.stack.languages.map((item, i) => (
              <button
                key={item.name}
                type="button"
                aria-pressed={open === i}
                data-first={item.first || undefined}
                onClick={() => setOpen(i)}
              >
                {item.name}
                <sup>{item.used.length}</sup>
              </button>
            ))}
          </div>
          <p className={s.used} aria-live="polite">
            <span>{language.name} in </span>
            {language.used.map((slug, i) => (
              <span key={slug}>
                {i > 0 && ", "}
                <Link
                  to={`/work/${slug}`}
                  preventScrollReset
                  onClick={() =>
                    track("stack_project", {
                      language: language.name,
                      project: slug,
                    })
                  }
                >
                  {TITLES.get(slug)}
                </Link>
              </span>
            ))}
          </p>
          <dl className={s.tools}>
            {you.stack.groups.map((group) => (
              <div key={group.name}>
                <dt>{group.name}</dt>
                <dd>{group.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
          <p className={s.quiet}>{you.stack.note}</p>
        </div>
      </div>

      <div className={s.main}>
        <div className={s.text} data-reveal>
          <h2 id="you-title">Me</h2>
          <div className={s.body}>
            <Paragraphs text={you.body} />
          </div>
        </div>

        <div className={s.history} data-reveal>
          <h3>So far</h3>
          <ol>
            {timeline.map((item) => (
              <li key={`${item.org}-${item.when}`}>
                <span className={s.when}>{item.when}</span>
                <strong>{item.org}</strong>
                <span>{item.role}</span>
              </li>
            ))}
          </ol>
          <p className={s.quiet}>{you.quiet}</p>
        </div>
      </div>
    </section>
  );
}
