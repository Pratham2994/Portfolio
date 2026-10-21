/**
 * A small falling-sand world for the Sandglass page. It is not the engine of the project, only
 * the same idea at a small size: a grid of cells, a few rules each, a seeded random number, and
 * a record of every step so the world can be played back.
 */
export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const LAVA = 3;
export const STONE = 4;
export const STEAM = 5;
export const GLASS = 6;
export type Matter = number;

// The colour of each kind of cell, as [r, g, b]. Each cell is lit a little more or less (its shade).
const COLOUR: [number, number, number][] = [
  [11, 12, 15],
  [222, 190, 128],
  [52, 128, 214],
  [255, 106, 31],
  [104, 99, 94],
  [196, 204, 214],
  [168, 214, 222],
];
const BACK = COLOUR[EMPTY];

// How long the world keeps its past: one record for every two steps, 30 records a second.
const KEEP = 30 * 10;

type Snapshot = { cell: Uint8Array; shade: Uint8Array; seed: number };

export type World = {
  w: number;
  h: number;
  cell: Uint8Array;
  shade: Uint8Array;
  // The step a cell last moved in, so nothing moves twice in one step.
  moved: Uint8Array;
  stamp: number;
  seed: number;
  past: Snapshot[];
};

export function makeWorld(w: number, h: number, seed = 7): World {
  const n = w * h;
  return { w, h, cell: new Uint8Array(n), shade: new Uint8Array(n), moved: new Uint8Array(n), stamp: 0, seed, past: [] };
}

/** mulberry32: the same seed always gives the same numbers, so a world can be played again. */
function random(world: World): number {
  let t = (world.seed = (world.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function clear(world: World): void {
  world.cell.fill(EMPTY);
  world.past.length = 0;
}

/** A round dab of one kind of matter. Only empty cells are filled, so a brush never eats a pile. */
export function pour(world: World, cx: number, cy: number, r: number, what: Matter, thin = 0.55): void {
  const { w, h, cell, shade } = world;
  for (let y = Math.max(0, Math.round(cy - r)); y <= Math.min(h - 1, Math.round(cy + r)); y++) {
    for (let x = Math.max(0, Math.round(cx - r)); x <= Math.min(w - 1, Math.round(cx + r)); x++) {
      const i = y * w + x;
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r || random(world) > thin) continue;
      if (what === EMPTY || cell[i] === EMPTY) {
        cell[i] = what;
        shade[i] = Math.floor(random(world) * 40);
      }
    }
  }
}

function swap(world: World, a: number, b: number): void {
  const { cell, shade, moved, stamp } = world;
  const c = cell[a];
  cell[a] = cell[b];
  cell[b] = c;
  const s = shade[a];
  shade[a] = shade[b];
  shade[b] = s;
  moved[a] = stamp;
  moved[b] = stamp;
}

/** Can matter of this weight go into cell i? Into empty space, and through lighter things. */
function room(world: World, i: number, what: Matter): boolean {
  const there = world.cell[i];
  if (there === EMPTY) return true;
  if (what === SAND || what === LAVA) return there === WATER || there === STEAM;
  if (what === WATER) return there === STEAM;
  return false;
}

// Is there lava on any side of cell i? Then water boils and sand turns to glass.
function nextToLava(world: World, x: number, y: number): number {
  const { w, h, cell } = world;
  const i = y * w + x;
  if (x > 0 && cell[i - 1] === LAVA) return i - 1;
  if (x < w - 1 && cell[i + 1] === LAVA) return i + 1;
  if (y > 0 && cell[i - w] === LAVA) return i - w;
  if (y < h - 1 && cell[i + w] === LAVA) return i + w;
  return -1;
}

function fall(world: World, x: number, y: number, what: Matter, spread: number): void {
  const { w, h } = world;
  const i = y * w + x;
  if (y < h - 1 && room(world, i + w, what)) return swap(world, i, i + w);
  const side = random(world) < 0.5 ? -1 : 1;
  for (const d of [side, -side]) {
    const x2 = x + d;
    if (x2 < 0 || x2 >= w) continue;
    if (y < h - 1 && room(world, i + w + d, what)) return swap(world, i, i + w + d);
  }
  // Liquids look along the row for a way on. Powders stay where they landed.
  for (const d of [side, -side]) {
    for (let k = 1; k <= spread; k++) {
      const x2 = x + d * k;
      if (x2 < 0 || x2 >= w || world.cell[i + d * k] !== EMPTY) break;
      if (k === spread || (y < h - 1 && world.cell[i + w + d * k] === EMPTY)) return swap(world, i, i + d * k);
    }
  }
}

function rise(world: World, x: number, y: number): void {
  const { w } = world;
  const i = y * w + x;
  // Steam gives its heat away and comes down again as rain.
  if (random(world) < (y === 0 ? 0.03 : 0.004)) {
    world.cell[i] = WATER;
    return;
  }
  const d = random(world) < 0.5 ? -1 : 1;
  const x2 = Math.min(Math.max(x + d, 0), w - 1);
  if (y > 0 && world.cell[i - w] === EMPTY) return swap(world, i, i - w);
  if (y > 0 && world.cell[i - w + x2 - x] === EMPTY) return swap(world, i, i - w + x2 - x);
  if (world.cell[i + x2 - x] === EMPTY) swap(world, i, i + x2 - x);
}

/**
 * One step of the world, from the floor up, and from a different side on each row. A step that
 * is `kept` first writes the world down, so it can be gone back to.
 */
export function step(world: World, kept = true): void {
  const { w, h, cell, moved } = world;
  if (kept) {
    world.past.push({ cell: cell.slice(), shade: world.shade.slice(), seed: world.seed });
    if (world.past.length > KEEP) world.past.shift();
  }
  world.stamp = (world.stamp + 1) & 255;

  for (let y = h - 1; y >= 0; y--) {
    const left = (y + world.stamp) % 2 === 0;
    for (let k = 0; k < w; k++) {
      const x = left ? k : w - 1 - k;
      const i = y * w + x;
      const what = cell[i];
      if (what === EMPTY || what === STONE || what === GLASS || moved[i] === world.stamp) continue;
      if (what === STEAM) {
        rise(world, x, y);
        continue;
      }
      const lava = what === LAVA ? -1 : nextToLava(world, x, y);
      if (lava >= 0 && what === WATER) {
        // Water on lava: the water boils away, and the lava under it sets into stone.
        cell[i] = STEAM;
        if (random(world) < 0.6) cell[lava] = STONE;
        moved[i] = world.stamp;
        continue;
      }
      if (lava >= 0 && what === SAND && random(world) < 0.03) {
        cell[i] = GLASS;
        continue;
      }
      if (what === SAND) fall(world, x, y, SAND, 0);
      else if (what === WATER) fall(world, x, y, WATER, 4);
      // Lava is thick: it moves on only some of the steps.
      else if (what === LAVA && random(world) < 0.45) fall(world, x, y, LAVA, 1);
    }
  }
}

/** One step back in time: the world as it was. False when there is no more past to go to. */
export function back(world: World): boolean {
  const before = world.past.pop();
  if (!before) return false;
  world.cell.set(before.cell);
  world.shade.set(before.shade);
  world.seed = before.seed;
  return true;
}

/** Seconds of past the world still holds. */
export const kept = (world: World) => world.past.length / 30;

/**
 * Paints the world into two pictures: the scene, and its light (only what glows, to be blurred
 * on the page). Lava flickers a little on each draw.
 */
export function paint(world: World, scene: ImageData, light: ImageData, flicker: number): void {
  const { cell, shade } = world;
  const a = scene.data;
  const b = light.data;
  for (let i = 0; i < cell.length; i++) {
    const what = cell[i];
    const [r, g, bl] = COLOUR[what];
    let lit = what === EMPTY ? 0 : shade[i] - 20;
    if (what === LAVA) lit = ((i * 7 + flicker) % 23) * 2 - 10;
    const p = i * 4;
    if (what === STEAM) {
      // Steam is thin: some of the dark behind it shows through.
      a[p] = (r * 2 + BACK[0]) / 3;
      a[p + 1] = (g * 2 + BACK[1]) / 3;
      a[p + 2] = (bl * 2 + BACK[2]) / 3;
    } else {
      a[p] = r + lit;
      a[p + 1] = g + lit;
      a[p + 2] = bl + lit;
    }
    a[p + 3] = 255;
    const glows = what === LAVA;
    b[p] = 255;
    b[p + 1] = 120;
    b[p + 2] = 40;
    b[p + 3] = glows ? 255 : 0;
  }
}
