import { useEffect, type RefObject } from 'react';

import { finePointer } from '~/lib/motion';

// Pointer speed, in pixels per millisecond, at which the wall is "swept" or "browsed".
const SLOW = 0.25;
const FAST = 1.4;
// How long a sheet takes to fade back, and how long the wall stays dim after the pointer
// leaves the sheets. Both shrink as the pointer speeds up.
const FADE = { slow: 240, fast: 90 };
const GRACE = { slow: 200, fast: 90 };

const mix = (range: { slow: number; fast: number }, pace: number) => Math.round(range.slow + (range.fast - range.slow) * pace);

/**
 * The sheet under the pointer keeps its light and the rest step back, at once. The wall
 * stays dim while the pointer crosses the gaps between sheets, so it does not flash.
 *
 * The timing follows the hand. A fast sweep gets short fades, so the light keeps up with the
 * pointer. A slow move gets softer ones. The fade time is written to --dim on the grid.
 */
export function useSpotlight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const grid = ref.current;
    if (!grid || !finePointer()) return;
    let timer = 0;
    let pace = 0; // 0 when the pointer is slow, 1 when it is fast
    let last = { x: 0, y: 0, t: 0 };

    const onMove = (event: PointerEvent) => {
      const dt = event.timeStamp - last.t;
      if (dt > 0 && dt < 120) {
        const speed = Math.hypot(event.clientX - last.x, event.clientY - last.y) / dt;
        const now = Math.min(Math.max((speed - SLOW) / (FAST - SLOW), 0), 1);
        // Smoothed, so one odd sample does not change the feel.
        pace += (now - pace) * 0.35;
        grid.style.setProperty('--dim', `${mix(FADE, pace)}ms`);
      } else if (dt >= 120) {
        pace = 0;
      }
      last = { x: event.clientX, y: event.clientY, t: event.timeStamp };
    };

    const light = () => {
      delete grid.dataset.dim;
    };
    const lightSoon = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(light, mix(GRACE, pace));
    };
    const onOver = (event: PointerEvent) => {
      if ((event.target as Element).closest('[data-poster], [data-piece]')) {
        window.clearTimeout(timer);
        grid.dataset.dim = '';
      } else {
        lightSoon();
      }
    };

    grid.addEventListener('pointermove', onMove, { passive: true });
    grid.addEventListener('pointerover', onOver);
    grid.addEventListener('pointerleave', lightSoon);
    return () => {
      window.clearTimeout(timer);
      grid.removeEventListener('pointermove', onMove);
      grid.removeEventListener('pointerover', onOver);
      grid.removeEventListener('pointerleave', lightSoon);
    };
  }, [ref]);
}
