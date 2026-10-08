// Renders one 1200x630 preview image per page into public/og. Run after content changes: npm run og
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import fm from 'front-matter';
import { chromium } from 'playwright';

const font = (file) =>
  readFileSync(join('node_modules/@fontsource-variable', file)).toString('base64');
const display = font('big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2');
const mono = font('jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2');

// The longest word sets the size, so a title never runs off the card.
const size = (title) => Math.min(210, Math.floor(1056 / (Math.max(...title.split(/\s+/).map((w) => w.length)) * 0.6)));

const card = ({ bg, fg, accent, title, line, label }) => `
<style>
  @font-face { font-family: D; src: url(data:font/woff2;base64,${display}); font-weight: 100 900; }
  @font-face { font-family: M; src: url(data:font/woff2;base64,${mono}); font-weight: 100 800; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; padding: 64px 72px; background: ${bg}; color: ${fg};
    display: flex; flex-direction: column; justify-content: space-between; font-family: M, monospace; }
  small { font-size: 26px; letter-spacing: 0.08em; text-transform: uppercase; }
  h1 { font-family: D, sans-serif; font-weight: 900; font-size: ${size(title)}px;
    line-height: 0.82; text-transform: uppercase; }
  p { font-size: 34px; line-height: 1.25; max-width: 24em; }
  i { display: block; width: 120px; height: 14px; background: ${accent}; margin-bottom: 28px; }
</style>
<small>${label}</small>
<div><i></i><h1>${title}</h1></div>
<p>${line}</p>`;

const cards = [
  {
    name: 'home',
    bg: '#0f0e0d',
    fg: '#ece8df',
    accent: '#ff7a1a',
    title: 'Almost',
    line: 'Most of my code exists because a tool almost did what I needed.',
    label: 'Pratham Panchal',
  },
];

for (const slug of readdirSync('content/projects')) {
  const { attributes: project } = fm(readFileSync(join('content/projects', slug, 'index.md'), 'utf8'));
  if (project.hidden) continue;
  cards.push({ name: slug, ...project.palette, title: project.title, line: project.tagline, label: 'prathampanchal.dev' });
}

mkdirSync('public/og', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const item of cards) {
  await page.setContent(card(item));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `public/og/${item.name}.png` });
}
await browser.close();
console.log(`wrote ${cards.length} images to public/og`);
