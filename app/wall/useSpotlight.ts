import { useEffect, type RefObject } from 'react';

import { finePointer } from '~/lib/motion';

const DWELL = 260; // ms the pointer must rest on a sheet before the others step back
const GRACE = 350; // ms the wall stays dim after the pointer leaves the sheets

/**
 * Dims the other sheets only when the pointer settles on one. A pointer that sweeps across
 * the wall never rests long enough, so nothing flickers. Once dim, the wall stays dim while
 * the pointer moves from sheet to sheet, and lights up again a moment after it leaves.
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
      } else if (!('dim' in grid.dataset)) {
        timer = window.setTimeout(() => {
          grid.dataset.dim = '';
        }, DWELL);
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
