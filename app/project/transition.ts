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

  return new Promise((resolve) => {
    const items = page.querySelectorAll('[data-in]');
    start(() => {
      gsap.set(page, { clearProps: 'clipPath,opacity' });
      gsap.set(main, { clearProps: 'scale,opacity,transform,transformOrigin' });
      gsap.set(items, { clearProps: 'opacity,transform' });
      resolve();
    })
      .set(page, { clipPath: insetFor(poster.getBoundingClientRect()), opacity: 0 })
      .set(items, { opacity: 0, y: 48 })
      .to(page, { opacity: 1, duration: 0.14, ease: 'none' }, 0)
      .to(page, { clipPath: FULL, duration: 0.8, ease: 'expo.inOut' }, 0.08)
      .to(main, { ...RECEDE, transformOrigin: origin(), duration: 0.8, ease: 'expo.inOut' }, 0.08)
      .to(items, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, 0.55);
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
