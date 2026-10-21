import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

export const PENDING = 'entry-pending';

/**
 * Runs in the document head, before the first paint. It hides the wall only when the boot
 * sequence is about to play, and shows it again by itself if the app never starts.
 * Phones and tablets skip the sequence, so their first paint never waits for scripts.
 */
export const pendingScript = `try{if(location.pathname==='/'&&matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.classList.add('${PENDING}');setTimeout(function(){d.classList.remove('${PENDING}')},5000)}}catch(e){}`;

// What the machine says while it starts. The last line stays until the wall appears.
const BOOT = [
  'PRATS BIOS 2.2',
  'CPU   Core Ultra 7 265K ............ OK',
  'GPU   RTX 5070 12GB ................ OK',
  'RAM   32GB DDR5 .................... OK',
  'CAT   1 found ...................... OK',
  'Loading wall',
];

function bootScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'boot';
  screen.setAttribute('aria-hidden', 'true');
  screen.dataset.boot = '';
  for (const text of BOOT) {
    const line = document.createElement('p');
    line.textContent = text;
    screen.append(line);
  }
  document.body.append(screen);
  return screen;
}

/**
 * The boot-up. The machine starts, the screen gives way to the word on the centre piece, the
 * view pulls back to show the wall, and the sheets are dealt onto it from the middle.
 * Everything slows as it arrives and stops clean: no sheet speeds into the wall, nothing shakes.
 * Plays each time the wall is loaded on a wide screen. Any key or click skips it.
 */
export function playEntry(wall: HTMLElement): void {
  const root = document.documentElement;
  const pending = root.classList.contains(PENDING);
  const done = () => {
    root.classList.remove(PENDING);
    wall.dataset.entered = '';
  };
  // The head script decides whether to play. A page that opened on a project has not armed it.
  // Loaded part way down the page, as after a reload: the wall is not on screen, and the view
  // on it is tilted by the scroll. The opening would play unseen, and end at a slant. So it does not play.
  const below = window.scrollY > wall.offsetHeight * 0.35;
  if (!pending || below || prefersReducedMotion()) return done();

  const grid = wall.querySelector<HTMLElement>(':scope > div')!;
  const centre = wall.querySelector<HTMLElement>('[data-centre]')!;
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const light = wall.querySelector('[data-light]');
  const screen = bootScreen();
  const lines = screen.querySelectorAll('p');

  // Where the view starts: so close that the word fills the screen.
  const box = centre.getBoundingClientRect();
  const gridBox = grid.getBoundingClientRect();
  const zoom = Math.min((window.innerWidth * 0.92) / box.width, 3.2);
  const origin = `${box.left + box.width / 2 - gridBox.left}px ${box.top + box.height * 0.36 - gridBox.top}px`;
  const middle = { x: gridBox.left + gridBox.width / 2, y: gridBox.top + gridBox.height / 2 };

  const skip = () => timeline.progress(1);
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
  const guard = setTimeout(skip, 5000);
  window.addEventListener('keydown', skip);
  window.addEventListener('pointerdown', skip);

  // Where the deal starts: while the pull-back is still settling, so the two read as one move.
  const DEAL = 1.4;

  timeline
    // 1. The machine starts. The sheets get their own layers now, and are painted while the black
    // screen still covers them: all but invisible, not hidden, since a hidden sheet is not painted.
    // So the first frames of the deal have nothing left to prepare, and do not stall.
    .set(lines, { opacity: 0 })
    .set(sheets, { opacity: 0.001, willChange: 'transform, opacity' })
    .set(centre.children, { opacity: 0 })
    .set(grid, { scale: zoom, transformOrigin: origin })
    .call(() => root.classList.remove(PENDING))
    .to(lines, { opacity: 1, duration: 0.12, ease: 'power1.out', stagger: 0.09 }, 0.05)
    // 2. The screen gives way to the word.
    .set(centre.children[0], { opacity: 1 }, 0.72)
    .to(screen, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0.72)
    // 3. The view pulls back: soft at the start and at the end.
    .to(grid, { scale: 1, duration: 1, ease: 'power3.inOut' }, 0.85)
    .to([...centre.children].slice(1), { opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1 }, 1.5);

  if (light) {
    timeline.fromTo(
      light,
      { opacity: 0 },
      { keyframes: [{ opacity: 0.9, duration: 0.07 }, { opacity: 0.1, duration: 0.09 }, { opacity: 1, duration: 0.06 }, { opacity: 0.3, duration: 0.12 }, { opacity: 1, duration: 0.6 }] },
      0.85,
    );
  }

  // 4. The deal: the sheets go out from the middle, the nearest first, each with a small turn
  // it loses on the way, and each slows to a stop on its own place, like a card on a table.
  const placed = sheets.map((sheet) => {
    const rect = sheet.getBoundingClientRect();
    // Positions were measured while zoomed in, so the offsets are scaled back.
    const dx = (middle.x - (rect.left + rect.width / 2)) / zoom;
    const dy = (middle.y - (rect.top + rect.height / 2)) / zoom;
    return { sheet, dx, dy, far: Math.hypot(dx, dy) };
  });
  placed
    .sort((a, b) => a.far - b.far)
    .forEach(({ sheet, dx, dy }, i) => {
      const at = DEAL + i * 0.045;
      timeline
        .fromTo(
          sheet,
          { x: dx, y: dy, scale: 1.18, rotation: gsap.utils.random(-12, 12) },
          { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.85, ease: 'expo.out' },
          at,
        )
        .to(sheet, { opacity: 1, duration: 0.18, ease: 'power1.out' }, at);
    });
}
