import { describe, expect, it } from 'vitest';

import { neighbours, projects } from '~/content';
import { parseProject } from '~/content/schema';

const valid = `---
title: Sample
size: poster
order: 1
status: Local tool
tagline: A sample project
palette: { bg: '#101010', fg: '#f0f0f0', accent: '#ff7a1a' }
art: { template: frames }
stats:
  - { value: '1', label: one }
  - { value: '2', label: two }
  - { value: '3', label: three }
sectors:
  - { title: A, body: a }
  - { title: B, body: b }
  - { title: C, body: c }
stack: [TypeScript]
links: { repo: 'https://github.com/x/y' }
---
Why it exists.
`;

describe('parseProject', () => {
  it('parses a valid file and takes the slug from the folder', () => {
    const p = parseProject(valid, 'sample');
    expect(p.slug).toBe('sample');
    expect(p.title).toBe('Sample');
    expect(p.body).toBe('Why it exists.');
  });

  it('defaults hidden to false and media to an empty list', () => {
    const p = parseProject(valid, 'sample');
    expect(p.hidden).toBe(false);
    expect(p.media).toEqual([]);
  });

  it('names the slug and the field when stats are not three', () => {
    const two = valid.replace("  - { value: '3', label: three }\n", '');
    expect(() => parseProject(two, 'sample')).toThrow(/sample.*stats/s);
  });

  it('rejects a palette colour that is not hex', () => {
    const bad = valid.replace("bg: '#101010'", 'bg: red');
    expect(() => parseProject(bad, 'sample')).toThrow(/sample.*palette/s);
  });
});

describe('neighbours', () => {
  it('wraps from the last project to the first', () => {
    const last = projects[projects.length - 1];
    expect(neighbours(last.slug).next.slug).toBe(projects[0].slug);
    expect(neighbours(projects[0].slug).prev.slug).toBe(last.slug);
  });
});
