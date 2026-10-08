import { useEffect, type RefObject } from 'react';

import { finePointer, prefersReducedMotion } from '~/lib/motion';

/** Sets --view-x and --view-y (-1 to 1) on the element from the pointer position, eased. */
export function useDepth(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer() || prefersReducedMotion()) return;

    // Depth is only drawn on the wide wall, so the view only moves there.
    const wide = window.matchMedia('(min-width: 900px) and (orientation: landscape)');
    const target = { x: 0, y: 0 };
    const view = { x: 0, y: 0 };
    let frame = 0;

    const tick = () => {
      view.x += (target.x - view.x) * 0.08;
      view.y += (target.y - view.y) * 0.08;
      el.style.setProperty('--view-x', view.x.toFixed(3));
      el.style.setProperty('--view-y', view.y.toFixed(3));
      const moving = Math.abs(target.x - view.x) > 0.001 || Math.abs(target.y - view.y) > 0.001;
      frame = moving ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      target.x = wide.matches ? (event.clientX / window.innerWidth) * 2 - 1 : 0;
      target.y = wide.matches ? (event.clientY / window.innerHeight) * 2 - 1 : 0;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}
