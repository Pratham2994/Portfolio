import gsap from 'gsap';

/** What every play on the wall is given: the stage, the sheets, and a few ways to act on them. */

export type Timeline = gsap.core.Timeline;
export type Point = { x: number; y: number };

export type Scene = {
  wall: HTMLElement;
  sheets: HTMLElement[];
  box: DOMRect;
  /** The ball. Moving `ball` moves it across the screen; `spin` is the part that turns and arcs. */
  ball: HTMLElement;
  spin: HTMLElement;
  /** Puts one more thing on the stage, centred on a point of the screen. */
  prop: (name: string, x: number, y: number, tag?: string) => HTMLElement;
  /** Leaves a fading trail behind a thing as it moves. */
  trail: (node: HTMLElement, colour: string) => void;
  /** A ring that opens where something lands. */
  impact: (timeline: Timeline, at: number, point: Point) => void;
  /** Runs on every frame of the play. */
  onFrame: (run: () => void) => void;
  /** Runs once when the play is over, however it ends. */
  onEnd: (run: () => void) => void;
  /** A small line of commentary while the play is on. */
  say: (text: string) => void;
  /** The big call at the end, with one line under it. */
  shout: (timeline: Timeline, at: number, word: string, line: string) => void;
};

export const centreOf = (el: Element): Point => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

// Each word has more than one way to go. It goes through all of them, in a new order each
// round, so the next try is never the one just seen.
const rounds: Record<string, { order: number[]; last: number }> = {};
export function pick<T>(key: string, options: T[]): T {
  const round = (rounds[key] ??= { order: [], last: -1 });
  if (!round.order.length) {
    round.order = gsap.utils.shuffle(options.map((_, i) => i));
    // A new round does not start with the one the last round ended on.
    if (options.length > 1 && round.order[0] === round.last) round.order.push(round.order.shift()!);
  }
  round.last = round.order.shift()!;
  return options[round.last];
}

// The knock a sheet and the wall take when something hits them.
export function hit(timeline: Timeline, wall: HTMLElement, sheet: Element | null, at: number) {
  if (sheet) timeline.fromTo(sheet, { scale: 0.9 }, { scale: 1, duration: 0.55, ease: 'back.out(4)', immediateRender: false }, at);
  timeline.fromTo(wall, { x: 7, y: -4 }, { x: 0, y: 0, duration: 0.35, ease: 'elastic.out(1.2, 0.3)', immediateRender: false }, at);
}
