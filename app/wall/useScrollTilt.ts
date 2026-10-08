import { useEffect, type RefObject } from 'react';

import { finePointer, prefersReducedMotion } from '~/lib/motion';

/**
 * As the wall scrolls away, the view tilts down toward the desk, like a camera move.
 * It writes --scroll (0 at the top of the wall, 1 when the wall has left) on the wall's
 * parent, so the wall and the section below it can both read it.
 */
export function useScrollTilt(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const wall = ref.current;
    const host = wall?.parentElement;
    if (!wall || !host || !finePointer() || prefersReducedMotion()) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const box = wall.getBoundingClientRect();
      const progress = Math.min(Math.max(-box.top / box.height, 0), 1);
      host.style.setProperty('--scroll', progress.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      host.style.removeProperty('--scroll');
    };
  }, [ref]);
}
