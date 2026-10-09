import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

let busy = false;

/**
 * Everything falls off the wall. The sheets drop, bounce and pile up along the bottom,
 * lie there for a moment, then fly back to their places one by one.
 */
export function dropWall(wall: HTMLElement): void {
  if (busy || prefersReducedMotion()) return;
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const centre = wall.querySelector('[data-centre]');
  if (!sheets.length) return;

  busy = true;
  wall.dataset.fallen = '';
  const floor = wall.getBoundingClientRect().bottom;

  const timeline = gsap.timeline({
    onComplete: () => {
      gsap.set([...sheets, centre, wall], { clearProps: 'transform,x,y,rotation' });
      delete wall.dataset.fallen;
      busy = false;
    },
  });

  // A jolt first, as if something hit the wall.
  timeline.fromTo(wall, { x: -9 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.4, 0.2)' }, 0);
  if (centre) timeline.to(centre, { rotation: -2.5, duration: 0.5, ease: 'elastic.out(1, 0.3)' }, 0.05);

  sheets.forEach((sheet, i) => {
    const box = sheet.getBoundingClientRect();
    const fall = floor - box.bottom - gsap.utils.random(4, 26);
    const at = 0.12 + i * 0.045;
    timeline
      .to(sheet, { y: fall, duration: gsap.utils.random(0.75, 1.05), ease: 'bounce.out' }, at)
      .to(sheet, { rotation: gsap.utils.random(-75, 75), x: gsap.utils.random(-50, 50), duration: 0.9, ease: 'power2.out' }, at)
      // Back up: each sheet is dealt to its place again.
      .to(sheet, { x: 0, y: 0, rotation: 0, duration: 0.7, ease: 'back.out(1.6)' }, 2.5 + i * 0.07);
  });
  if (centre) timeline.to(centre, { rotation: 0, duration: 0.6, ease: 'back.out(2)' }, 2.5);
}
