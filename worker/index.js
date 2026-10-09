// The site is static files. This small Worker adds one thing: it passes analytics traffic
// through the site's own address. Ad blockers block by domain, so requests that go straight
// to an analytics company are dropped for many visitors. Requests to /relay/* on this
// domain are forwarded here instead.

const PREFIX = '/relay';
// Set by the region of the PostHog project: "us" or "eu".
const REGION = 'us';
const API = `${REGION}.i.posthog.com`;
const ASSETS = `${REGION}-assets.i.posthog.com`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
