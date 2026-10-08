import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

import { content } from './content.plugin.ts';

export default defineConfig({
  plugins: [content(), reactRouter()],
  resolve: { tsconfigPaths: true },
});
