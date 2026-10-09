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
    const root = document.documentElement;

    // Pressing the wheel button starts the browser's own autoscroll. While it runs, the
    // browser moves the page and the smooth scroller must keep its hands off: if both
    // drive, the page is pulled up and down between them. So the smooth scroller sleeps
    // until autoscroll ends, then picks up from wherever the page is.
    let auto = false;
    let pressed = 0;
    const settle = () => lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    const endAuto = () => {
      if (!auto) return;
      auto = false;
      delete root.dataset.autoscroll;
      settle();
    };
    const onDown = (event: MouseEvent) => {
      if (auto) return;
      if (event.button !== 1 || (event.target as Element).closest('a')) return;
      settle(); // drop any glide that is still running
      auto = true;
      pressed = event.timeStamp;
      root.dataset.autoscroll = '';
    };
    // The browser keeps mouse and key events to itself while autoscroll runs, and even
    // swallows the click that ends it. So the first event the page sees again means
    // autoscroll is over. Moves made while the wheel button is still held are part of it.
    const onBack = (event: Event) => {
      if (!auto || event.timeStamp - pressed < 150) return;
      if (event instanceof MouseEvent && event.type === 'mousemove' && event.buttons & 4) return;
      endAuto();
    };
    const BACK = ['mousemove', 'mousedown', 'wheel', 'keydown'] as const;
    window.addEventListener('mousedown', onDown, true);
    for (const type of BACK) window.addEventListener(type, onBack, { passive: true });
    window.addEventListener('blur', endAuto);

    const tick = (time: number) => {
      if (!auto) lenis.raf(time * 1000);
    };
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

    const sync = () => ('projectOpen' in root.dataset ? lenis.stop() : lenis.start());
    const watch = new MutationObserver(sync);
    watch.observe(root, { attributes: true, attributeFilter: ['data-project-open'] });
    sync();

    cleanup = () => {
      watch.disconnect();
      document.removeEventListener('click', onClick);
      window.removeEventListener('mousedown', onDown, true);
      for (const type of BACK) window.removeEventListener(type, onBack);
      window.removeEventListener('blur', endAuto);
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
