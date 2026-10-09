import gsap from 'gsap';

import { finePointer, prefersReducedMotion } from './motion';

/**
 * Smooth wheel scrolling, driven by the GSAP ticker so scroll and motion share one clock.
 * It does nothing with reduced motion or on touch devices, and pauses while a project page is open.
 */
export function initScroll(): () => void {
  if (prefersReducedMotion() || !finePointer()) return () => {};

  let stopped = false;
  let cleanup = () => {};

  void import('lenis').then(({ default: Lenis }) => {
    if (stopped) return;
    const lenis = new Lenis({ lerp: 0.12 });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // After a slow frame, carry on from the real time. The default tries to catch up, which shows as a jump.
    gsap.ticker.lagSmoothing(0);

    // Links inside the page are scrolled here and nowhere else. Left to the browser, the
    // address would change, the router would jump to the target, and the two would fight.
    // The wheel can take over at any moment.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const target = link && document.getElementById(link.getAttribute('href')!.slice(1));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.1, lock: false });
    };
    document.addEventListener('click', onClick);

    const root = document.documentElement;
    const sync = () => ('projectOpen' in root.dataset ? lenis.stop() : lenis.start());
    const watch = new MutationObserver(sync);
    watch.observe(root, { attributes: true, attributeFilter: ['data-project-open'] });
    sync();

    cleanup = () => {
      watch.disconnect();
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  });

  return () => {
    stopped = true;
    cleanup();
  };
}

/**
 * Marks [data-reveal] elements with data-seen as they scroll into view. Anything already on
 * screen is marked at once, so nothing visible is ever hidden first.
 */
export function initReveals(): () => void {
  const items = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  const see = (el: Element) => el.setAttribute('data-seen', '');

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach(see);
    return () => {};
  }

  const watch = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        see(entry.target);
        watch.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  for (const item of items) {
    if (item.getBoundingClientRect().top < window.innerHeight) see(item);
    else watch.observe(item);
  }
  return () => watch.disconnect();
}
