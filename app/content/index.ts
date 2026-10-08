import { parseDesk, parseProject, parseTimeline, parseYou, type Project } from './schema';

import deskRaw from '../../content/site/desk.md?raw';
import timelineRaw from '../../content/site/timeline.md?raw';
import youRaw from '../../content/site/you.md?raw';

const files = import.meta.glob<string>('/content/projects/*/index.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const fixtures =
  import.meta.env.VITE_FIXTURES === '1'
    ? import.meta.glob<string>('/tests/fixtures/projects/*/index.md', { query: '?raw', import: 'default', eager: true })
    : {};

const slugOf = (path: string) => path.split('/').at(-2)!;

export const projects: Project[] = Object.entries({ ...files, ...fixtures })
  .map(([path, raw]) => parseProject(raw, slugOf(path)))
  .filter((p) => !p.hidden)
  .sort((a, b) => a.order - b.order);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function neighbours(slug: string): { prev: Project; next: Project } {
  const i = projects.findIndex((p) => p.slug === slug);
  const n = projects.length;
  return { prev: projects[(i - 1 + n) % n], next: projects[(i + 1) % n] };
}

export const desk = parseDesk(deskRaw);
export const timeline = parseTimeline(timelineRaw);
export const you = parseYou(youRaw);
