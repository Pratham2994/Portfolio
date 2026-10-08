// Crops the portrait to 4:5 and writes app/assets/portrait.webp in greyscale.
// Usage: node scripts/photo.mjs <input> [--top 0.273]
// HEIC input goes through ffmpeg first. The colour treatment is done in CSS.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import sharp from 'sharp';

const [input, ...rest] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/photo.mjs <input> [--top 0.273]');
  process.exit(1);
}

// Head to mid-chest, eyes in the upper third. Fractions of the source image.
const top = Number(rest[rest.indexOf('--top') + 1]) || 0.273;
const CENTRE_X = 0.477;
const WIDTH = 0.44;

let source = input;
let temp;
if (/\.hei[cf]$/i.test(input)) {
  temp = join(tmpdir(), `portrait-${Date.now()}.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-frames:v', '1', temp]);
  source = temp;
}

const image = sharp(source).rotate();
const { width, height } = await image.metadata();
const cropWidth = Math.round(width * WIDTH);
const cropHeight = Math.round(cropWidth * 1.25);
const left = Math.round(width * CENTRE_X - cropWidth / 2);

mkdirSync('app/assets', { recursive: true });
await image
  .extract({ left, top: Math.round(height * top), width: cropWidth, height: cropHeight })
  .resize(960, 1200)
  .greyscale()
  .normalise()
  .webp({ quality: 78 })
  .toFile('app/assets/portrait.webp');

if (temp) rmSync(temp, { force: true });
console.log('wrote app/assets/portrait.webp');
