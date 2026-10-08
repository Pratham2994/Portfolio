import { useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, useParams } from 'react-router';

import { initReveals } from '~/lib/scroll';
import { Contact } from '~/sections/Contact';
import { Desk } from '~/sections/Desk';
import { You } from '~/sections/You';
import { Wall } from '~/wall/Wall';

export default function Home() {
  const { slug } = useParams();
  const last = useRef<string | undefined>(undefined);

  // The sections below the wall belong to this layout, so their reveals start with it.
  // A layout effect, so it runs before the root marks the page ready and hides unseen ones.
  useLayoutEffect(() => initReveals(), []);

  // When a project closes, hand focus back to its poster.
  useEffect(() => {
    if (!slug && last.current) {
      document.querySelector<HTMLElement>(`[data-poster="${CSS.escape(last.current)}"]`)?.focus({ preventScroll: true });
    }
    last.current = slug;
  }, [slug]);

  return (
    <>
      <main inert={slug !== undefined}>
        <h1 className="sr-only">Pratham Panchal</h1>
        <Wall />
        <Desk />
        <You />
        <Contact />
      </main>
      <Outlet />
    </>
  );
}
