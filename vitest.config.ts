import { defineConfig } from 'vitest/config';

import { content } from './content.plugin.ts';

export default defineConfig({
  plugins: [content()],
  resolve: { tsconfigPaths: true },
  test: { include: ['tests/unit/**/*.test.ts'] },
});
