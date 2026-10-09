import { useEffect, type RefObject } from 'react';

import { finePointer } from '~/lib/motion';

const GRACE = 320; // ms the wall stays dim after the pointer leaves the sheets

/**
 * The sheet under the pointer keeps its light and the rest step back, at once. The wall
 * used to flash bright each time the pointer crossed a gap between two sheets. Now it
 * stays dim across the gaps, and only lights up again a moment after the pointer has left
 * the sheets for good.
 */
export function useSpotlight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const grid = ref.current;
    if (!grid || !finePointer()) return;
    let timer = 0;

    const light = () => {
      delete grid.dataset.dim;
    };
    const onOver = (event: PointerEvent) => {
      const onSheet = !!(event.target as Element).closest('[data-poster], [data-piece]');
      window.clearTimeout(timer);
      if (!onSheet) {
        timer = window.setTimeout(light, GRACE);
      } else {
        grid.dataset.dim = '';
      }
    };
    const onLeave = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(light, GRACE);
    };

    grid.addEventListener('pointerover', onOver);
    grid.addEventListener('pointerleave', onLeave);
    return () => {
      window.clearTimeout(timer);
      grid.removeEventListener('pointerover', onOver);
      grid.removeEventListener('pointerleave', onLeave);
    };
  }, [ref]);
}
