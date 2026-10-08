import type { Project } from '~/content/schema';

import s from './art.module.css';
import { ART } from './templates';

export function Art({ art }: { art: Project['art'] }) {
  const Template = ART[art.template];
  return (
    <span className={s.art} data-art aria-hidden="true">
      <Template motif={art.motif} />
    </span>
  );
}
