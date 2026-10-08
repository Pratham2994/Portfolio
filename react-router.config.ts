import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Config } from '@react-router/dev/config';
import fm from 'front-matter';

function slugs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((slug) => {
    const { attributes } = fm<{ hidden?: boolean }>(readFileSync(join(dir, slug, 'index.md'), 'utf8'));
    return !attributes.hidden;
  });
}

export default {
  ssr: false,
  prerender: () => {
    const all = slugs('content/projects');
    if (process.env.VITE_FIXTURES === '1') all.push(...slugs('tests/fixtures/projects'));
    return ['/', ...all.map((slug) => `/work/${slug}`)];
  },
} satisfies Config;
