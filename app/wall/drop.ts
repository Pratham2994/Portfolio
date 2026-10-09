import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

let busy = false;

/**
 * Everything falls off the wall. The sheets drop, bounce and pile up along the bottom and
 * lie there for a moment. Then each one is thrown back up: it spins through the air, slaps
 * onto its place, and the wall takes a small knock for every hit.
 */
export function dropWall(wall: HTMLElement): void {
  if (busy || 'fallen' in wall.dataset || prefersReducedMotion()) return;
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const centre = wall.querySelector('[data-centre]');
  if (!sheets.length) return;

  busy = true;
  wall.dataset.fallen = '';
  const floor = wall.getBoundingClientRect().bottom;

  const timeline = gsap.timeline({
    onComplete: () => {
      gsap.set([...sheets, centre, wall], { clearProps: 'transform,x,y,rotation,scale' });
      delete wall.dataset.fallen;
      busy = false;
    },
  });

  // A jolt first, as if something hit the wall.
  timeline.fromTo(wall, { x: -9 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.4, 0.2)' }, 0);
  if (centre) timeline.to(centre, { rotation: -2.5, duration: 0.5, ease: 'elastic.out(1, 0.3)' }, 0.05);

  // The fall.
  const pile = sheets.map((sheet, i) => {
    const box = sheet.getBoundingClientRect();
    const y = floor - box.bottom - gsap.utils.random(4, 26);
    const x = gsap.utils.random(-50, 50);
    const at = 0.12 + i * 0.045;
    timeline
      .to(sheet, { y, duration: gsap.utils.random(0.75, 1.05), ease: 'bounce.out' }, at)
      .to(sheet, { rotation: gsap.utils.random(-75, 75), x, duration: 0.9, ease: 'power2.out' }, at);
    return { sheet, x, y };
  });

  // The throw back, from the bottom row up, so the pile clears in the order it would be picked up.
  const RETURN = 2.5;
  const HANG = 0.34; // the flight up
  const LAND = 0.3; // the last stretch onto the wall
  gsap.utils.shuffle(pile).forEach(({ sheet, x, y }, i) => {
    const at = RETURN + i * 0.11;
    const spin = gsap.utils.random([-1, 1]) * gsap.utils.random(300, 420);
    timeline
      // Up and out toward the viewer, spinning.
      .to(sheet, { x: x * 0.3, y: y * 0.25 - 60, scale: 1.45, rotation: spin, duration: HANG, ease: 'power2.out' }, at)
      // Then flat onto its place.
      .to(sheet, { x: 0, y: 0, scale: 1, rotation: spin > 0 ? 360 : -360, duration: LAND, ease: 'power3.in' }, at + HANG)
      .set(sheet, { rotation: 0 }, at + HANG + LAND)
      // The hit: the sheet gives a little, and the wall takes the knock.
      .fromTo(sheet, { scale: 0.93 }, { scale: 1, duration: 0.35, ease: 'back.out(3.5)', immediateRender: false }, at + HANG + LAND)
      .fromTo(
        wall,
        { x: gsap.utils.random(-6, 6), y: gsap.utils.random(-4, 4) },
        { x: 0, y: 0, duration: 0.18, ease: 'power2.out', immediateRender: false },
        at + HANG + LAND,
      );
  });
  // The centre piece straightens last, once everything is back.
  if (centre) timeline.to(centre, { rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }, RETURN + pile.length * 0.11 + 0.3);
}
