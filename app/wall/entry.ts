import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

export const PENDING = 'entry-pending';

/**
 * Runs in the document head, before the first paint. It hides the wall only when the boot
 * sequence is about to play, and shows it again by itself if the app never starts.
 * Phones and tablets skip the sequence, so their first paint never waits for scripts.
 */
export const pendingScript = `try{if(location.pathname==='/'&&matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.classList.add('${PENDING}');setTimeout(function(){d.classList.remove('${PENDING}')},5000)}}catch(e){}`;

// What the machine checks while it starts: the parts of the PC on the desk, and the cat.
const PARTS: [part: string, name: string][] = [
  ['CPU', 'Intel Core Ultra 7 265K'],
  ['GPU', 'RTX 5070 12GB'],
  ['RAM', '32GB DDR5 6000'],
  ['SSD', '2TB WD Black NVMe'],
  ['FAN', '360mm liquid cooler'],
  ['CAT', '1 found'],
];
// The memory test counts up to this, in MB, before it says OK.
const MEMORY = 32768;

/** The start-up check, built once. Each part gets a line: its name, a row of dots, and its result. */
function bootScreen() {
  const screen = document.createElement('div');
  screen.className = 'boot';
  screen.setAttribute('aria-hidden', 'true');
  screen.dataset.boot = '';
  const add = (tag: string, className: string, text = '', parent: HTMLElement = screen) => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    parent.append(node);
    return node;
  };
  const head = add('p', 'boot-head', 'PRATS BIOS 2.2');
  add('span', 'boot-skip', 'Any key skips', head);
  const lines = PARTS.map(([part, name]) => {
    const line = add('p', 'boot-line');
    add('b', '', part, line);
    add('span', '', name, line);
    const dots = add('i', '', '', line);
    const result = add('em', '', '', line);
    return { line, dots, result, memory: part === 'RAM' };
  });
  const load = add('p', 'boot-load', 'Loading wall');
  const fill = add('span', '', '', add('span', 'boot-bar', '', load));
  document.body.append(screen);
  return { screen, head, lines, load, fill };
}

/**
 * The boot-up. The machine starts, the screen gives way to the word on the centre piece, the
 * view pulls back to show the wall, and the sheets are dealt onto it from the middle.
 * Everything slows as it arrives and stops clean: no sheet speeds into the wall, nothing shakes.
 * Plays each time the wall is loaded on a wide screen. Any key or click skips the start-up check.
 */
export function playEntry(wall: HTMLElement): void {
  const root = document.documentElement;
  const pending = root.classList.contains(PENDING);
  const done = () => {
    root.classList.remove(PENDING);
    delete wall.dataset.entering;
    wall.dataset.entered = '';
  };
  // Already playing. React runs effects twice in development, and two openings at once would
  // fight over the same sheets.
  if ('entering' in wall.dataset) return;
  // The head script decides whether to play. A page that opened on a project has not armed it.
  // Loaded part way down the page, as after a reload: the wall is not on screen, and the view
  // on it is tilted by the scroll. The opening would play unseen, and end at a slant. So it does not play.
  const below = window.scrollY > wall.offsetHeight * 0.35;
  if (!pending || below || prefersReducedMotion()) return done();
  wall.dataset.entering = '';

  const grid = wall.querySelector<HTMLElement>(':scope > div')!;
  const centre = wall.querySelector<HTMLElement>('[data-centre]')!;
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const light = wall.querySelector('[data-light]');
  const { screen, head, lines, load, fill } = bootScreen();

  // Where the view starts: so close that the word fills the screen.
  const box = centre.getBoundingClientRect();
  const gridBox = grid.getBoundingClientRect();
  const zoom = Math.min((window.innerWidth * 0.92) / box.width, 3.2);
  const origin = `${box.left + box.width / 2 - gridBox.left}px ${box.top + box.height * 0.36 - gridBox.top}px`;
  const middle = { x: gridBox.left + gridBox.width / 2, y: gridBox.top + gridBox.height / 2 };

  // One part is checked every STEP seconds. When the bar is full the machine has started (BOOTED).
  const STEP = 0.1;
  const LOAD = 0.2 + PARTS.length * STEP + 0.15;
  const BOOTED = LOAD + 0.5;
  // Where the deal starts: while the pull-back is still settling, so the two read as one move.
  const DEAL = BOOTED + 0.68;

  // A key or a click skips the start-up check, not the wall: the view still pulls back and the
  // sheets are still dealt.
  const skip = () => {
    if (timeline.time() < BOOTED) timeline.time(BOOTED);
    stopListening();
  };
  const stopListening = () => {
    window.removeEventListener('keydown', skip);
    window.removeEventListener('pointerdown', skip);
  };

  const timeline = gsap.timeline({
    onComplete: () => {
      clearTimeout(guard);
      stopListening();
      screen.remove();
      gsap.set([grid, wall, ...sheets, ...centre.children], { clearProps: 'transform,opacity,x,y,willChange' });
      if (light) gsap.set(light, { clearProps: 'opacity' });
      done();
    },
  });
  // If frames never fire (a hidden tab, a stalled page), jump to the end state.
  const guard = setTimeout(() => timeline.progress(1), 6500);
  window.addEventListener('keydown', skip);
  window.addEventListener('pointerdown', skip);

  timeline
    // 1. The machine starts. The sheets get their own layers now, and are painted while the black
    // screen still covers them: all but invisible, not hidden, since a hidden sheet is not painted.
    // So the first frames of the deal have nothing left to prepare, and do not stall.
    .set([head, load, ...lines.map(({ line }) => line)], { opacity: 0 })
    .set(lines.map(({ result }) => result), { opacity: 0 })
    .set(lines.map(({ dots }) => dots), { clipPath: 'inset(0 100% 0 0)' })
    .set(fill, { scaleX: 0 })
    .set(sheets, { opacity: 0.001, willChange: 'transform, opacity' })
    .set(centre.children, { opacity: 0 })
    .set(grid, { scale: zoom, transformOrigin: origin })
    .call(() => root.classList.remove(PENDING))
    .to(head, { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0.05);

  // The check: each part slides in, its dots run out to the right, and its result lights up.
  // The memory is counted first, as a real start-up does.
  lines.forEach(({ line, dots, result, memory }, i) => {
    const at = 0.2 + i * STEP;
    timeline
      .fromTo(line, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' }, at)
      .to(dots, { clipPath: 'inset(0 0% 0 0)', duration: 0.18, ease: 'power1.inOut' }, at + 0.05)
      .set(result, { opacity: 1 }, at + (memory ? 0.05 : 0.22));
    if (memory) {
      const count = { mb: 0 };
      timeline
        .to(count, { mb: MEMORY, duration: 0.3, ease: 'power1.in', onUpdate: () => void (result.textContent = `${Math.round(count.mb)} MB`) }, at + 0.05)
        .call(() => void (result.textContent = 'OK'), [], at + 0.4);
    } else {
      timeline.call(() => void (result.textContent = 'OK'), [], at + 0.22);
    }
  });

  timeline
    // The wall loads: a bar fills, slow to start and slow to end.
    .to(load, { opacity: 1, duration: 0.15, ease: 'power1.out' }, LOAD)
    .to(fill, { scaleX: 1, duration: 0.45, ease: 'power2.inOut' }, LOAD + 0.05)
    // 2. The screen gives way to the word.
    .set(centre.children[0], { opacity: 1 }, BOOTED)
    .to(screen, { opacity: 0, duration: 0.25, ease: 'power1.in' }, BOOTED)
    // 3. The view pulls back: soft at the start and at the end.
    .to(grid, { scale: 1, duration: 1.15, ease: 'power3.inOut' }, BOOTED + 0.13)
    .to([...centre.children].slice(1), { opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1 }, BOOTED + 0.78);

  if (light) {
    timeline.fromTo(
      light,
      { opacity: 0 },
      { keyframes: [{ opacity: 0.9, duration: 0.07 }, { opacity: 0.1, duration: 0.09 }, { opacity: 1, duration: 0.06 }, { opacity: 0.3, duration: 0.12 }, { opacity: 1, duration: 0.6 }] },
      BOOTED + 0.13,
    );
  }

  // 4. The deal: the sheets go out from the middle, the nearest first, each with a small turn
  // it loses on the way, and each slows to a stop on its own place, like a card on a table.
  // Each lands on the tilt it hangs at. Landing straight would leave the tilt to come back in
  // one frame when the animation lets go, and every sheet would jump a little at the very end.
  const placed = sheets.map((sheet) => {
    const tilt = parseFloat(getComputedStyle(sheet).rotate) || 0;
    const rect = sheet.getBoundingClientRect();
    // Positions were measured while zoomed in, so the offsets are scaled back.
    const dx = (middle.x - (rect.left + rect.width / 2)) / zoom;
    const dy = (middle.y - (rect.top + rect.height / 2)) / zoom;
    return { sheet, tilt, dx, dy, far: Math.hypot(dx, dy) };
  });
  placed
    .sort((a, b) => a.far - b.far)
    .forEach(({ sheet, tilt, dx, dy }, i) => {
      const at = DEAL + i * 0.05;
      timeline
        .fromTo(
          sheet,
          { x: dx, y: dy, scale: 1.18, rotation: tilt + gsap.utils.random(-12, 12) },
          {
            x: 0,
            y: 0,
            scale: 1,
            rotation: tilt,
            duration: 1,
            ease: 'power3.out',
            // Landed: the sheet goes back to its own CSS now, while others are still moving and
            // the eye is on them, so nothing changes everywhere at once at the very end.
            onComplete: () => void gsap.set(sheet, { clearProps: 'transform,opacity,willChange' }),
          },
          at,
        )
        .to(sheet, { opacity: 1, duration: 0.25, ease: 'power1.out' }, at);
    });
}
