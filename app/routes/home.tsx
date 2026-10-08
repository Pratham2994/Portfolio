import { useEffect, useRef } from 'react';
import { Outlet, useParams } from 'react-router';

import { Desk } from '~/sections/Desk';
import { Wall } from '~/wall/Wall';

export default function Home() {
  const { slug } = useParams();
  const last = useRef<string | undefined>(undefined);

  // When a project closes, hand focus back to its poster.
  useEffect(() => {
    if (!slug && last.current) {
      document.querySelector<HTMLElement>(`[data-poster="${last.current}"]`)?.focus({ preventScroll: true });
    }
    last.current = slug;
  }, [slug]);

  return (
    <>
      <main inert={slug !== undefined}>
        <h1 className="sr-only">Pratham Panchal</h1>
        <Wall />
        <Desk />
      </main>
      <Outlet />
    </>
  );
}
