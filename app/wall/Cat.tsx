import { useEffect, useRef, type RefObject } from 'react';

import { prefersReducedMotion } from '~/lib/motion';

import { CAT_HEIGHT, CAT_SCALE, CAT_WIDTH, drawCat, type CatFrame } from './cat-sprite';
import styles from './Wall.module.css';

type Ledge = { poster: HTMLElement; from: number; to: number; y: number };

const WIDTH = CAT_WIDTH * CAT_SCALE;
const HEIGHT = CAT_HEIGHT * CAT_SCALE;
const SPEED = 34; // pixels per second
const HOP = 0.5; // seconds

/** The top edges of the first row of posters, left to right, in the grid's own coordinates. */
function ledges(grid: HTMLElement): Ledge[] {
  const origin = grid.getBoundingClientRect();
  const posters = [...grid.querySelectorAll<HTMLElement>('[data-poster]')].map((poster) => ({
    poster,
    box: poster.getBoundingClientRect(),
  }));
  if (!posters.length) return [];
  const top = Math.min(...posters.map((p) => p.box.top));
  return posters
    .filter((p) => p.box.top - top < p.box.height / 2 && p.box.width > WIDTH * 1.5)
    .sort((a, b) => a.box.left - b.box.left)
    .map(({ poster, box }) => ({
      poster,
      from: box.left - origin.left,
      to: box.right - origin.left - WIDTH,
      y: box.top - origin.top - HEIGHT + CAT_SCALE,
    }));
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
      el.style.transform = `translate3d(${cat.x.toFixed(1)}px, ${cat.y.toFixed(1)}px, 44px) scaleX(${cat.dir})`;
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

    const nudge = (poster: HTMLElement) => {
      poster.style.setProperty('--nudge', `${cat.dir * 3}deg`);
      setTimeout(() => poster.style.removeProperty('--nudge'), 700);
    };

    const step = (dt: number) => {
      const ledge = path[cat.ledge];
      if (!ledge) return;
      cat.tick += dt;
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
      cat.x += cat.dir * SPEED * dt;
      if (cat.tick > 0.16) {
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
          if (Math.random() < 0.5) nudge(ledge.poster);
        } else {
          hop = { t: 0, fromX: cat.x, fromY: cat.y, toX: cat.dir > 0 ? next.from : next.to, toY: next.y, ledge: cat.ledge + cat.dir };
        }
      } else if (Math.random() < dt * 0.06) {
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
