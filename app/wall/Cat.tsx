import { useEffect, useRef, type RefObject } from 'react';

import { prefersReducedMotion } from '~/lib/motion';
import { track } from '~/lib/analytics';

import { CAT_HEIGHT, CAT_SCALE, CAT_WIDTH, drawCat, type CatFrame } from './cat-sprite';
import styles from './Wall.module.css';

type Ledge = { sheet: HTMLElement; from: number; to: number; y: number; z: number; mid: number; height: number };

const WIDTH = CAT_WIDTH * CAT_SCALE;
const HEIGHT = CAT_HEIGHT * CAT_SCALE;
const SPEED = 34; // pixels per second
const HOP = 0.5; // seconds
const SLEEP = 40_000; // she dozes off when nobody has moved for this long, in milliseconds

/** Where an element sits inside the grid, in layout pixels. Transforms do not change this. */
function offsetIn(grid: HTMLElement, el: HTMLElement) {
  let x = 0;
  let y = 0;
  for (let node: HTMLElement | null = el; node && node !== grid; node = node.offsetParent as HTMLElement | null) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
}

/**
 * The top edges of the first row of sheets, left to right. Each ledge keeps the distance its
 * sheet stands off the wall, so the cat is drawn at the same depth and stays on the edge
 * when the view tilts.
 */
function ledges(grid: HTMLElement): Ledge[] {
  const sheets = [...grid.querySelectorAll<HTMLElement>('[data-poster], [data-piece]')].map((sheet) => {
    const cell = sheet.parentElement!;
    const lifted = getComputedStyle(cell).transform !== 'none';
    return {
      sheet,
      ...offsetIn(grid, sheet),
      width: sheet.offsetWidth,
      height: sheet.offsetHeight,
      z: lifted ? parseFloat(getComputedStyle(cell).getPropertyValue('--z')) || 0 : 0,
    };
  });
  if (!sheets.length) return [];
  const top = Math.min(...sheets.map((s) => s.y));
  return sheets
    .filter((s) => s.y - top < s.height / 2 && s.width > WIDTH * 1.5)
    .sort((a, b) => a.x - b.x)
    .map((s) => ({
      sheet: s.sheet,
      from: s.x,
      to: s.x + s.width - WIDTH,
      y: s.y - HEIGHT + CAT_SCALE,
      z: s.z,
      mid: s.x + s.width / 2,
      height: s.height,
    }));
}

/**
 * A sheet hangs a little crooked, and grows under the pointer, so its top edge is not where
 * the layout says. This is how far the edge is from there, under a cat at x.
 */
function edgeShift(ledge: Ledge | undefined, x: number) {
  if (!ledge) return 0;
  const style = getComputedStyle(ledge.sheet);
  const angle = ((parseFloat(style.rotate) || 0) * Math.PI) / 180;
  const scale = parseFloat(style.scale) || 1;
  return (ledge.height / 2) * (1 - scale / Math.cos(angle)) + (x + WIDTH / 2 - ledge.mid) * Math.tan(angle);
}

export function Cat({ grid }: { grid: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const wall = grid.current;
    const ctx = el?.getContext('2d');
    if (!el || !wall || !ctx) return;

    let path = ledges(wall);
    const cat = { ledge: 0, x: path[0]?.from ?? 0, y: path[0]?.y ?? 0, dir: 1, rest: 0, frame: 0 as CatFrame, tick: 0 };
    let hop: { t: number; fromX: number; fromY: number; toX: number; toY: number; ledge: number } | null = null;
    // When the wall drops, she has nothing to stand on. See onFallen below.
    let fall: { phase: 'hang' | 'drop' | 'down' | 'up'; t: number; fromY: number; floor: number; speed: number } | null = null;
    let tumble = 0;

    const place = () => {
      // In a hop she leaves one edge and lands on the next. In a fall there is no edge.
      const shift = fall
        ? 0
        : hop
          ? edgeShift(path[cat.ledge], hop.fromX) * (1 - hop.t) + edgeShift(path[hop.ledge], hop.toX) * hop.t
          : edgeShift(path[cat.ledge], cat.x);
      el.style.transform = `translate3d(${cat.x.toFixed(1)}px, ${(cat.y + shift).toFixed(1)}px, ${path[cat.ledge]?.z ?? 0}px) scaleX(${cat.dir}) rotate(${tumble.toFixed(0)}deg)`;
    };
    const measure = () => {
      path = ledges(wall);
      hop = null;
      cat.ledge = Math.min(cat.ledge, Math.max(path.length - 1, 0));
      const ledge = path[cat.ledge];
      if (ledge) {
        cat.x = Math.min(Math.max(cat.x, ledge.from), ledge.to);
        cat.y = ledge.y;
      }
      place();
    };

    drawCat(ctx, 0, true);
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(wall);
    // Posters are off their marks during the entry sequence, so measure again when it ends.
    const entered = new MutationObserver(measure);
    const section = wall.closest('[data-wall]');
    if (section) entered.observe(section, { attributes: true, attributeFilter: ['data-entered'] });
    // The wall has dropped, or has been hung again.
    const onFallen = () => {
      if (!section) return;
      if ('fallen' in (section as HTMLElement).dataset) {
        const floor = section.getBoundingClientRect().bottom - wall.getBoundingClientRect().top - HEIGHT - 54;
        fall = { phase: 'hang', t: 0, fromY: cat.y, floor, speed: 0 };
        hop = null;
        cat.rest = 0;
      } else if (fall) {
        fall = { ...fall, phase: 'up', t: 0, fromY: cat.y };
      }
    };
    const fallen = new MutationObserver(onFallen);
    if (section) fallen.observe(section, { attributes: true, attributeFilter: ['data-fallen'] });
    const stopMeasuring = () => {
      resize.disconnect();
      entered.disconnect();
      fallen.disconnect();
    };
    if (prefersReducedMotion()) return stopMeasuring;

    const nudge = (sheet: HTMLElement) => {
      sheet.style.setProperty('--nudge', `${cat.dir * 3}deg`);
      setTimeout(() => sheet.style.removeProperty('--nudge'), 700);
    };

    // Small things float up from her: a heart when she is petted, a z when she sleeps.
    const puff = (text: string) => {
      const bit = document.createElement('span');
      bit.className = styles.puff;
      bit.textContent = text;
      bit.dataset.puff = text === '!' || text === 'z' ? text : 'heart';
      bit.style.left = `${cat.x + WIDTH / 2}px`;
      bit.style.top = `${cat.y}px`;
      bit.style.transform = `translateZ(${(path[cat.ledge]?.z ?? 0) + 1}px)`;
      wall.append(bit);
      bit.addEventListener('animationend', () => bit.remove(), { once: true });
    };

    // A click is a pet. Five in a row is too many, and she storms off.
    let pets: number[] = [];
    const onPet = () => {
      if (fall) return;
      const now = performance.now();
      pets = [...pets.filter((at) => now - at < 4000), now];
      if (pets.length >= 5) {
        pets = [];
        puff('!');
        zoomies = 2.5;
        cat.rest = 0;
        track('cat_annoyed');
        return;
      }
      puff('\u2665');
      if (pets.length === 1) track('cat_petted');
      if (!hop) {
        cat.rest = 1.4;
        drawCat(ctx, 0, true);
      }
    };
    el.addEventListener('pointerdown', onPet);

    // When nobody has moved for a while, she sleeps where she is.
    let active = performance.now();
    let doze = 0;
    const awake = () => {
      active = performance.now();
    };
    window.addEventListener('pointermove', awake, { passive: true });
    window.addEventListener('pointerdown', awake, { passive: true });

    // She comes to the sheet you point at: the ledge above it, and the spot nearest the pointer.
    let call: { ledge: number; x: number } | null = null;
    const come = (sheet: HTMLElement) => {
      const mid = offsetIn(wall, sheet).x + sheet.offsetWidth / 2;
      const centre = (l: Ledge) => (l.from + l.to + WIDTH) / 2;
      const ledge = path.reduce((best, l, i) => (Math.abs(centre(l) - mid) < Math.abs(centre(path[best]) - mid) ? i : best), 0);
      call = { ledge, x: Math.min(Math.max(mid - WIDTH / 2, path[ledge].from), path[ledge].to) };
      cat.rest = 0;
    };
    const onOver = (event: PointerEvent) => {
      const sheet = (event.target as Element).closest<HTMLElement>('[data-poster], [data-piece]');
      if (event.pointerType === 'mouse' && sheet && path.length) come(sheet);
    };
    const onOut = () => {
      call = null;
    };
    // A secret can send for her too, and let her go again.
    const onSummon = (event: Event) => {
      const sheet = (event as CustomEvent<HTMLElement | null>).detail;
      if (sheet && path.length) come(sheet);
      else call = null;
    };
    window.addEventListener('wall:cat', onSummon);
    // A small secret: type "meow" and she gets the zoomies for a few seconds.
    let typed = '';
    let zoomies = 0;
    const onKey = (event: KeyboardEvent) => {
      awake();
      typed = (typed + event.key.toLowerCase()).slice(-4);
      if (typed !== 'meow') return;
      track('meow');
      window.dispatchEvent(new Event('wall:meow'));
      zoomies = 5;
      cat.rest = 0;
      el.dataset.zoomies = '';
    };
    window.addEventListener('keydown', onKey);
    wall.addEventListener('pointerover', onOver);
    wall.addEventListener('pointerleave', onOut);

    const step = (dt: number) => {
      const ledge = path[cat.ledge];
      if (!ledge) return;
      cat.tick += dt;
      if (fall) {
        fall.t += dt;
        if (fall.phase === 'hang') {
          // The cartoon moment: her legs keep running on nothing.
          if (cat.tick > 0.05) {
            cat.tick = 0;
            cat.frame = cat.frame ? 0 : 1;
            drawCat(ctx, cat.frame);
          }
          if (fall.t > 0.6) fall = { ...fall, phase: 'drop', t: 0 };
        } else if (fall.phase === 'drop') {
          fall.speed += 2600 * dt;
          cat.y += fall.speed * dt;
          tumble += 540 * dt * cat.dir;
          if (cat.y >= fall.floor) {
            // She lands on the pile, on her feet, and sits.
            cat.y = fall.floor;
            tumble = 0;
            fall.phase = 'down';
            drawCat(ctx, 0, true);
          }
        } else if (fall.phase === 'down') {
          if (cat.tick > 0.4) {
            cat.tick = 0;
            cat.frame = cat.frame ? 0 : 1;
            drawCat(ctx, cat.frame, true);
          }
        } else {
          // One big jump back to where she was, with a flip on the way.
          const t = Math.min(fall.t / 0.75, 1);
          cat.y = fall.fromY + (ledge.y - fall.fromY) * t - Math.sin(t * Math.PI) * 110;
          tumble = -360 * t * cat.dir;
          if (t === 1) {
            cat.y = ledge.y;
            tumble = 0;
            fall = null;
          }
        }
        return;
      }
      if (zoomies > 0) {
        zoomies -= dt;
        if (zoomies <= 0) delete el.dataset.zoomies;
      }
      if (!hop && zoomies <= 0 && performance.now() - active > SLEEP) {
        doze -= dt;
        if (doze <= 0) {
          doze = 1.8;
          drawCat(ctx, 0, true);
          puff('z');
        }
        return;
      }
      const speed = zoomies > 0 ? SPEED * 9 : call ? SPEED * 2.6 : SPEED;
      if (call && !hop && zoomies <= 0) {
        if (call.ledge === cat.ledge && Math.abs(call.x - cat.x) < 3) {
          // Arrived: sit and wait for as long as the pointer stays.
          if (cat.rest <= 0) drawCat(ctx, 0, true);
          cat.rest = 0.4;
        } else {
          cat.rest = 0;
          cat.dir = call.ledge === cat.ledge ? Math.sign(call.x - cat.x) || 1 : Math.sign(call.ledge - cat.ledge);
        }
      }
      if (cat.rest > 0) {
        cat.rest -= dt;
        if (cat.tick > 0.5) {
          cat.tick = 0;
          cat.frame = cat.frame ? 0 : 1;
          drawCat(ctx, cat.frame, true);
        }
        return;
      }
      if (hop) {
        hop.t = Math.min(hop.t + dt / HOP, 1);
        cat.x = hop.fromX + (hop.toX - hop.fromX) * hop.t;
        cat.y = hop.fromY + (hop.toY - hop.fromY) * hop.t - Math.sin(hop.t * Math.PI) * 26;
        if (hop.t === 1) {
          cat.ledge = hop.ledge;
          cat.y = path[cat.ledge].y;
          hop = null;
        }
        return;
      }
      cat.x += cat.dir * speed * dt;
      if (call && call.ledge === cat.ledge && (call.x - cat.x) * cat.dir < 0) cat.x = call.x;
      if (cat.tick > (call ? 0.09 : 0.16)) {
        cat.tick = 0;
        cat.frame = cat.frame ? 0 : 1;
        drawCat(ctx, cat.frame);
      }
      const atEnd = cat.dir > 0 ? cat.x >= ledge.to : cat.x <= ledge.from;
      if (atEnd) {
        const next = path[cat.ledge + cat.dir];
        if (!next) {
          cat.dir *= -1;
          cat.rest = zoomies > 0 ? 0 : 2.2;
          if (Math.random() < 0.5) nudge(ledge.sheet);
        } else {
          hop = { t: 0, fromX: cat.x, fromY: cat.y, toX: cat.dir > 0 ? next.from : next.to, toY: next.y, ledge: cat.ledge + cat.dir };
        }
      } else if (!call && zoomies <= 0 && Math.random() < dt * 0.06) {
        cat.rest = 2.5;
      }
    };

    let frame = 0;
    let last = 0;
    let visible = true;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // The cat waits while a project page covers the wall.
      if (!('projectOpen' in document.documentElement.dataset)) {
        step(dt);
        place();
      }
      frame = visible ? requestAnimationFrame(loop) : 0;
    };
    const watch = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    });
    watch.observe(wall);

    return () => {
      stopMeasuring();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', awake);
      window.removeEventListener('wall:cat', onSummon);
      window.removeEventListener('pointerdown', awake);
      el.removeEventListener('pointerdown', onPet);
      wall.removeEventListener('pointerover', onOver);
      wall.removeEventListener('pointerleave', onOut);
      watch.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [grid]);

  return (
    <canvas
      ref={canvas}
      className={styles.cat}
      width={CAT_WIDTH}
      height={CAT_HEIGHT}
      style={{ width: WIDTH, height: HEIGHT }}
      data-cat
      aria-hidden="true"
    />
  );
}
