import fm from 'front-matter';
import { z } from 'zod';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex colour such as #1a2b3c');

const stat = z.object({ value: z.string(), label: z.string() });
const sector = z.object({ title: z.string(), body: z.string() });
const media = z.object({ src: z.string(), alt: z.string().min(1), kind: z.enum(['image', 'video']) });

export const artTemplates = ['frames', 'grid', 'bars', 'code', 'device', 'waves', 'type', 'hex'] as const;

const project = z.object({
  title: z.string().min(1),
  size: z.enum(['poster', 'postcard']),
  order: z.number(),
  hidden: z.boolean().default(false),
  // One project may be the hero: the single A3 poster on the wall.
  hero: z.boolean().default(false),
  status: z.string(),
  tagline: z.string(),
  palette: z.object({ bg: hex, fg: hex, accent: hex }),
  art: z.object({ template: z.enum(artTemplates), motif: z.string().optional() }),
  stats: z.tuple([stat, stat, stat]),
  sectors: z.tuple([sector, sector, sector]),
  stack: z.array(z.string()),
  links: z.object({ repo: z.url(), live: z.url().optional(), paper: z.url().optional() }),
  role: z.string().optional(),
  media: z.array(media).default([]),
});

export type Size = 'poster' | 'postcard';
export type ArtTemplate = (typeof artTemplates)[number];
export type Stat = z.infer<typeof stat>;
export type Sector = z.infer<typeof sector>;
export type Media = z.infer<typeof media>;
export type Project = z.infer<typeof project> & { slug: string; body: string };

const deskItem = z.object({
  id: z.enum(['sports', 'games', 'anime', 'music', 'now', 'cube']),
  object: z.string(),
  title: z.string(),
  body: z.string(),
});
const timelineItem = z.object({ org: z.string(), role: z.string(), when: z.string() });
const you = z.object({ portraitAlt: z.string().min(1), quiet: z.string(), email: z.email(), github: z.url(), linkedin: z.url() });

// Small personal pieces on the wall that are not projects.
const pieces = z.object({
  pass: z.object({
    from: z.string(),
    fromCity: z.string(),
    to: z.string(),
    toCity: z.string(),
    name: z.string(),
    seat: z.string(),
    note: z.string(),
  }),
  ticket: z.object({ title: z.string(), fixtures: z.array(z.object({ sport: z.string(), side: z.string() })) }),
  now: z.object({ title: z.string(), lines: z.array(z.string()) }),
});

export type Pieces = z.infer<typeof pieces>;
export type DeskItem = z.infer<typeof deskItem>;
export type TimelineItem = z.infer<typeof timelineItem>;
export type You = z.infer<typeof you> & { body: string };

function parse<T>(schema: z.ZodType<T>, raw: string, name: string): { data: T; body: string } {
  const { attributes, body } = fm<unknown>(raw);
  const result = schema.safeParse(attributes);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid content in "${name}": ${issues}`);
  }
  return { data: result.data, body: body.trim() };
}

export function parseProject(raw: string, slug: string): Project {
  const { data, body } = parse(project, raw, slug);
  return { ...data, slug, body };
}

export function parseDesk(raw: string): DeskItem[] {
  return parse(z.object({ items: z.array(deskItem) }), raw, 'site/desk').data.items;
}

export function parsePieces(raw: string): Pieces {
  return parse(pieces, raw, 'site/pieces').data;
}

export function parseTimeline(raw: string): TimelineItem[] {
  return parse(z.object({ items: z.array(timelineItem) }), raw, 'site/timeline').data.items;
}

export function parseYou(raw: string): You {
  const { data, body } = parse(you, raw, 'site/you');
  return { ...data, body };
}
