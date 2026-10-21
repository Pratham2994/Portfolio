import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

import { content } from './scripts/content-plugin.ts';

export default defineConfig({
  plugins: [content(), reactRouter()],
  resolve: { tsconfigPaths: true },
  // A build writes the site into build/. The dev server must not take that as an edit and
  // reload the open page: it would restart the opening each time.
  server: { watch: { ignored: ['**/build/**'] } },
});
