import { useEffect, type ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import { pendingScript } from './wall/entry';
import './styles/tokens.css';
import './styles/global.css';

export function meta() {
  return [
    { title: 'Pratham Panchal' },
    { name: 'description', content: 'Software engineer. I build tools because the one I had almost did the job.' },
  ];
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
    document.documentElement.dataset.ready = '';
  }, []);
  return <Outlet />;
}

export function HydrateFallback() {
  return null;
}
