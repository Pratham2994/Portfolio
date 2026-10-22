import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Plugin } from 'vite';

import { parseDesk, parsePieces, parseProject, parseTimeline, parseYou } from '../app/content/schema.ts';

const ID = 'virtual:content';

type Shipped = { repo: string; at: string } | null;

/**
 * The last public push to a project of mine, read from GitHub while the site builds: the repo
 * and the time. The site's own repo does not count, it is not a project. Anything that goes
 * wrong (no network, a limit, nothing recent) gives null, and the line is left out.
 */
async function lastShipped(profile: string): Promise<Shipped> {
  if (process.env.VITE_FIXTURES === '1') return null;
  const user = profile.replace(/\/+$/, '').split('/').pop();
  try {
    // My repos, the one pushed to last first. The activity feed of the same API misses pushes now
    // and then; the time a repo was last pushed to does not.
    const response = await fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=20`, {
      headers: { 'User-Agent': 'prathampanchal.dev build' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const repos = (await response.json()) as { name: string; fork: boolean; pushed_at: string }[];
    const last = repos.find((repo) => !repo.fork && !/^portfolio$/i.test(repo.name));
    return last ? { repo: last.name, at: last.pushed_at } : null;
  } catch {
    return null;
  }
}
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
    async load(id) {
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
        pieces: parsePieces(read('content/site/pieces.md')),
        shipped: null as Shipped,
      };
      data.shipped = await lastShipped(data.you.github);
      return `export default ${JSON.stringify(data)};`;
    },
  };
}
