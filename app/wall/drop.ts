import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

let live: gsap.core.Timeline | null = null;

// When the sheets start to go back up, in seconds. Until then the bare wall is there to be read.
const RETURN = 7.5;
const LIFT = 1.1; // how long one sheet takes to go back up
const GAP = 0.08; // between one sheet and the next

/**
 * What the bare wall has written on it: true things about how this site is made. A different
 * handful shows on each press.
 */
const FACTS: [number: string, what: string][] = [
  ['750+', 'tests, each one in a real browser'],
  ['16', 'screen widths checked, from a phone to a 27 inch monitor'],
  ['0', 'cookies'],
  ['1', 'cat'],
  ['11', 'secret words. You have found the button'],
  ['13', 'sheets on this wall, each hung by hand'],
  ['12', 'pages, built to plain HTML before you asked'],
  ['3', 'typefaces'],
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
  const facts = gsap.utils.shuffle(FACTS.slice());
  const told = new Map(gsap.utils.shuffle(high).map((sheet, i) => [sheet, facts[i]]));

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
 * up: lifted, carried to its place in one easy move, and set down.
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

  // Hung back, in a mixed order, the way a pile gets picked up. Each sheet is lifted off the
  // floor, carried up in one easy move as it turns straight, and set down on its place.
  gsap.utils.shuffle(pile).forEach(({ sheet }, i) => {
    const at = RETURN + i * GAP;
    timeline
      .to(sheet, { x: 0, y: 0, rotation: 0, duration: LIFT, ease: 'power3.inOut' }, at)
      // It comes a little toward you on the way, and goes back to the wall as it arrives.
      .to(sheet, { scale: 1.07, duration: LIFT * 0.5, ease: 'sine.out' }, at)
      .to(sheet, { scale: 1, duration: LIFT * 0.5, ease: 'sine.in' }, at + LIFT * 0.5);
  });
  // The centre piece straightens last, once everything is back.
  if (centre) timeline.to(centre, { rotation: 0, duration: 0.9, ease: 'power3.inOut' }, RETURN + pile.length * GAP + 0.2);
}
