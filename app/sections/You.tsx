import Markdown from 'react-markdown';

import portrait from '~/assets/portrait.webp';
import { timeline, you } from '~/content';

import s from './You.module.css';

export function You() {
  return (
    <section id="you" className={s.you} aria-labelledby="you-title">
      <figure className={s.portrait}>
        <img src={portrait} alt={you.portraitAlt} width={960} height={1200} loading="lazy" decoding="async" />
      </figure>

      <div className={s.text}>
        <h2 id="you-title">Me</h2>
        <div className={s.body}>
          <Markdown>{you.body}</Markdown>
        </div>
      </div>

      <div className={s.history}>
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
    </section>
  );
}
