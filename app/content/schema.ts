import fm from 'front-matter';
import { z } from 'zod';

// Text that is there. An empty field is a mistake, so the build stops on it.
const text = z.string().min(1);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex colour such as #1a2b3c');

// Strict: a comma in a label with no quotes makes a second key, and that must stop the build.
const stat = z.strictObject({ value: text, label: text });
const sector = z.object({ title: text, body: text });
const media = z.object({ src: text, alt: z.string().min(1), kind: z.enum(['image', 'video']) });

// The picture under a project page. Each part has a place on a grid, [column, row], and
// the links say what hands on to what, in the order it happens.
const flow = z.object({
  nodes: z
    .array(
      z.strictObject({
        id: text,
        at: z.tuple([z.number().int().min(1).max(5), z.number().int().min(1).max(3)]),
        name: text.max(16),
        note: text.max(50),
        kind: z.enum(['part', 'you', 'store']).default('part'),
      }),
    )
    .min(4)
    .max(12),
  links: z.array(z.tuple([text, text])).min(3),
});

export const artTemplates = ['frames', 'grid', 'bars', 'code', 'device', 'waves', 'type', 'hex'] as const;

const project = z.object({
  title: z.string().min(1),
  size: z.enum(['poster', 'postcard']),
  order: z.number(),
  hidden: z.boolean().default(false),
  // One project may be the hero: the single A3 poster on the wall.
  hero: z.boolean().default(false),
  status: text,
  tagline: text,
  // One formal sentence, for the one-page version.
  summary: text.optional(),
  palette: z.object({ bg: hex, fg: hex, accent: hex }),
  art: z.object({ template: z.enum(artTemplates), motif: text.optional() }),
  stats: z.tuple([stat, stat, stat]),
  sectors: z.tuple([sector, sector, sector]),
  stack: z.array(text),
  links: z.object({ repo: z.url(), live: z.url().optional(), paper: z.url().optional() }),
  role: text.optional(),
  media: z.array(media).default([]),
  flow: flow.optional(),
});

export type Size = 'poster' | 'postcard';
export type Flow = z.infer<typeof flow>;
export type ArtTemplate = (typeof artTemplates)[number];
export type Stat = z.infer<typeof stat>;
export type Sector = z.infer<typeof sector>;
export type Media = z.infer<typeof media>;
export type Project = z.infer<typeof project> & { slug: string; body: string };

// The desk: one card per object in the drawing.
const desk = z.object({
  sports: z.object({ title: text, note: text, rows: z.array(z.object({ sport: text, side: text })) }),
  games: z.object({
    title: text,
    note: text,
    main: text,
    rank: text.optional(),
    story: z.array(text),
    coop: z.array(text),
    first: text,
  }),
  anime: z.object({ title: text, note: text, list: z.array(text) }),
  music: z.object({ title: text, minutes: text, note: text }),
  pc: z.object({ title: text, note: text, specs: z.array(z.object({ part: text, name: text, quip: text.optional() })) }),
  cube: z.object({ title: text, best: z.number(), note: text }),
  now: z.object({ title: text, lines: z.array(text) }),
});
const timelineItem = z.object({ org: text, role: text, when: text, points: z.array(text).optional() });
// What I build with. A language names the projects it is used in, so each one comes with its proof.
const stack = z.object({
  note: text,
  languages: z.array(z.object({ name: text, first: z.boolean().default(false), used: z.array(text).min(1) })),
  groups: z.array(z.object({ name: text, items: z.array(text).min(1) })),
});
const you = z.object({ portraitAlt: z.string().min(1), quiet: text, email: z.email(), github: z.url(), linkedin: z.url(), resume: text.optional(), stack });

// Small personal pieces on the wall that are not projects.
const pieces = z.object({
  pass: z.object({
    from: text,
    fromCity: text,
    to: text,
    toCity: text,
    name: text,
    seat: text,
    note: text,
  }),
  ticket: z.object({ title: text, fixtures: z.array(z.object({ sport: text, side: text })) }),
  now: z.object({ title: text, lines: z.array(text), more: text.optional() }),
});

export type Pieces = z.infer<typeof pieces>;
export type Desk = z.infer<typeof desk>;
export type DeskId = keyof Desk;
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

export function parseDesk(raw: string): Desk {
  return parse(desk, raw, 'site/desk').data;
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
