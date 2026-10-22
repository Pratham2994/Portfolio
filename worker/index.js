// The site is static files. This small Worker adds one thing: it passes analytics traffic
// through the site's own address. Ad blockers block by domain, so requests that go straight
// to an analytics company are dropped for many visitors. Requests to /relay/* on this
// domain are forwarded here instead.

const PREFIX = '/relay';
// Set by the region of the PostHog project: "us" or "eu".
const REGION = 'us';
const API = `${REGION}.i.posthog.com`;
const ASSETS = `${REGION}-assets.i.posthog.com`;

// The GitHub account whose last push the "Right now" note shows, and how long an answer is kept.
const GITHUB_USER = 'Pratham2994';
const KEEP_SECONDS = 1800;

/**
 * The last push to one of my projects: the repo and the time. GitHub is asked at most once in
 * half an hour, from here and not from the visitor's browser, so its limit is never reached and
 * the visitor's address is not passed on. The site's own repo is not a project.
 */
async function shipped(request, env, ctx) {
  const cache = caches.default;
  const key = new Request(new URL('/api/shipped', request.url).toString());
  const kept = await cache.match(key);
  if (kept) return kept;
  let body = { repo: null, at: null };
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=20`, {
      // A read-only key, if one is set as a secret, lifts GitHub's limit for addresses it shares
      // with other sites. Without one, the page keeps the answer the build got.
      headers: {
        'User-Agent': 'prathampanchal.dev',
        Accept: 'application/vnd.github+json',
        ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
      },
    });
    if (response.ok) {
      const repos = await response.json();
      const last = repos.find((repo) => !repo.fork && !/^portfolio$/i.test(repo.name));
      if (last) body = { repo: last.name, at: last.pushed_at };
    }
  } catch {
    // GitHub unreachable: the note leaves the line out.
  }
  const answer = new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${KEEP_SECONDS}` },
  });
  if (body.repo) ctx.waitUntil(cache.put(key, answer.clone()));
  return answer;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/shipped') return shipped(request, env, ctx);
    if (!url.pathname.startsWith(`${PREFIX}/`)) return env.ASSETS.fetch(request);

    const path = url.pathname.slice(PREFIX.length);
    // Script files come from the assets host, everything else goes to the API host.
    const host = path.startsWith('/static/') ? ASSETS : API;
    const headers = new Headers(request.headers);
    headers.set('host', host);
    // The visitor's own cookies for this site are not the analytics company's business.
    headers.delete('cookie');

    return fetch(`https://${host}${path}${url.search}`, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'follow',
    });
  },
};
