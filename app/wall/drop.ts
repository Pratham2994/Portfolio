import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

let live: gsap.core.Timeline | null = null;

// When the sheets start to go back up, in seconds. Until then the bare wall is there to be read.
const RETURN = 7.5;
const HANG = 0.34; // the flight up
const LAND = 0.3; // the last stretch onto the wall

/** What the bare wall has written on it: true things about how this site is made. */
const FACTS: [number: string, what: string][] = [
  ['750+', 'tests, each one in a real browser'],
  ['16', 'screen widths checked, from a phone to a 27 inch monitor'],
  ['0', 'cookies'],
  ['1', 'cat'],
];

/** The word the board in the middle turns to, and the line under it, while the wall is down. */
const BOARD = { word: 'WARNED', proof: 'You were told. So here is the wall itself, and what holds this site up.' };
const board = (detail: typeof BOARD | null) => window.dispatchEvent(new CustomEvent('wall:board', { detail }));

/**
 * The pencil marks behind the sheets: where each one hangs, its nail, and its paper size, as
 * the person who hung the wall would have drawn them. A few of the places carry a number.
 */
function marks(wall: HTMLElement, sheets: HTMLElement[]): HTMLElement {
  const grid = wall.querySelector<HTMLElement>(':scope > div')!;
  const layer = document.createElement('div');
  layer.className = 'wall-marks';
  layer.dataset.marks = '';
  layer.setAttribute('aria-hidden', 'true');
  grid.prepend(layer);
  const base = layer.getBoundingClientRect();
  // The numbers go where posters hang, a different four each time.
  // Only in the top row: the pile on the floor hides the places lower down.
  const top = Math.min(...sheets.map((sheet) => sheet.getBoundingClientRect().top));
  const high = sheets.filter((sheet) => 'poster' in sheet.dataset && sheet.getBoundingClientRect().top - top < 60);
  const told = new Map(gsap.utils.shuffle(high).map((sheet, i) => [sheet, FACTS[i]]));

  for (const sheet of sheets) {
    const box = sheet.getBoundingClientRect();
    const paper = sheet.closest<HTMLElement>('[data-paper]')?.dataset.paper?.slice(0, 2).toUpperCase() ?? '';
    const mark = document.createElement('div');
    mark.className = 'wall-mark';
    Object.assign(mark.style, { left: `${box.left - base.left}px`, top: `${box.top - base.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    const fact = told.get(sheet);
    mark.innerHTML = `<i></i><span>${paper}</span>${fact ? `<b>${fact[0]}</b><em>${fact[1]}</em>` : ''}`;
    layer.append(mark);
  }
  return layer;
}

/**
 * Everything falls off the wall, and the wall is left bare. On it are the pencil marks of the
 * person who hung it, and a few true numbers about how the site is made. The board in the
 * middle says you were warned. After a while, or on a second press, each sheet is thrown back
 * up: it spins through the air, slaps onto its place, and the wall takes a knock for every hit.
 */
export function dropWall(wall: HTMLElement): void {
  // A second press, while the wall is bare, hangs it back now.
  if (live) {
    if (live.time() < RETURN) live.seek(RETURN, false);
    return;
  }
  if ('fallen' in wall.dataset || prefersReducedMotion()) return;
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const centre = wall.querySelector('[data-centre]');
  if (!sheets.length) return;

  const layer = marks(wall, sheets);
  wall.dataset.fallen = '';
  board(BOARD);
  const floor = wall.getBoundingClientRect().bottom;

  const timeline = gsap.timeline({
    onComplete: () => {
      gsap.set([...sheets, centre, wall], { clearProps: 'transform,x,y,rotation,scale' });
      layer.remove();
      delete wall.dataset.fallen;
      board(null);
      live = null;
    },
  });
  live = timeline;

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

  // The marks come up as each sheet leaves its place, and the numbers are written a beat later.
  const drawn = gsap.utils.toArray<HTMLElement>('.wall-mark', layer);
  timeline
    .fromTo(drawn, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.045 }, 0.3)
    .fromTo(layer.querySelectorAll('b, em'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.12 }, 1.5)
    // They go as the first sheet is picked up.
    .to(layer, { opacity: 0, duration: 0.35, ease: 'none' }, RETURN - 0.1);

  // The throw back, in a mixed order, the way a pile gets picked up.
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
