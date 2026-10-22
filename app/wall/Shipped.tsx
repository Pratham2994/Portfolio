import { useEffect, useState, useSyncExternalStore } from 'react';

import { shipped as built, you } from '~/content';
import { track } from '~/lib/analytics';

import styles from './Wall.module.css';

type Shipped = { repo: string; at: string } | null;

/** How long ago, in words: "yesterday", "3 days ago". */
function ago(at: string): string {
  const hours = (Date.parse(at) - Date.now()) / 3.6e6;
  const say = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  return Math.abs(hours) < 24 ? say.format(Math.round(hours), 'hour') : say.format(Math.round(hours / 24), 'day');
}

const still = () => () => {};
/** Worked out in the browser, so it is never stale. The page built ahead of time has no time in it. */
const useAgo = (at: string | undefined) => useSyncExternalStore(still, () => (at ? ago(at) : ''), () => '');

/**
 * The last push to a project. The build's answer first, if it got one; then the Worker's, which
 * asks GitHub now and then and keeps the answer, so it is fresh between deploys too.
 */
function useShipped(): Shipped {
  const [live, setLive] = useState<Shipped>(null);
  useEffect(() => {
    const ask = new AbortController();
    fetch('/api/shipped', { signal: ask.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { repo: string | null; at: string | null } | null) => {
        if (body?.repo && body.at) setLive({ repo: body.repo, at: body.at });
      })
      .catch(() => {});
    return () => ask.abort();
  }, []);
  return live ?? built;
}

/** Proof that the work goes on: the last push to a project, under the album, linked to the repo. */
export function Shipped() {
  const last = useShipped();
  const when = useAgo(last?.at);
  if (!last) return null;
  return (
    <a
      className={styles.shipped}
      href={`${you.github.replace(/\/+$/, '')}/${last.repo}`}
      target="_blank"
      rel="noreferrer"
      data-shipped
      onClick={() => track('shipped_clicked', { repo: last.repo })}
    >
      Last push: <b>{last.repo}</b>
      {when && `, ${when}`}
    </a>
  );
}
