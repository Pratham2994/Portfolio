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

test('the sitemap lists every built page, and robots points to it', async ({ request }, info) => {
  test.skip(info.project.name !== 'laptop');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const locs = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.sort()).toEqual(paths.map((path) => SITE + path).sort());
});

test('pages carry structured data a search engine can read', async ({ request }, info) => {
  test.skip(info.project.name !== 'laptop');
  const blocks = async (path: string) => {
    const html = await (await request.get(path)).text();
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  };
  const home = await blocks('/');
  const person = home.find((b) => b['@type'] === 'Person');
  expect(person).toMatchObject({ name: 'Pratham Panchal', jobTitle: 'Software Engineer', url: SITE });
  expect(person.sameAs).toContain('https://github.com/Pratham2994');
  expect(home.some((b) => b['@type'] === 'WebSite')).toBe(true);

  const scrub = await blocks('/work/scrub');
  expect(scrub.find((b) => b['@type'] === 'SoftwareSourceCode')).toMatchObject({
    name: 'Scrub',
    codeRepository: 'https://github.com/Pratham2994/Scrub',
  });
  expect(scrub.some((b) => b['@type'] === 'BreadcrumbList')).toBe(true);
});

test('link previews have a title, a description and a picture for every network', async ({ request }, info) => {
  test.skip(info.project.name !== 'laptop');
  const html = await (await request.get('/')).text();
  for (const tag of ['og:title', 'og:description', 'og:image', 'og:locale']) expect(html).toContain(`property="${tag}"`);
  for (const tag of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'author']) expect(html).toContain(`name="${tag}"`);
  expect(html).toMatch(/<title>Pratham Panchal — Software Engineer<\/title>/);
});
