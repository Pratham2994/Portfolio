import { useEffect, type ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import '@fontsource-variable/big-shoulders-display';
import displayFont from '@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2?url';
import '@fontsource-variable/hanken-grotesk';
import textFont from '@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2?url';
import '@fontsource-variable/jetbrains-mono';
import { initScroll } from './lib/scroll';
import { pendingScript } from './wall/entry';
import './styles/tokens.css';
import './styles/global.css';

export function links() {
  // The two faces used above the fold load with the page, so text does not shift when they arrive.
  const font = (href: string) => ({ rel: 'preload', as: 'font', type: 'font/woff2', href, crossOrigin: 'anonymous' as const });
  return [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }, font(displayFont), font(textFont)];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f0e0d" />
        <script dangerouslySetInnerHTML={{ __html: pendingScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  // Marks the page as interactive, for tests and for styles that need scripts.
  useEffect(() => {
    const stopScroll = initScroll();
    document.documentElement.dataset.ready = '';
    return stopScroll;
  }, []);
  return <Outlet />;
}

export function HydrateFallback() {
  return null;
}

/** Shown if a page throws. Plain markup, so it works when the rest of the app does not. */
export function ErrorBoundary() {
  return (
    <main style={{ display: 'grid', placeContent: 'center', gap: '1rem', minHeight: '100svh', padding: '1.5rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-5)', lineHeight: 0.9, textTransform: 'uppercase' }}>
        Something fell off the wall
      </h1>
      <p>That is on me, not you.</p>
      <p>
        <a href="/">Back to the wall</a>
      </p>
    </main>
  );
}
