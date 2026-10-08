# Portfolio Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy prathampanchal.dev: a poster wall home page where each poster opens into a match-day project page, followed by the desk, "You" and contact sections.

**Architecture:** One React app in React Router 7 framework mode with `ssr: false` and build-time pre-rendering of every route. The wall is the root layout route and stays mounted; `/work/:slug` renders as a child route over it. Projects are Markdown folders validated by a schema at build time, and the wall grid is computed from them. DOM posters are the source of truth; a WebGL layer adds wall light and is optional.

**Tech Stack:** Node 20+, npm, TypeScript (strict), React 19, React Router 7 (Vite), GSAP + `@gsap/react`, Lenis, OGL, Zod, `front-matter`, `react-markdown`, CSS Modules, `@fontsource-variable/*`, Vitest (pure logic only), Playwright (E2E), ESLint. Hosting: Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-10-08-portfolio-wall-design.md`

## Global Constraints

- Dark only. No light theme. `color-scheme: dark` on `:root`.
- No decorative colour gradients behind content. No glow attached to the cursor. Light sources are fixed.
- Original art only. No photographs of athletes, no franchise artwork.
- Copy is plain, first person, not boastful. No emoji. Draft copy is reviewed by Pratham before launch.
- Barclays appears as "Software Engineer, Barclays" and nothing more.
- Never shown: phone number, body measurements, plans for further study.
- The string "Chindi" may appear only inside `content/projects/prats-deck/`.
- No horizontal overflow at any width from 320px up. Browser zoom to 200% stays usable.
- Hover and tilt are gated by `(hover: hover) and (pointer: fine)`, never by width.
- `prefers-reduced-motion: reduce`: no entry sequence, no parallax, no cat movement, no peel; all content reachable.
- All colours, type sizes, spacing and motion timings come from `app/styles/tokens.css`.
- Commits carry Pratham's git identity only. No `Co-Authored-By`, no AI mention in messages. No force push. No secrets. Work happens on branch `v1`; nothing is pushed without Pratham's instruction.
- Testing follows the owner's rule: E2E at the end of each task; unit tests only for the two pure modules in Tasks 2 and 3.
- A task is done only when `npm run lint`, `npm run typecheck`, `npm run build` and that task's tests pass.

## Review Focus

1. **Unknown or hidden slug loaded directly** (`/work/nope`, or a project with `hidden: true`): a reasonable person expects a "not on the wall" page with a link home, not a blank screen or a crash. Test in Task 5.
2. **Back, Forward or a second click while the poster transition is running:** expect the final state to match the URL, with no stuck overlay and no invisible poster. Test in Task 6.
3. **Resize or rotate while a project page is open, then close:** expect the poster to return to its new position. Test in Task 6.
4. **Project content at the edges** (a 40-character title, no `live` link, no media, no `role`): expect the poster and page to hold their layout with no overflow and no empty headings. Test in Task 5 with a fixture project.
5. **Scripts slow, WebGL unavailable, or the tab hidden during the entry sequence:** expect the wall to be visible and usable at rest. Tests in Tasks 7 and 8.

---

## File Structure

```
app/
  root.tsx                     HTML shell, fonts, global CSS
  routes.ts                    route table
  routes/home.tsx              layout route: Wall + Desk + You + Contact + <Outlet/>
  routes/work.tsx              /work/:slug project page
  routes/not-found.tsx         catch-all
  styles/tokens.css            every colour, size, spacing and timing token
  styles/global.css            reset, base type, focus ring
  content/schema.ts            Zod schema + types
  content/index.ts             loads and validates content, exports queries
  wall/layout.ts               computeWall()
  wall/Wall.tsx (+ .module.css)
  wall/Poster.tsx (+ .module.css)
  wall/Centre.tsx
  wall/art/*.tsx               one file per art template
  wall/art/index.ts            template registry
  wall/Light.tsx               WebGL light layer (optional)
  wall/useDepth.ts             pointer parallax
  wall/Cat.tsx, wall/cat-sprite.ts
  wall/entry.ts                entry sequence
  project/ProjectPage.tsx (+ .module.css)
  project/transition.ts        poster <-> page
  sections/Desk.tsx, You.tsx, Contact.tsx (+ .module.css each)
  lib/motion.ts                GSAP registration, reduced-motion flag
  lib/scroll.ts                Lenis setup
content/
  projects/<slug>/index.md     one folder per project, media beside it
  site/desk.md, you.md, timeline.md
scripts/
  photo.mjs                    crop + export of the portrait
  og.mjs                       preview images per route
tests/
  unit/schema.test.ts, layout.test.ts
  e2e/*.spec.ts
  fixtures/projects/edge-case/index.md
react-router.config.ts, vite.config.ts, playwright.config.ts, eslint.config.js, tsconfig.json
```

---

### Task 1: Scaffold, tooling and tokens

**Files:**
- Create: `package.json`, `react-router.config.ts`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `playwright.config.ts`, `.gitignore`, `app/root.tsx`, `app/routes.ts`, `app/routes/home.tsx`, `app/styles/tokens.css`, `app/styles/global.css`, `app/lib/motion.ts`
- Test: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `lint`, `typecheck`, `test:unit`, `test:e2e`. `app/lib/motion.ts` exports `prefersReducedMotion(): boolean` and `finePointer(): boolean` (both safe to call during pre-render, returning `true` and `false` respectively when `window` is absent).
- Produces: CSS tokens `--wall`, `--wall-shade`, `--bone`, `--dim`, `--signal`, `--font-display`, `--font-text`, `--font-mono`, `--step--1` to `--step-6` (fluid `clamp()` type scale), `--space-1` to `--space-8`, `--dur-fast: 160ms`, `--dur-base: 450ms`, `--dur-slow: 900ms`, `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-in-out: cubic-bezier(0.76, 0, 0.24, 1)`.
- Produces: Playwright projects named `phone` (360×800), `tablet` (768×1024), `laptop-short` (1366×768), `laptop` (1440×900), `desktop` (1920×1080), `wide` (2560×1440), `portrait` (1080×1920). `webServer` runs `npm run build && npm run preview`.

- [ ] **Step 1:** Create branch `v1` from `master`.
- [ ] **Step 2:** Scaffold React Router 7 with the Vite plugin, TypeScript strict, `ssr: false`. Set `prerender: ['/']` in `react-router.config.ts` for now.
- [ ] **Step 3:** Add fonts with `@fontsource-variable/big-shoulders-display` (display), `@fontsource-variable/hanken-grotesk` (text) and `@fontsource-variable/jetbrains-mono` (mono). Each token has a system fallback stack.
- [ ] **Step 4:** Write `tokens.css` and `global.css`. Colour values: `--wall: #0f0e0d`, `--wall-shade: #070606`, `--bone: #ece8df`, `--dim: #8f8a80`, `--signal: #ff7a1a`. `body` background is `var(--wall)`.
- [ ] **Step 5:** Write the smoke test.

```ts
test('home renders with the name and no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pratham Panchal/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
```

- [ ] **Step 6:** Run `npm run lint && npm run typecheck && npm run build && npm run test:e2e`. Expected: all pass in all seven projects.
- [ ] **Step 7:** Commit: `Scaffold app, tooling and design tokens`.

---

### Task 2: Content model and launch content

**Files:**
- Create: `app/content/schema.ts`, `app/content/index.ts`, `content/projects/{scrub,neat,prats-deck,omnicompiler,floatchat,idea-hackathon,chronicle,algomotion,malshield,local-llm-lab}/index.md`, `content/site/{desk,you,timeline}.md`, `tests/fixtures/projects/edge-case/index.md`
- Modify: `react-router.config.ts` (pre-render one path per visible project)
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Produces, from `app/content/schema.ts`:

```ts
export type Size = 'poster' | 'postcard';
export type ArtTemplate = 'frames' | 'grid' | 'bars' | 'code' | 'device' | 'waves' | 'type' | 'hex';
export interface Stat { value: string; label: string }
export interface Sector { title: string; body: string }
export interface Media { src: string; alt: string; kind: 'image' | 'video' }
export interface Project {
  title: string; slug: string; size: Size; order: number; hidden: boolean;
  status: string; tagline: string;
  palette: { bg: string; fg: string; accent: string };
  art: { template: ArtTemplate; motif?: string };
  stats: [Stat, Stat, Stat]; sectors: [Sector, Sector, Sector];
  stack: string[]; links: { repo: string; live?: string; paper?: string };
  role?: string; media: Media[]; body: string;
}
export function parseProject(raw: string, slug: string): Project; // throws Error naming the slug and field
```

- Produces, from `app/content/index.ts`: `projects: Project[]` (visible only, sorted by `order`), `getProject(slug: string): Project | undefined`, `neighbours(slug: string): { prev: Project; next: Project }` (wraps around), and `desk`, `you`, `timeline` parsed from `content/site/`.

- [ ] **Step 1:** Write `tests/unit/schema.test.ts`: a valid file parses; `hidden` defaults to `false` and `media` to `[]`; a file with two stats throws an error that contains the slug and `stats`; `palette.bg` that is not a hex colour throws; `neighbours` wraps from last to first.
- [ ] **Step 2:** Run `npm run test:unit`. Expected: FAIL, module not found.
- [ ] **Step 3:** Implement the schema with Zod and `front-matter`. Load files with `import.meta.glob('/content/projects/*/index.md', { query: '?raw', eager: true })`. Validation runs at module load, so `npm run build` fails on invalid content.
- [ ] **Step 4:** Write the ten project files with these fixed values. Body text ("why it exists") is drafted from the README of each repo and Pratham's own words, two or three sentences each.

| slug | size | order | template (motif) | bg / fg / accent | status | stats |
| --- | --- | --- | --- | --- | --- | --- |
| scrub | poster | 1 | frames | `#ece8df` / `#14161c` / `#ff5a1f` | Local tool | 24 operations · 2-pass encode to fit a size · 0 bytes sent to the internet |
| neat | poster | 2 | grid | `#0d3b28` / `#c9f7da` / `#ffc21a` | In daily use | v0.2 current version · 8 kinds of clutter it groups · 0 permanent deletes |
| prats-deck | poster | 3 | device | `#ff7a1a` / `#1f0d00` / `#fff4e6` | On my desk | 15 touch apps · 2.8" touch screen · 1 cat that dances |
| omnicompiler | poster | 4 | code | `#2f5bff` / `#f3f5ff` / `#ff3b3b` | Paper under review | 5 languages · 10/12 debug functions in all five · 0.86 F1, breakpoint model |
| floatchat | poster | 5 | waves | `#06243a` / `#cfeeff` / `#ffc21a` | Smart India Hackathon 2025 | 22/75 commits · 5 MCP tools · 3 layers |
| idea-hackathon | poster | 6 | type (`P3`) | `#c8102e` / `#fff4ee` / `#ffc21a` | P3, iDEA Hackathon | P3 result · 58 commits · 95%+ face recognition accuracy |
| chronicle | postcard | 7 | bars (`eq`) | `#ffc21a` / `#191200` / `#c8102e` | Data documentary | 5 behaviour metrics · 3 layers · 1 lifetime of plays |
| algomotion | postcard | 8 | bars (`sort`) | `#171a24` / `#ece8df` / `#2f6bff` | Live | 11 sorting algorithms · 6 pathfinding algorithms · 3 A* heuristics |
| malshield | postcard | 9 | hex | `#2a1552` / `#e7dcff` / `#3ddc84` | Hackathon build | 5 file formats · 2 analysis modes · 17/26 commits |
| local-llm-lab | postcard | 10 | bars (`rank`) | `#14161c` / `#ece8df` / `#3ddc84` | Closed, verdict written | 4,101 runs · 34 tasks · 1 metric: correct answers per hour |

Repo links: `Pratham2994/{Scrub,Neat,Prats-Deck,OmniCompiler,Chronicle,Algomotion,LocaLLM}`, `VarnikaBajpai4/FloatChat_DebugDynasty_SiH`, `AmaanSyed2004/ideahack-DebugDynasty`, `VarnikaBajpai4/ctrl_alt_elite_hack8`. `algomotion` has `live: https://algomotion.vercel.app`. Team projects set `role`. The iDEA page body gives national scope and the 11 lakh rupee prize pool as detail. The OmniCompiler page states that a paper is under review and names no venue.

- [ ] **Step 5:** Write `content/site/you.md`, `desk.md`, `timeline.md` with the content of spec sections 7 and 8.
- [ ] **Step 6:** Write the fixture `edge-case` project: title of 40 characters, no `live`, no `media`, no `role`. It is loaded only when `VITE_FIXTURES=1`.
- [ ] **Step 7:** In `react-router.config.ts`, read `content/projects/*/index.md` with `fs`, skip `hidden: true`, and pre-render `/` plus `/work/<slug>` for each.
- [ ] **Step 8:** Run `npm run test:unit && npm run build`. Expected: PASS, and the build output lists 11 pre-rendered paths.
- [ ] **Step 9:** Run `git grep -n "Chindi" -- . ":!content/projects/prats-deck" ":!docs"`. Expected: no output.
- [ ] **Step 10:** Commit: `Add content schema and launch content`.

---

### Task 3: Wall grid at every breakpoint

**Files:**
- Create: `app/wall/layout.ts`, `app/wall/Wall.tsx`, `app/wall/Wall.module.css`, `app/wall/Poster.tsx`, `app/wall/Poster.module.css`, `app/wall/Centre.tsx`
- Modify: `app/routes/home.tsx`
- Test: `tests/unit/layout.test.ts`, `tests/e2e/wall.spec.ts`

**Interfaces:**
- Consumes: `projects`, `Project` from Task 2.
- Produces:

```ts
export type Cell = { kind: 'centre' } | { kind: 'project'; project: Project } | { kind: 'empty' };
export type Columns = 2 | 3 | 5;
export function computeWall(projects: Project[], columns: Columns): Cell[];
```

- Produces: each poster is `<a href="/work/<slug>" data-poster="<slug>" data-size="poster|postcard">`. Empty frames are `<div data-empty>`. The centre is `<div data-centre>`. The wall root is `<section id="wall" data-wall data-columns="2|3|5">`.

**Layout rule (`computeWall`):**
- `columns = 5`: rows = smallest `r >= 3` with `5r - 3 >= n + 1`. The centre occupies columns 2–4 of the middle row. Projects fill the other cells in row-major order. Remaining cells are `empty`.
- `columns = 3` and `2`: the centre is first and spans the full row. Projects follow in order. `empty` cells pad the last row, and one extra `empty` is added if the last row was already full.
- The centre appears exactly once. There is always at least one `empty`.

**Breakpoints (CSS, by width and aspect ratio):** 2 columns below 600px; 3 columns from 600px to 899px, and at any width when the viewport is taller than it is wide; 5 columns from 900px. From 900px the wall fits the available height (`min()` of width and height based sizes) and is capped at 1680px wide. Postcards render at 62% of the cell.

- [ ] **Step 1:** Write `tests/unit/layout.test.ts`: for `n` in 6..16 and each column count, the result contains each project once, one `centre`, at least one `empty`; for `n = 10, columns = 5` the length is 13 cells (12 + centre) with exactly 2 `empty`; project order is preserved.
- [ ] **Step 2:** Run `npm run test:unit`. Expected: FAIL.
- [ ] **Step 3:** Implement `computeWall`, then `Wall`, `Poster` (palette as CSS custom properties, title, tagline; no art yet) and `Centre` (the word ALMOST across three panels, the thesis line, the name).
- [ ] **Step 4:** Write `tests/e2e/wall.spec.ts`:

```ts
test('wall shows every project, the centre and empty frames', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-poster]')).toHaveCount(10);
  await expect(page.locator('[data-centre]')).toContainText('ALMOST');
  expect(await page.locator('[data-empty]').count()).toBeGreaterThan(0);
});
test('no poster is clipped or overflowing', async ({ page }) => {
  await page.goto('/');
  const bad = await page.evaluate(() => [...document.querySelectorAll('[data-poster]')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth + 1 || r.width < 120; }).length);
  expect(bad).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
test('200% zoom keeps the wall usable', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
```

- [ ] **Step 5:** Run the full check set. Expected: PASS in all seven Playwright projects.
- [ ] **Step 6:** Commit: `Add computed wall grid for all breakpoints`.

---

### Task 4: Poster art templates

**Files:**
- Create: `app/wall/art/{Frames,Grid,Bars,Code,Device,Waves,Type,Hex}.tsx`, `app/wall/art/art.module.css`, `app/wall/art/index.ts`
- Modify: `app/wall/Poster.tsx`
- Test: `tests/e2e/art.spec.ts`

**Interfaces:**
- Consumes: `ArtTemplate`, `Project`.
- Produces: `export const ART: Record<ArtTemplate, (props: { motif?: string }) => JSX.Element>`. Art is sized in container query units so it scales with the poster, is `aria-hidden`, and uses only `var(--bg)`, `var(--fg)`, `var(--accent)`. `Bars` supports motifs `eq`, `sort`, `rank`.

- [ ] **Step 1:** Write `tests/e2e/art.spec.ts`: every `[data-poster]` contains one `[data-art]` with non-zero size; with `reducedMotion: 'reduce'`, `document.getAnimations()` returns none running inside `[data-wall]`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the eight templates. Each has one loop that shows what the project does (frames: trim handles move across frames; grid: scattered squares tidy into rows; code: a breakpoint steps down lines; device: screen tiles light in turn; waves: drifting lines with float dots; type: one large word from `motif`; hex: a scan line over hex bytes). Paper grain is a shared repeating texture, not a gradient.
- [ ] **Step 4:** Run the full check set. Expected: PASS.
- [ ] **Step 5:** Commit: `Add poster art templates`.

---

### Task 5: Project page and routes

**Files:**
- Create: `app/routes/work.tsx`, `app/routes/not-found.tsx`, `app/project/ProjectPage.tsx`, `app/project/ProjectPage.module.css`
- Modify: `app/routes.ts`, `app/routes/home.tsx` (render `<Outlet />`)
- Test: `tests/e2e/project.spec.ts`

**Interfaces:**
- Consumes: `getProject`, `neighbours`.
- Produces: the page root is `<article data-project="<slug>" role="dialog" aria-modal="true" aria-labelledby="project-title">` rendered over the wall. It contains `#project-title`, `[data-close]` (link to `/`), `[data-prev]`, `[data-next]`. Each route exports `meta` with a unique title (`<Project> — Pratham Panchal`) and the tagline as description.
- Page order is fixed by spec section 5. A section with no content (no media, no `role`, no `live`) is not rendered at all.

- [ ] **Step 1:** Write `tests/e2e/project.spec.ts`:

```ts
test('poster opens its project and close returns to the wall', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-poster="scrub"]').click();
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await expect(page.locator('#project-title')).toHaveText('Scrub');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-project]')).toHaveCount(0);
});
test('direct load shows the page, and Back leads home', async ({ page }) => {
  await page.goto('/work/neat');
  await expect(page.locator('#project-title')).toHaveText('Neat');
  await page.locator('[data-close]').click();
  await expect(page).toHaveURL(/\/$/);
});
test('next and previous walk the wall in order and wrap', async ({ page }) => {
  await page.goto('/work/local-llm-lab');
  await page.locator('[data-next]').click();
  await expect(page).toHaveURL(/\/work\/scrub$/);
});
test('unknown slug shows the not-found page with a way home', async ({ page }) => {
  await page.goto('/work/nope');
  await expect(page.getByRole('heading', { name: /not on the wall/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /back to the wall/i })).toBeVisible();
});
test('keyboard: Tab reaches a poster, Enter opens it, focus lands on the title', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-poster="scrub"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#project-title')).toBeFocused();
});
```

Add one more spec file run with `VITE_FIXTURES=1`: the `edge-case` page has no horizontal overflow at 360px, and no empty heading (`h2` elements all have a following sibling with text).

- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the route, the page and the not-found route. Focus moves to the title on open and back to the poster on close. Focus is trapped inside the page while it is open. The wall behind is `inert`.
- [ ] **Step 4:** Run the full check set. Expected: PASS.
- [ ] **Step 5:** Commit: `Add project pages and routing`.

---

### Task 6: Poster to page transition

**Files:**
- Create: `app/project/transition.ts`
- Modify: `app/routes/work.tsx`, `app/wall/Poster.tsx`
- Test: `tests/e2e/transition.spec.ts`

**Interfaces:**
- Consumes: `prefersReducedMotion`, the `data-poster` and `data-project` hooks.
- Produces:

```ts
export function openFrom(poster: HTMLElement, page: HTMLElement): Promise<void>;
export function closeTo(poster: HTMLElement | null, page: HTMLElement): Promise<void>;
export function cancelTransition(): void; // jumps any running transition to its end state
```

- Sequence (spec 6.1): poster lifts, wall recedes, poster grows to the viewport and becomes the page background, content arrives in sequence. Total 1.1s. `closeTo` measures the poster's rectangle at call time. With reduced motion, or when `poster` is `null` (direct load), both functions resolve immediately.
- While a transition runs, `<html data-transitioning>` is set. Navigation during a transition calls `cancelTransition()` first.

- [ ] **Step 1:** Write `tests/e2e/transition.spec.ts`:

```ts
test('rapid open, back, open leaves a state that matches the URL', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-poster="scrub"]').click();
  await page.goBack(); await page.goForward(); await page.goBack();
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
  await expect(page.locator('[data-project]')).toHaveCount(0);
  await expect(page.locator('[data-poster="scrub"]')).toBeVisible();
});
test('closing after a resize returns the poster to its new place', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-poster="neat"]').click();
  await expect(page.locator('#project-title')).toBeVisible();
  await page.setViewportSize({ width: 700, height: 900 });
  await page.keyboard.press('Escape');
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
  const box = await page.locator('[data-poster="neat"]').boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 700).toBe(true);
});
test('reduced motion opens with a cut', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.locator('[data-poster="scrub"]').click();
  await expect(page.locator('#project-title')).toBeVisible({ timeout: 300 });
});
```

- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement with one GSAP timeline per direction. Animate `transform` and `clip-path` only.
- [ ] **Step 4:** Run the full check set, including Task 5's tests. Expected: PASS.
- [ ] **Step 5:** Commit: `Add poster to page transition`.

---

### Task 7: Wall surface, light and depth

**Files:**
- Create: `app/wall/Light.tsx`, `app/wall/useDepth.ts`, `public/textures/wall.webp`, `public/textures/paper.webp`
- Modify: `app/wall/Wall.tsx`, `app/wall/Wall.module.css`, `app/wall/Poster.module.css`
- Test: `tests/e2e/surface.spec.ts`

**Interfaces:**
- Produces: `useDepth(ref: RefObject<HTMLElement>): void` sets `--view-x` and `--view-y` (−1 to 1) on the wall from pointer position, eased, only when `finePointer()` is true and motion is allowed. Each poster reads a fixed `--z` (0 to 40px) from its index.
- Produces: `<Light />` renders a `<canvas data-light aria-hidden>` behind the posters using OGL. It draws two fixed sources: monitor light from the bottom edge and one lamp from the upper left. It mounts only when WebGL2 is available, the viewport is 900px or wider, and `navigator.hardwareConcurrency >= 4`. On `webglcontextlost` it removes itself. Without it, the wall shows the static texture and CSS poster shadows.
- Wall tilt is at most 4 degrees on each axis.

- [ ] **Step 1:** Write `tests/e2e/surface.spec.ts`: with WebGL disabled (`launchOptions.args: ['--disable-gpu', '--disable-webgl']`), ten posters are visible and a poster opens; on `phone`, `[data-light]` has count 0 and the wall has no `transform`; moving the mouse on `desktop` changes `--view-x`; with reduced motion `--view-x` stays `0`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement. Textures are tiling images under 40 KB each. No CSS gradient is used as a backdrop.
- [ ] **Step 4:** Run the full check set. Expected: PASS.
- [ ] **Step 5:** Commit: `Add wall surface, fixed light and depth`.

---

### Task 8: Entry sequence and the cat

**Files:**
- Create: `app/wall/entry.ts`, `app/wall/Cat.tsx`, `app/wall/cat-sprite.ts`
- Modify: `app/wall/Wall.tsx`
- Test: `tests/e2e/entry.spec.ts`

**Interfaces:**
- Produces: `playEntry(wall: HTMLElement): void`. It runs once per browser session (key `wall-entry` in `sessionStorage`, wrapped in `try/catch`), lasts at most 2s, and sets `data-entered` on the wall when finished. A 3s timer forces the end state if the timeline has not finished. Posters are visible by default in CSS; the sequence only animates from a hidden state that it sets itself.
- Produces: `<Cat />`, a `<canvas data-cat aria-hidden>` drawing a 16×12 pixel sprite scaled ×3 with `image-rendering: pixelated`. Colours: body `#f5f1ea`, patches `#e08a3c`, tail stripes `#b9652a`, eyes `#8fae5a`, nose `#e9a3a8`. States: `walk`, `hop`, `sit`, `nudge`. It walks the top edges of the first row of posters, re-measured on resize. With reduced motion it sits still on the first poster. `nudge` rotates a poster by at most 3 degrees and it settles back within 1.2s.

- [ ] **Step 1:** Write `tests/e2e/entry.spec.ts`: after load, `[data-wall][data-entered]` appears within 3.5s and all posters have opacity 1; a second navigation to `/` in the same context shows `data-entered` within 300ms; when the page is opened in a background tab (`page.evaluate` overrides `document.hidden` and `requestAnimationFrame` is stubbed to never fire), `data-entered` still appears within 3.5s; `[data-cat]` exists and is `aria-hidden`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement both.
- [ ] **Step 4:** Run the full check set. Expected: PASS.
- [ ] **Step 5:** Commit: `Add entry sequence and the cat`.

---

### Task 9: The desk

**Files:**
- Create: `app/sections/Desk.tsx`, `app/sections/Desk.module.css`
- Modify: `app/routes/home.tsx`
- Test: `tests/e2e/desk.spec.ts`

**Interfaces:**
- Consumes: `desk` from Task 2, shaped `{ id: 'sports' | 'games' | 'anime' | 'music' | 'now' | 'cube'; object: string; title: string; body: string }[]`.
- Produces: `<section id="desk">` with one inline SVG drawing of the setup. Each object is a `<button aria-expanded aria-controls>` that opens its panel. One panel is open at a time. All panel text is in the DOM at rest, so it is readable without the drawing and without scripts.

- [ ] **Step 1:** Write `tests/e2e/desk.spec.ts`: six desk buttons exist; the sports panel lists football, cricket, badminton, F1, tennis in that order; opening `games` closes `sports`; on `phone` the panels stack in one column with no overflow; every button is reachable with Tab and opens with Enter.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement. The drawing uses the site tokens; the mouse is `var(--signal)`.
- [ ] **Step 4:** Run the full check set. Expected: PASS.
- [ ] **Step 5:** Commit: `Add the desk section`.

---

### Task 10: You and contact

**Files:**
- Create: `scripts/photo.mjs`, `app/assets/portrait.webp`, `app/sections/You.tsx`, `app/sections/You.module.css`, `app/sections/Contact.tsx`, `app/sections/Contact.module.css`
- Modify: `app/routes/home.tsx`, `.gitignore` (ignore `*.HEIC`)
- Test: `tests/e2e/you.spec.ts`

**Interfaces:**
- Consumes: `you`, `timeline` from Task 2.
- Produces: `node scripts/photo.mjs <input> [--top <0..1>]` writes `app/assets/portrait.webp` at 960×1200 (4:5), greyscale. It converts HEIC through `ffmpeg` and crops with `sharp`. The two-colour print look is applied in CSS with `mix-blend-mode` over `var(--signal)` and the paper texture.
- Produces: `<section id="you">` with the portrait, the text, the timeline as an `<ol>` in the order of spec section 8, and the quiet line. `<section id="contact">` with the email as selectable text, a "Copy" button that shows "Copied" and falls back to selecting the text, and links to GitHub and LinkedIn.

- [ ] **Step 1:** Run `node scripts/photo.mjs "D:\03_Important\IMG_5596.HEIC"`. Show the result to Pratham. **Stop until he approves the crop.**
- [ ] **Step 2:** Write `tests/e2e/you.spec.ts`: the timeline has four items and the first contains "Barclays" and "Software Engineer"; the page text contains "Mumbai", "Pune" and "9.54"; the page text does not contain a phone number (`/\+?\d[\d\s-]{8,}\d/` has no match in `#you` or `#contact`); the copy button changes its label to "Copied"; the portrait has non-empty `alt`.
- [ ] **Step 3:** Run it. Expected: FAIL.
- [ ] **Step 4:** Implement both sections.
- [ ] **Step 5:** Run the full check set. Expected: PASS.
- [ ] **Step 6:** Commit: `Add the You and contact sections`.

---

### Task 11: Scroll, polish pass and accessibility

**Files:**
- Create: `app/lib/scroll.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/responsive.spec.ts`
- Modify: `app/root.tsx`, section CSS files as the pass requires

**Interfaces:**
- Produces: `initScroll(): () => void` starts Lenis and ties it to the GSAP ticker; it returns a cleanup function. It does nothing with reduced motion or on touch devices. Lenis is stopped while a project page is open.

- [ ] **Step 1:** Write `tests/e2e/responsive.spec.ts`: for `/` and `/work/scrub` in every Playwright project, plus widths 320, 599, 600, 899, 900, 1279 and 1280: no horizontal overflow; no element inside `main` extends past the viewport; body text is at least 14px computed.
- [ ] **Step 2:** Write `tests/e2e/a11y.spec.ts` with `@axe-core/playwright`: no serious or critical violations on `/` and on one project page of each palette; a Tab walk from the top reaches every poster, every desk button and every contact link, each with a visible focus ring.
- [ ] **Step 3:** Run both. Fix every failure in CSS or markup. Any poster palette that fails contrast is corrected in its content file.
- [ ] **Step 4:** Implement `initScroll` and tie the desk and timeline reveals to scroll position. Content is visible at rest without scrolling scripts.
- [ ] **Step 5:** Run the full check set. Expected: PASS.
- [ ] **Step 6:** Commit: `Add smooth scroll and pass responsive and accessibility checks`.

---

### Task 12: Sharing, build and deploy

**Files:**
- Create: `scripts/og.mjs`, `public/og/*.png`, `public/favicon.svg`, `public/robots.txt`, `public/_headers`, `README.md`
- Modify: `app/root.tsx`, `app/routes/work.tsx`, `package.json` (`build` runs `og.mjs` first)
- Test: `tests/e2e/meta.spec.ts`

**Interfaces:**
- Produces: `node scripts/og.mjs` renders one 1200×630 PNG per route from each project's palette, title and tagline, with Playwright.

- [ ] **Step 1:** Write `tests/e2e/meta.spec.ts`: every pre-rendered HTML file has a unique `<title>`, a `meta[name=description]`, `og:title`, `og:image` (a file that exists in the build output) and a canonical URL under `https://prathampanchal.dev`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the script and the meta exports. Write a short `README.md`: how to run, how to add a project (copy a folder, set `size` and `order`), how to hide one.
- [ ] **Step 4:** Run the full check set and Lighthouse on the preview build. Expected: tests PASS; performance and accessibility scores of 90 or more on mobile.
- [ ] **Step 5:** Commit: `Add share metadata and build scripts`.
- [ ] **Step 6:** **Pratham reviews all copy** on the preview build and edits `content/**`. Apply his edits and commit.
- [ ] **Step 7:** **With Pratham:** push `v1` on his instruction, create the Cloudflare Pages project from the repo (build command `npm run build`, output `build/client`), and add `prathampanchal.dev` as a custom domain. These steps need his accounts; he performs them.
- [ ] **Step 8:** Run `meta.spec.ts` and `smoke.spec.ts` against `https://prathampanchal.dev`. Expected: PASS.
