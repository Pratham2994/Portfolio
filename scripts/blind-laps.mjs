// Takes three real laps out of Blind Lap's exported data, with the model's real guess after each
// corner, and writes them to app/project/laps.ts. Run: node scripts/blind-laps.mjs <blindlap/web/public/data>
//
// The model is replayed the same way Blind Lap's own web/src/model.ts does it: each corner's
// held-out scores (stored in tenths) are added up, then turned into chances at the fitted
// temperature. No model runs here or on the page; these are the numbers the game shows.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const data = process.argv[2];
if (!data) throw new Error('usage: node scripts/blind-laps.mjs <blindlap/web/public/data>');
const read = (file) => JSON.parse(readFileSync(join(data, file), 'utf8'));
const index = read('index.json');
const tau = index.models.find((model) => model.id === 'blend').tau;

// The laps: a right and very sure one, a right one that settles early, and a wrong one, where
// the model takes a driver for his teammate in the same car.
const WANT = [
  { session: '10002', code: 'LEC', sure: 97 },
  { session: '11330', code: 'VER', sure: 90 },
  { session: '11322', code: 'HAM', said: 'LEC', sure: 72 },
];

// The sentence under each corner: the most unusual thing done there, as Blind Lap words it.
const SAY = {
  brake_point: (d) => (Math.abs(d) < 3 ? null : `braked ${Math.abs(d).toFixed(0)} m ${d > 0 ? 'later' : 'earlier'} than the field`),
  brake_length: (d) => (Math.abs(d) < 3 ? null : `stayed on the brake ${Math.abs(d).toFixed(0)} m ${d > 0 ? 'longer' : 'less'}`),
  entry_speed: (d) => (Math.abs(d) < 1 ? null : `arrived ${Math.abs(d).toFixed(0)} km/h ${d > 0 ? 'faster' : 'slower'}`),
  apex_speed: (d) => (Math.abs(d) < 1 ? null : `carried ${Math.abs(d).toFixed(0)} km/h ${d > 0 ? 'more' : 'less'} through the apex`),
  apex_offset: (d) => (Math.abs(d) < 3 ? null : `hit the slowest point ${Math.abs(d).toFixed(0)} m ${d > 0 ? 'later' : 'earlier'}`),
  throttle_point: (d) => (Math.abs(d) < 3 ? null : `went to full throttle ${Math.abs(d).toFixed(0)} m ${d > 0 ? 'later' : 'earlier'}`),
  min_throttle: (d) => (Math.abs(d) < 3 ? null : `lifted ${Math.abs(d).toFixed(0)}% ${d > 0 ? 'less' : 'more'}`),
  coast: (d) => (Math.abs(d) < 3 ? null : `coasted ${Math.abs(d).toFixed(0)} m ${d > 0 ? 'more' : 'less'}`),
  throttle_ramp: (d) =>
    Math.abs(d) < 4 ? null : d > 0 ? `squeezed the throttle on over ${Math.abs(d).toFixed(0)} m more` : `opened the throttle ${Math.abs(d).toFixed(0)} m quicker`,
  partial_throttle: (d) => (Math.abs(d) < 4 ? null : `held part-throttle for ${Math.abs(d).toFixed(0)} m ${d > 0 ? 'more' : 'less'}`),
};

function says(session, lap, c) {
  const corner = session.corners[c];
  const order = index.features
    .map((feature, k) => ({ feature, k, z: Math.abs(lap.z[c]?.[k] ?? 0) }))
    .filter((one) => corner.braked || one.k > 2)
    .sort((a, b) => b.z - a.z);
  for (const { feature, k } of order) {
    const raw = lap.raw[c]?.[k];
    const field = session.field.med[c]?.[k];
    if (raw == null || field == null) continue;
    const sentence = SAY[feature]?.(raw - field);
    if (sentence) return sentence;
  }
  return 'took it exactly like the field';
}

function chances(codes, sums) {
  const scaled = sums.map((sum) => sum / tau);
  const top = Math.max(...scaled);
  const weights = scaled.map((v) => Math.exp(v - top));
  const total = weights.reduce((a, b) => a + b);
  return codes.map((code, i) => [code, weights[i] / total]).sort((a, b) => b[1] - a[1]);
}

const word = (p) => (p >= 0.9 ? 'Very sure' : p >= 0.6 ? 'Fairly sure' : p >= 0.3 ? 'Leaning' : 'Not sure');
const title = (name) => name.replace(/\S+/g, (part) => part[0] + part.slice(1).toLowerCase());
const round = (value, places = 0) => Math.round(value * 10 ** places) / 10 ** places;

const laps = WANT.map((want) => {
  const session = read(`sessions/${want.session}.json`);
  const here = new Set(Object.values(session.drivers).map((driver) => driver.code));
  const codes = session.model.classes.filter((code) => here.has(code));
  const columns = codes.map((code) => session.model.classes.indexOf(code));

  for (const lap of session.laps.filter((one) => one.code === want.code)) {
    const sums = codes.map(() => 0);
    const corners = lap.steps.blend.map((row, c) => {
      columns.forEach((k, i) => (sums[i] += row[k] / 10));
      return {
        n: session.corners[c].n,
        mid: Math.round(session.corners[c].s),
        exit: Math.round(session.corners[c].hi),
        top: chances(codes, sums)
          .slice(0, 3)
          .map(([code, p]) => [code, Math.round(p * 100)]),
        says: says(session, lap, c),
      };
    });
    const [said, p] = chances(codes, sums)[0];
    if (Math.round(p * 100) !== want.sure || said !== (want.said ?? want.code)) continue;

    // The line of the circuit, turned the way MultiViewer draws it, one point every 40 m,
    // in a box 1000 across. Screen y runs down, so the map's y is turned over.
    const turn = (session.rotation * Math.PI) / 180;
    const every = 10;
    const points = [];
    for (let i = 0; i < session.track.x.length; i += every) {
      const [x, y] = [session.track.x[i], session.track.y[i]];
      points.push([x * Math.cos(turn) - y * Math.sin(turn), -(x * Math.sin(turn) + y * Math.cos(turn))]);
    }
    const left = Math.min(...points.map(([x]) => x));
    const top = Math.min(...points.map(([, y]) => y));
    const span = Math.max(...points.map(([x]) => x - left), ...points.map(([, y]) => y - top));
    const driver = Object.values(session.drivers).find((one) => one.code === lap.code);
    const guessed = Object.values(session.drivers).find((one) => one.code === said);

    return {
      circuit: session.circuit,
      year: Number(session.date.slice(0, 4)),
      length: Math.round(session.length),
      step: session.track.step * every,
      time: lap.lapTime,
      code: lap.code,
      name: title(driver.name),
      team: driver.team,
      drivers: codes.length,
      line: points.map(([x, y]) => [Math.round(((x - left) / span) * 1000), Math.round(((y - top) / span) * 1000)]),
      // Time and distance, every third sample: enough for the car to move as it really did.
      run: lap.t.filter((_, i) => i % 3 === 0).map((t, i) => [round(t, 1), Math.round(lap.s[i * 3])]),
      // Speed and brake, every other sample, for the trace under the map.
      trace: lap.s.filter((_, i) => i % 2 === 0).map((s, i) => [Math.round(s), Math.round(lap.v[i * 2]), lap.brk[i * 2] ? 1 : 0]),
      corners,
      said,
      // The team of the driver it named. The same team as the real one means it found the car.
      saidTeam: guessed.team,
      sure: Math.round(p * 100),
      word: word(p),
    };
  }
  throw new Error(`no lap matches ${JSON.stringify(want)}`);
});

const out = `// Made by scripts/blind-laps.mjs from Blind Lap's exported data. Do not edit by hand.
// Three real qualifying laps, and the guess of Blind Lap's blended model after each corner,
// from models that never saw that circuit.

export type Guess = [code: string, percent: number];
export type Corner = { n: string; mid: number; exit: number; top: Guess[]; says: string };
export type Lap = {
  circuit: string;
  year: number;
  /** Metres, and the distance between two points of the line. */
  length: number;
  step: number;
  /** The official lap time, in seconds. */
  time: number;
  code: string;
  name: string;
  team: string;
  /** How many drivers the model could pick from. */
  drivers: number;
  line: [x: number, y: number][];
  run: [seconds: number, metres: number][];
  trace: [metres: number, kmh: number, brake: 0 | 1][];
  corners: Corner[];
  said: string;
  saidTeam: string;
  sure: number;
  word: string;
};

export const LAPS: Lap[] = [
${laps
  .map(
    (lap) => `  {
${Object.entries(lap)
  .map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`)
  .join('\n')}
  },`,
  )
  .join('\n')}
];
`;
writeFileSync('app/project/laps.ts', out);
for (const lap of laps) console.log(`${lap.circuit} ${lap.year}: ${lap.code}, the model said ${lap.said} (${lap.sure}%, ${lap.word})`);
