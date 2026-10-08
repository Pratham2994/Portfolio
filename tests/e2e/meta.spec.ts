import { expect, test } from '@playwright/test';

const SITE = 'https://prathampanchal.dev';
const paths = [
  '/',
  ...[
    'scrub',
    'neat',
    'prats-deck',
    'omnicompiler',
    'floatchat',
    'idea-hackathon',
    'chronicle',
    'algomotion',
    'malshield',
    'local-llm-lab',
  ].map((slug) => `/work/${slug}`),
];

const tag = (html: string, pattern: RegExp) => html.match(pattern)?.[1];

test('every page is served with its own share metadata', async ({ request }, info) => {
  test.skip(info.project.name !== 'laptop', 'reads the built HTML, so one run is enough');
  const titles = new Set<string>();

  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();

    const title = tag(html, /<title>([^<]+)<\/title>/);
    expect(title, path).toBeTruthy();
    titles.add(title!);

    expect(tag(html, /<meta name="description" content="([^"]{20,})"/), path).toBeTruthy();
    expect(tag(html, /<meta property="og:title" content="([^"]+)"/), path).toBeTruthy();
    expect(tag(html, /<link rel="canonical" href="([^"]+)"/), path).toBe(SITE + (path === '/' ? '/' : path));

    const image = tag(html, /<meta property="og:image" content="([^"]+)"/);
    expect(image, path).toMatch(new RegExp(`^${SITE}/og/.+\\.png$`));
    const file = await request.get(image!.replace(SITE, ''));
    expect(file.status(), image).toBe(200);
    expect(file.headers()['content-type']).toBe('image/png');
  }

  expect(titles.size).toBe(paths.length);
});

test('an unknown address answers 404 and still shows a way home', async ({ page }) => {
  const response = await page.goto('/nothing/here');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('link', { name: /back to the wall/i })).toBeVisible();
});

test('robots and the icon are served', async ({ request }, info) => {
  test.skip(info.project.name !== 'laptop');
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect((await request.get('/favicon.svg')).headers()['content-type']).toBe('image/svg+xml');
});
