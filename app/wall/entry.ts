import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

const KEY = 'wall-entry';
export const PENDING = 'entry-pending';

/**
 * Runs in the document head, before the first paint. It hides the posters only when the
 * entry sequence is about to play, and shows them again by itself if the app never starts.
 * Phones and tablets skip the sequence, so their first paint never waits for scripts.
 */
export const pendingScript = `try{if(!sessionStorage.getItem('${KEY}')&&location.pathname==='/'&&matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.classList.add('${PENDING}');setTimeout(function(){d.classList.remove('${PENDING}')},4000)}}catch(e){}`;

function seenBefore(): boolean {
  try {
    const seen = sessionStorage.getItem(KEY) === '1';
    sessionStorage.setItem(KEY, '1');
    return seen;
  } catch {
    return false;
  }
}

/** The room is dark, the light comes on, the posters land. Once per browser session. */
export function playEntry(wall: HTMLElement): void {
  const root = document.documentElement;
  const pending = root.classList.contains(PENDING);
  const done = () => {
    root.classList.remove(PENDING);
    wall.dataset.entered = '';
  };
  // The head script decides whether to play; a session that has seen it, or a page that opened elsewhere, has not.
  if (seenBefore() || !pending || prefersReducedMotion()) return done();

  const posters = gsap.utils.toArray<HTMLElement>('[data-poster], [data-empty]', wall);
  const centre = wall.querySelectorAll('[data-centre] > *');
  const light = wall.querySelector('[data-light]');

  const timeline = gsap.timeline({
    onComplete: () => {
      clearTimeout(guard);
      gsap.set([...posters, ...centre], { clearProps: 'transform,opacity' });
      if (light) gsap.set(light, { clearProps: 'opacity' });
      done();
    },
  });
  // If frames never fire (a hidden tab, a stalled page), jump to the end state.
  const guard = setTimeout(() => timeline.progress(1), 3000);

  timeline
    .set(posters, { opacity: 0, y: () => gsap.utils.random(-140, -60), rotation: () => gsap.utils.random(-14, 14), scale: 1.18 })
    .set(centre, { opacity: 0, y: 24 })
    .call(() => root.classList.remove(PENDING))
    .to(centre, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 0.15)
    .to(gsap.utils.shuffle(posters.slice()), { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.85, ease: 'back.out(1.3)', stagger: 0.05 }, 0.25);

  if (light) {
    timeline.fromTo(
      light,
      { opacity: 0 },
      { keyframes: [{ opacity: 0.9, duration: 0.06 }, { opacity: 0.15, duration: 0.07 }, { opacity: 1, duration: 0.05 }, { opacity: 0.4, duration: 0.09 }, { opacity: 1, duration: 0.4 }] },
      0,
    );
  }
}
