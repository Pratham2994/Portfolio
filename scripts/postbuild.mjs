// Runs after the build.
import { copyFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'build/client';
const SITE = 'https://prathampanchal.dev';

// The host serves 404.html for any address that is not a built page. The app then starts
// there and shows its own "not on the wall" page, with a real 404 status.
copyFileSync(join(OUT, '__spa-fallback.html'), join(OUT, '404.html'));

// The sitemap lists every page that was built, so it can never name a page that does not exist.
const work = join(OUT, 'work');
const slugs = existsSync(work) ? readdirSync(work).filter((slug) => existsSync(join(work, slug, 'index.html'))) : [];
const pages = [
  { path: '/', file: join(OUT, 'index.html'), priority: '1.0' },
  { path: '/brief', file: join(OUT, 'brief', 'index.html'), priority: '0.9' },
  ...slugs.sort().map((slug) => ({ path: `/work/${slug}`, file: join(work, slug, 'index.html'), priority: '0.8' })),
];
const entries = pages.map(
  (page) => `  <url>
    <loc>${SITE}${page.path}</loc>
    <lastmod>${statSync(page.file).mtime.toISOString().slice(0, 10)}</lastmod>
    <priority>${page.priority}</priority>
  </url>`,
);
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`,
);
console.log(`sitemap: ${pages.length} pages`);
