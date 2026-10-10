import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

let active: gsap.core.Timeline | null = null;
let ghost: HTMLElement | null = null;
let intent: string | null = null;

/** A poster was activated, so the next page for this slug opens from it. */
export function markIntent(slug: string): void {
  intent = slug;
}

export function takeIntent(slug: string): boolean {
  const hit = intent === slug;
  intent = null;
  return hit;
}

const wall = () => document.querySelector<HTMLElement>('main');

const insetFor = (rect: DOMRect) =>
  `inset(${rect.top}px ${window.innerWidth - rect.right}px ${window.innerHeight - rect.bottom}px ${rect.left}px)`;

const FULL = 'inset(0px 0px 0px 0px)';
const RECEDE = { scale: 0.92, opacity: 0.25 };
// How long the sheet takes to peel off the wall, from its corner, before the page opens.
// Must match the length of the `peel` animation in Poster.module.css.
const PEELED = 0.6;
// The peel waits this long, while the new page is built and painted. Matches its delay in the CSS.
const WAIT = 0.07;

/** Puts a peeled sheet back on the wall, whole. */
function resetPoster(poster: HTMLElement): void {
  poster.removeAttribute('data-opening');
}

// The wall scales around the middle of the screen, wherever the page is scrolled.
const origin = () => `50% ${window.scrollY + window.innerHeight / 2}px`;

function finish(): void {
  active = null;
  ghost?.remove();
  ghost = null;
  delete document.documentElement.dataset.transitioning;
}

/** Jumps any running transition to its end state. */
export function cancelTransition(): void {
  active?.progress(1);
  finish();
}

function start(onDone: () => void): gsap.core.Timeline {
  document.documentElement.dataset.transitioning = '';
  active = gsap.timeline({
    onComplete: () => {
      onDone();
      finish();
    },
  });
  return active;
}

export function openFrom(poster: HTMLElement | null, page: HTMLElement): Promise<void> {
  cancelTransition();
  const main = wall();
  if (!poster || !main || prefersReducedMotion()) return Promise.resolve();

  // The peel is a CSS animation on the sheet, started by this mark. The browser runs it off the
  // main thread, so it stays smooth while the new page is still being built and painted. The
  // mark also holds the sheet straight, so its outline can be measured for the page.
  poster.setAttribute('data-opening', '');

  return new Promise((resolve) => {
    const items = page.querySelectorAll('[data-in]');
    start(() => {
      gsap.set(page, { clearProps: 'clipPath,opacity' });
      gsap.set(main, { clearProps: 'scale,opacity,transform,transformOrigin' });
      gsap.set(items, { clearProps: 'opacity,transform' });
      resetPoster(poster);
      resolve();
    })
      .set(page, { clipPath: insetFor(poster.getBoundingClientRect()), opacity: 0 })
      .set(items, { opacity: 0, y: 48 })
      // One move in two parts. First the printed sheet peels off from its corner, all the way,
      // and what is under it is the page, in the same colour. Nothing is left half done.
      // The page is put exactly where the sheet was, so the eye sees no change.
      .to(page, { opacity: 1, duration: 0.04, ease: 'none' }, WAIT + PEELED - 0.04)
      // Then that same patch of colour grows to fill the screen, and the wall steps back.
      .to(page, { clipPath: FULL, duration: 0.75, ease: 'expo.inOut' }, WAIT + PEELED)
      .to(main, { ...RECEDE, transformOrigin: origin(), duration: 0.75, ease: 'expo.inOut' }, WAIT + PEELED)
      .call(() => resetPoster(poster), [], WAIT + PEELED + 0.5)
      .to(items, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, WAIT + PEELED + 0.45);
  });
}

/** Runs while the page is unmounting: a copy of its background shrinks back to the poster. */
export function closeTo(poster: HTMLElement | null, page: HTMLElement): Promise<void> {
  cancelTransition();
  const main = wall();
  if (!poster || !main || prefersReducedMotion()) return Promise.resolve();

  return new Promise((resolve) => {
    const sheet = document.createElement('div');
    sheet.dataset.ghost = '';
    sheet.setAttribute('aria-hidden', 'true');
    Object.assign(sheet.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '20',
      pointerEvents: 'none',
      background: getComputedStyle(page).backgroundColor,
    });
    // Measured now, not when the page opened, so a resize in between is taken into account.
    const target = insetFor(poster.getBoundingClientRect());
    sheet.dataset.target = target;
    document.body.append(sheet);
    ghost = sheet;

    start(() => {
      gsap.set(main, { clearProps: 'scale,opacity,transform,transformOrigin' });
      resolve();
    })
      .set(sheet, { clipPath: FULL })
      .set(main, { ...RECEDE, transformOrigin: origin() })
      .to(sheet, { clipPath: target, duration: 0.7, ease: 'expo.inOut' }, 0)
      .to(main, { scale: 1, opacity: 1, duration: 0.7, ease: 'expo.inOut' }, 0)
      .to(sheet, { opacity: 0, duration: 0.16, ease: 'none' }, 0.66);
  });
}

let turned = false;

/** True once, on the page that a turn has just brought in. */
export function takeTurned(): boolean {
  const hit = turned;
  turned = false;
  return hit;
}

/**
 * Turns to another project: a sheet in the colour of that project covers this page, and the
 * caller then changes the page under it. It grows from `from` when that is on screen (the block
 * for the next project), and comes in from the side when it is not (the arrow keys). The sheet
 * stays until the new page is in the DOM and cancels the transition.
 */
export function turnTo(colour: string, side: 'left' | 'right', from?: HTMLElement | null): Promise<void> {
  cancelTransition();
  if (prefersReducedMotion()) return Promise.resolve();

  return new Promise((resolve) => {
    const sheet = document.createElement('div');
    sheet.dataset.ghost = '';
    sheet.setAttribute('aria-hidden', 'true');
    Object.assign(sheet.style, { position: 'fixed', inset: '0', zIndex: '21', pointerEvents: 'none', background: colour });
    document.body.append(sheet);
    ghost = sheet;

    const rect = from?.getBoundingClientRect();
    const seen = rect && rect.bottom > 0 && rect.top < window.innerHeight;
    const edge = side === 'right' ? 'inset(0px 0px 0px 100%)' : 'inset(0px 100% 0px 0px)';
    document.documentElement.dataset.transitioning = '';
    turned = true;
    active = gsap
      .timeline({ onComplete: resolve })
      .fromTo(sheet, { clipPath: seen ? insetFor(rect) : edge }, { clipPath: FULL, duration: 0.5, ease: 'expo.inOut' });
  });
}

/** The parts of a page that a turn brought in rise into place. */
export function riseIn(page: HTMLElement): void {
  if (prefersReducedMotion()) return;
  gsap.from(page.querySelectorAll('[data-in]'), {
    opacity: 0,
    y: 32,
    duration: 0.55,
    ease: 'expo.out',
    stagger: 0.04,
    clearProps: 'opacity,transform',
  });
}

let closed = false;

/** True once, right after `closeLive` has played, so the unmount does not play a second close. */
export function takeClosed(): boolean {
  const hit = closed;
  closed = false;
  return hit;
}

/**
 * Plays the close on the page itself, before it leaves: the content steps back, the page
 * folds down onto its poster, and the wall comes forward again. Used for Escape and the
 * close link. The browser's own Back button cannot wait, so it uses `closeTo`.
 */
export function closeLive(poster: HTMLElement | null, page: HTMLElement): Promise<void> {
  cancelTransition();
  const main = wall();
  if (!poster || !main || prefersReducedMotion()) return Promise.resolve();

  return new Promise((resolve) => {
    const items = [...page.querySelectorAll('[data-in]')].reverse();
    start(() => {
      gsap.set(main, { clearProps: 'scale,opacity,transform,transformOrigin' });
      closed = true;
      resolve();
    })
      .set(main, { ...RECEDE, transformOrigin: origin() })
      .to(items, { opacity: 0, y: 32, duration: 0.28, ease: 'power2.in', stagger: 0.025 }, 0)
      .to(page, { clipPath: insetFor(poster.getBoundingClientRect()), duration: 0.8, ease: 'expo.inOut' }, 0.12)
      .to(main, { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.inOut' }, 0.12)
      .to(page, { opacity: 0, duration: 0.18, ease: 'none' }, 0.8);
  });
}
