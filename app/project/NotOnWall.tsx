import { Link } from 'react-router';

import s from './ProjectPage.module.css';

export function NotOnWall() {
  return (
    <article className={`${s.page} ${s.missing}`} data-missing>
      <h1>Not on the wall</h1>
      <p>There is no poster at this address.</p>
      <p>
        <Link to="/">Back to the wall</Link>
      </p>
    </article>
  );
}
