/**
 * Analytics settings. With an empty key, analytics is off and nothing is loaded.
 *
 * The key is the PostHog "project API key" (it starts with phc_). It is public by design:
 * it can only send events, not read them. The region must match worker/index.js.
 */
export const ANALYTICS = {
  key: 'phc_ykioJk3yQzVxFURA2Ee9dt53BnmydX5FMbJTWsqphDC5',
  dashboard: 'https://us.posthog.com',
};
