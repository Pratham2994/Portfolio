import gsap from 'gsap';

import { prefersReducedMotion } from '~/lib/motion';

export const PENDING = 'entry-pending';

/**
 * Runs in the document head, before the first paint. It hides the posters only when the
 * entry sequence is about to play, and shows them again by itself if the app never starts.
 * Phones and tablets skip the sequence, so their first paint never waits for scripts.
 */
export const pendingScript = `try{if(location.pathname==='/'&&matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.classList.add('${PENDING}');setTimeout(function(){d.classList.remove('${PENDING}')},4000)}}catch(e){}`;

/** The room is dark, the light comes on, the posters land. Plays each time the wall is loaded. */
export function playEntry(wall: HTMLElement): void {
  const root = document.documentElement;
  const pending = root.classList.contains(PENDING);
  const done = () => {
    root.classList.remove(PENDING);
    wall.dataset.entered = '';
  };
  // The head script decides whether to play. A page that opened on a project has not armed it.
  if (!pending || prefersReducedMotion()) return done();

  const posters = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
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
  const guard = setTimeout(() => timeline.progress(1), 3600);

  timeline
    .set(posters, {
      opacity: 0,
      y: () => gsap.utils.random(-260, -120),
      x: () => gsap.utils.random(-40, 40),
      rotation: () => gsap.utils.random(-22, 22),
      scale: 1.3,
    })
    .set(centre, { opacity: 0, y: 40 })
    .call(() => root.classList.remove(PENDING))
    .to(centre, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 }, 0.35)
    .to(
      gsap.utils.shuffle(posters.slice()),
      { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 1, ease: 'back.out(1.5)', stagger: 0.085 },
      0.55,
    );

  if (light) {
    timeline.fromTo(
      light,
      { opacity: 0 },
      { keyframes: [{ opacity: 0.9, duration: 0.07 }, { opacity: 0.1, duration: 0.09 }, { opacity: 1, duration: 0.06 }, { opacity: 0.3, duration: 0.12 }, { opacity: 1, duration: 0.6 }] },
      0,
    );
  }
}
