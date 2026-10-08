// Generates the two tiling grain textures in public/textures. Run once: node scripts/textures.mjs
import { mkdir } from 'node:fs/promises';

import sharp from 'sharp';

// A fixed seed, so the files do not change between runs.
function noise(size, alpha, seed) {
  let state = seed;
  const next = () => (state = (state * 16807) % 2147483647) / 2147483647;
  const data = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const value = next() > 0.5 ? 255 : 0;
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = value;
    data[i * 4 + 3] = Math.round(next() * alpha);
  }
  return sharp(data, { raw: { width: size, height: size, channels: 4 } });
}

await mkdir('public/textures', { recursive: true });
await noise(192, 22, 7).blur(0.6).webp({ quality: 45, alphaQuality: 45 }).toFile('public/textures/wall.webp');
await noise(160, 38, 11).webp({ quality: 55, alphaQuality: 55 }).toFile('public/textures/paper.webp');
console.log('textures written');
