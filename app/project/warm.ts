type Route = { module: string; imports?: string[]; css?: string[] };

/**
 * Fetches the code and the styles of the project page while the wall is shown, so the first
 * poster opens at once. Without it, the first click waits for them, one file after the other;
 * after that they are in the browser cache, so only the first open was slow.
 *
 * The file names come from React Router's manifest of the build. React Router's own prefetch
 * only fetches the styles a route lists in a `links` export, and these are not listed there.
 * If the manifest is not there, nothing is fetched and the page loads as before, on the click.
 */
export function warmProjectPage(): void {
  const manifest = (window as { __reactRouterManifest?: { routes: Record<string, Route | undefined> } }).__reactRouterManifest;
  const route = manifest?.routes['routes/work'];
  if (!route) return;
  const add = (rel: string, href: string, as?: string) => {
    // A file the page already has, or has already asked for, is not asked for again.
    if (document.head.querySelector(`link[href="${CSS.escape(href)}"]`)) return;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    document.head.append(link);
  };
  for (const href of [route.module, ...(route.imports ?? [])]) add('modulepreload', href);
  for (const href of route.css ?? []) add('prefetch', href, 'style');
}

/** Warms the project page when the browser has nothing else to do, after the wall is up. */
export function warmWhenIdle(): () => void {
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(warmProjectPage, { timeout: 2500 });
    return () => cancelIdleCallback(id);
  }
  // Safari has no idle callback: a short wait instead.
  const id = setTimeout(warmProjectPage, 1500);
  return () => clearTimeout(id);
}
