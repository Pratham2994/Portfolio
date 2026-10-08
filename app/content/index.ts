import data from 'virtual:content';

import type { Project } from './schema';

// Parsed and checked at build time by content.plugin.ts.
export const projects: Project[] = data.projects.filter((p) => !p.hidden).sort((a, b) => a.order - b.order);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function neighbours(slug: string): { prev: Project; next: Project } {
  const i = projects.findIndex((p) => p.slug === slug);
  const n = projects.length;
  return { prev: projects[(i - 1 + n) % n], next: projects[(i + 1) % n] };
}

export const { desk, timeline, you } = data;
