import { useEffect, useRef, type RefObject } from 'react';

import { prefersReducedMotion } from '~/lib/motion';

import { CAT_HEIGHT, CAT_SCALE, CAT_WIDTH, drawCat, type CatFrame } from './cat-sprite';
import styles from './Wall.module.css';

type Ledge = { sheet: HTMLElement; from: number; to: number; y: number; z: number };

const WIDTH = CAT_WIDTH * CAT_SCALE;
const HEIGHT = CAT_HEIGHT * CAT_SCALE;
const SPEED = 34; // pixels per second
const HOP = 0.5; // seconds

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
    .map((s) => ({ sheet: s.sheet, from: s.x, to: s.x + s.width - WIDTH, y: s.y - HEIGHT + CAT_SCALE, z: s.z }));
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

    const place = () => {
      el.style.transform = `translate3d(${cat.x.toFixed(1)}px, ${cat.y.toFixed(1)}px, ${path[cat.ledge]?.z ?? 0}px) scaleX(${cat.dir})`;
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
    const stopMeasuring = () => {
      resize.disconnect();
      entered.disconnect();
    };
    if (prefersReducedMotion()) return stopMeasuring;

    const nudge = (sheet: HTMLElement) => {
      sheet.style.setProperty('--nudge', `${cat.dir * 3}deg`);
      setTimeout(() => sheet.style.removeProperty('--nudge'), 700);
    };

    // She comes to the sheet you point at: the ledge above it, and the spot nearest the pointer.
    let call: { ledge: number; x: number } | null = null;
    const onOver = (event: PointerEvent) => {
      const sheet = (event.target as Element).closest<HTMLElement>('[data-poster], [data-piece]');
      if (event.pointerType !== 'mouse' || !sheet || !path.length) return;
      const mid = offsetIn(wall, sheet).x + sheet.offsetWidth / 2;
      const centre = (l: Ledge) => (l.from + l.to + WIDTH) / 2;
      const ledge = path.reduce((best, l, i) => (Math.abs(centre(l) - mid) < Math.abs(centre(path[best]) - mid) ? i : best), 0);
      call = { ledge, x: Math.min(Math.max(mid - WIDTH / 2, path[ledge].from), path[ledge].to) };
      cat.rest = 0;
    };
    const onOut = () => {
      call = null;
    };
    wall.addEventListener('pointerover', onOver);
    wall.addEventListener('pointerleave', onOut);

    const step = (dt: number) => {
      const ledge = path[cat.ledge];
      if (!ledge) return;
      cat.tick += dt;
      const speed = call ? SPEED * 2.6 : SPEED;
      if (call && !hop) {
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
          cat.rest = 2.2;
          if (Math.random() < 0.5) nudge(ledge.sheet);
        } else {
          hop = { t: 0, fromX: cat.x, fromY: cat.y, toX: cat.dir > 0 ? next.from : next.to, toY: next.y, ledge: cat.ledge + cat.dir };
        }
      } else if (!call && Math.random() < dt * 0.06) {
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
