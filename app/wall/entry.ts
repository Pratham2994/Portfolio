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
 * The boot-up. The machine starts, the screen cuts to the word on the centre piece, the
 * view pulls back to show the wall, and the sheets are dealt onto it one by one.
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
  if (!pending || prefersReducedMotion()) return done();

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
      gsap.set([grid, wall, ...sheets, ...centre.children], { clearProps: 'transform,opacity,x,y' });
      if (light) gsap.set(light, { clearProps: 'opacity' });
      done();
    },
  });
  // If frames never fire (a hidden tab, a stalled page), jump to the end state.
  const guard = setTimeout(skip, 5000);
  window.addEventListener('keydown', skip);
  window.addEventListener('pointerdown', skip);

  timeline
    // 1. The machine starts.
    .set(lines, { opacity: 0 })
    .set(sheets, { opacity: 0 })
    .set(centre.children, { opacity: 0 })
    .set(grid, { scale: zoom, transformOrigin: origin })
    .call(() => root.classList.remove(PENDING))
    .to(lines, { opacity: 1, duration: 0.01, stagger: 0.11 }, 0.05)
    // 2. Hard cut to the word.
    .set(screen, { opacity: 0 }, 0.85)
    .set(centre.children[0], { opacity: 1 }, 0.85)
    // 3. The view pulls back.
    .to(grid, { scale: 1, duration: 1.05, ease: 'expo.inOut' }, 1)
    .to([...centre.children].slice(1), { opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1 }, 1.7);

  if (light) {
    timeline.fromTo(
      light,
      { opacity: 0 },
      { keyframes: [{ opacity: 0.9, duration: 0.07 }, { opacity: 0.1, duration: 0.09 }, { opacity: 1, duration: 0.06 }, { opacity: 0.3, duration: 0.12 }, { opacity: 1, duration: 0.6 }] },
      1,
    );
  }

  // 4. The deal: each sheet flies out from the middle, spinning, and slaps onto the wall.
  gsap.utils.shuffle(sheets.slice()).forEach((sheet, i) => {
    const at = 1.55 + i * 0.075;
    const rect = sheet.getBoundingClientRect();
    // Positions were measured while zoomed in, so the offsets are scaled back.
    const dx = (middle.x - (rect.left + rect.width / 2)) / zoom;
    const dy = (middle.y - (rect.top + rect.height / 2)) / zoom;
    timeline
      .fromTo(
        sheet,
        { opacity: 0, x: dx, y: dy, scale: 2.1, rotation: gsap.utils.random(-40, 40), rotationY: gsap.utils.random(-70, 70) },
        { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, rotationY: 0, duration: 0.55, ease: 'power3.in' },
        at,
      )
      // The hit: a short knock through the whole wall.
      .fromTo(
        wall,
        { x: gsap.utils.random(-5, 5), y: gsap.utils.random(-4, 4) },
        { x: 0, y: 0, duration: 0.16, ease: 'power2.out', immediateRender: false },
        at + 0.55,
      )
      .fromTo(sheet, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, at + 0.55);
  });
}
