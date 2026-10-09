import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

import { you } from '~/content';
import { track } from '~/lib/analytics';

import styles from './Threads.module.css';

type Thread = { slug: string; d: string; x: number; y: number; length: number };

/** Other parts of the page pull a thread by sending this event with the name of a language. */
export const PULL = 'wall:thread';

const usedBy = (name: string | null) => you.stack.languages.find((item) => item.name === name)?.used ?? [];

/** The posters on a thread stay lit. The rest of the wall steps back. No name puts the lights back. */
function light(board: HTMLElement, name: string | null): void {
  const used = usedBy(name);
  board.toggleAttribute('data-threading', used.length > 0);
  for (const poster of board.querySelectorAll<HTMLElement>('[data-poster]')) {
    poster.toggleAttribute('data-threaded', used.includes(poster.dataset.poster!));
  }
}

/** Where each thread starts and ends, measured on the wall as it is now. */
function draw(board: HTMLElement, name: string | null, pin: HTMLElement | null | undefined) {
  if (!pin) return { from: { x: 0, y: 0 }, threads: [] as Thread[] };
  const base = board.getBoundingClientRect();
  const start = pin.getBoundingClientRect();
  const x0 = start.left + start.width / 2 - base.left;
  const y0 = start.bottom - base.top + 4;
  const threads = usedBy(name).flatMap((slug): Thread[] => {
    const poster = board.querySelector<HTMLElement>(`[data-poster="${slug}"]`);
    if (!poster) return [];
    const box = poster.getBoundingClientRect();
    const x = box.left + box.width / 2 - base.left;
    const y = box.top - base.top + 7;
    const length = Math.hypot(x - x0, y - y0);
    // A thread is not pulled tight: it hangs a little, more when it is long.
    const sag = Math.min(70, length * 0.14);
    return [{ slug, x, y, length, d: `M${x0} ${y0} Q${(x0 + x) / 2} ${(y0 + y) / 2 + sag} ${x} ${y}` }];
  });
  return { from: { x: x0, y: y0 }, threads };
}

/**
 * The evidence board. Pick a language, and a red thread runs from its pin to every poster
 * built with it. It is the stack list, drawn on the wall the projects hang on.
 */
export function Threads({ wall }: { wall: RefObject<HTMLElement | null> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [from, setFrom] = useState({ x: 0, y: 0 });
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const board = wall.current;
    if (!board) return;
    const measure = () => {
      const pin = row.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      const drawn = draw(board, picked, pin);
      setFrom(drawn.from);
      setThreads(drawn.threads);
    };
    light(board, picked);
    const frame = requestAnimationFrame(measure);
    // The lit posters come forward a little. The pins are set again once they have stopped.
    const settled = window.setTimeout(measure, 520);
    const resized = new ResizeObserver(measure);
    resized.observe(board);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settled);
      resized.disconnect();
      light(board, null);
    };
  }, [picked, wall]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setPicked(null);
    const onPull = (event: Event) => {
      setPicked((event as CustomEvent<string>).detail);
      wall.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(PULL, onPull);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(PULL, onPull);
    };
  }, [wall]);

  const longest = Math.max(1, ...threads.map((thread) => thread.length));

  return (
    <>
      <div className={styles.row} ref={row} role="group" aria-label="Pull a thread: show the projects built with a language" data-threads>
        <span className={styles.label} aria-hidden="true">
          Pull a thread
        </span>
        {you.stack.languages.map((item) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={picked === item.name}
            onClick={() => {
              setPicked(picked === item.name ? null : item.name);
              track('thread_pulled', { language: item.name });
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      {/* Keyed by the language, so a new pick draws its threads from the start. */}
      <svg className={styles.threads} key={picked ?? 'none'} aria-hidden="true" data-thread-count={threads.length}>
        {threads.map((thread, i) => (
          <g key={thread.slug} style={{ '--i': i, '--t': thread.length / longest } as CSSProperties}>
            <path className={styles.shade} d={thread.d} pathLength={1} />
            <path className={styles.thread} d={thread.d} pathLength={1} />
            <circle className={styles.pin} cx={thread.x} cy={thread.y} r="5" />
          </g>
        ))}
        {threads.length > 0 && <circle className={styles.knot} cx={from.x} cy={from.y} r="4" />}
      </svg>
    </>
  );
}
