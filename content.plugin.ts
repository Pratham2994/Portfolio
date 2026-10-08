import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Plugin } from 'vite';

import { parseDesk, parseProject, parseTimeline, parseYou } from './app/content/schema.ts';

const ID = 'virtual:content';
const RESOLVED = '\0' + ID;

/**
 * Reads and checks every content file while building, and hands the app plain data as
 * `virtual:content`. The browser never downloads the parser or the schema, and a bad
 * content file stops the build with the name of the file and the field.
 */
export function content(): Plugin {
  return {
    name: 'content',
    resolveId(id) {
      if (id === ID) return RESOLVED;
    },
    load(id) {
      if (id !== RESOLVED) return;

      const read = (file: string) => {
        this.addWatchFile(join(process.cwd(), file));
        return readFileSync(file, 'utf8');
      };
      const projectsIn = (dir: string) =>
        existsSync(dir)
          ? readdirSync(dir)
              .filter((slug) => existsSync(join(dir, slug, 'index.md')))
              .map((slug) => parseProject(read(join(dir, slug, 'index.md')), slug))
          : [];

      const data = {
        projects: [
          ...projectsIn('content/projects'),
          ...(process.env.VITE_FIXTURES === '1' ? projectsIn('tests/fixtures/projects') : []),
        ],
        desk: parseDesk(read('content/site/desk.md')),
        timeline: parseTimeline(read('content/site/timeline.md')),
        you: parseYou(read('content/site/you.md')),
      };
      return `export default ${JSON.stringify(data)};`;
    },
  };
}
