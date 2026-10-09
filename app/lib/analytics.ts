import { ANALYTICS } from './analytics.config';

type Props = Record<string, string | number | boolean>;
type Client = { capture: (name: string, props?: Props) => void };

let client: Client | null = null;
let started = false;
// Events that happen before the client has loaded wait here.
const queue: Array<[string, Props | undefined]> = [];

/** Records that something happened: a poster opened, the lever pressed. Safe to call anywhere. */
export function track(name: string, props?: Props): void {
  if (!ANALYTICS.key) return;
  if (client) client.capture(name, props);
  else if (queue.length < 50) queue.push([name, props]);
}

/**
 * Starts analytics once the page is idle, so it never delays the first paint.
 * It does nothing without a key, and nothing for a visitor whose browser says "do not track".
 * It sets no cookies: a visit is counted, but the visitor is not followed between visits.
 */
export function initAnalytics(): void {
  if (started || !ANALYTICS.key || typeof window === 'undefined') return;
  started = true;

  const start = async () => {
    const { default: posthog } = await import('posthog-js');
    posthog.init(ANALYTICS.key, {
      // Requests go to this site's own address and the Worker passes them on. See worker/index.js.
      api_host: '/relay',
      ui_host: ANALYTICS.dashboard,
      persistence: 'memory',
      person_profiles: 'identified_only',
      // The app changes pages without a reload, so page views follow the address.
      capture_pageview: 'history_change',
      capture_pageleave: true,
      autocapture: true,
    });
    client = posthog;
    for (const [name, props] of queue.splice(0)) posthog.capture(name, props);
  };

  const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 1500));
  idle(() => void start());
}
