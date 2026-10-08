# Portfolio: The Wall — Design Spec

- **Date:** 2026-10-08
- **Owner:** Pratham Panchal
- **Domain:** prathampanchal.dev
- **Status:** Design approved in conversation. This document is awaiting written review.

## 1. Purpose

A personal portfolio for Pratham Panchal that is recognisably his and could not be mistaken for a template.

- **Audience:** developers and friends first. Recruiters second; a separate plain page for them is out of scope for version 1.
- **Success:** a visitor remembers the site, understands what Pratham builds and why, and can reach any project in one click from the home page.
- **Thesis line (his own words):** "Most of my code exists because a tool almost did what I needed."

## 2. Concept

The site is his real poster wall. His interests are not blended into one style. Each project is a poster with its own art style, hung in a strict grid around one centre piece. A poster comes off the wall and becomes that project's page.

Two looks, with a fixed boundary between them:

- **The wall** (home): posters, light, depth, a cat.
- **Match day** (inside a poster): a sports-broadcast layout for the project's facts.

### Rules that apply everywhere

1. Dark only. There is no light theme.
2. No decorative colour gradients behind content, and no glow attached to the cursor.
3. Original art only. No photographs of athletes and no franchise artwork.
4. Copy is plain, first person, and not boastful. Numbers appear only where they explain something.
5. Barclays is named by title and company only.
6. Never shown: phone number, body measurements, plans for further study.
7. The cat is never named outside the Prats-Deck project page.

## 3. Site structure

One page that scrolls, plus one route per project.

| Order | Section | Route |
| --- | --- | --- |
| 1 | The wall | `/` |
| 2 | The desk | `/#desk` |
| 3 | You | `/#you` |
| 4 | Contact | `/#contact` |
| — | Project page | `/work/<slug>` |

A project route opens over the wall. The wall stays mounted behind it, so the poster can return to its place. Loading `/work/<slug>` directly shows the project page with the wall behind it, and Back leads to `/`.

## 4. The wall

### 4.1 Contents at launch

| Size | Projects |
| --- | --- |
| Centre piece | The word **ALMOST** across three panels, with the thesis line and the name beneath it |
| Poster (large) | Scrub, Neat, Prats-Deck, OmniCompiler (includes the paper), FloatChat, iDEA Hackathon |
| Postcard (small) | Chronicle, Algomotion, MalShield, Local LLM lab |
| Empty frame | One or two, generated to complete the grid |

Not on the wall: Git simulator, StreamLined, Symbiote, JobFinder, AlumNet, college coursework repos.

### 4.2 Surface and light

- A painted wall with fine texture. No gradient backdrop.
- Each poster has a contact shadow and a small fixed rotation, as if pinned by hand.
- Light comes from fixed sources: the monitors below the wall and one lamp. Light positions do not follow the cursor.
- The cursor shifts the viewpoint slightly. Posters sit at different depths and move in parallax.

### 4.3 Posters

- Each poster has its own palette and one short looping animation that shows what the project does (for example: Scrub drags trim handles across frames; OmniCompiler steps a breakpoint through code).
- Hover or keyboard focus lifts the poster and straightens it.
- Activating a poster starts the transition in 6.1.

### 4.4 The cat

- Pixel sprite: white body, orange patches on the back and over the head and ears, white stripe down the face, green eyes, pink nose, white paws, orange striped tail.
- Behaviours: walk along the top edge of posters, hop gaps, sit, and occasionally nudge a poster out of line (the poster settles back).
- Decorative only. Hidden from assistive technology. Static when motion is reduced.

### 4.5 Entry sequence

Dark room, the monitor light comes on, the posters land and settle. Under two seconds. Plays once per browser session; later visits show the wall at rest immediately.

## 5. Project page (match day)

Each page uses the poster's palette. Fixed order:

1. Name, one line on what it is, status label.
2. Why it exists: two or three sentences in Pratham's voice.
3. Three numbers that explain the project.
4. How it works, in three "sectors".
5. Screenshots or a short recording.
6. Stack, links, and for team projects, what Pratham did.

Navigation: previous and next poster without returning home; Esc or Back returns the poster to the wall.

The iDEA Hackathon page states the result as "P3, iDEA Hackathon" and gives the national scope and the prize pool (11 lakh rupees) as detail, not as a headline.

The OmniCompiler page states that a paper on the system is under review and names no venue.

## 6. Motion

One motion system for the whole site.

### 6.1 Poster to page

One continuous move: the poster lifts, the wall recedes, the poster grows to fill the viewport and becomes the page background, then the page content arrives in sequence. Closing runs the move in reverse to the poster's current position.

### 6.2 Other motion

- Smooth scrolling, with the wall, desk and timeline tied to scroll position.
- Short, fast responses on hover and press.
- `prefers-reduced-motion`: no entry sequence, no parallax, no cat movement, no peel. Posters open with a simple cut. All content stays reachable.

## 7. The desk

A drawing of his setup in the site's style, placed under the wall. Objects open small panels.

| Object | Panel |
| --- | --- |
| Vertical monitor | Sports, in this order: football, cricket, badminton, F1, tennis |
| Main monitor | Games: Valorant first; story games (Cyberpunk 2077, Spider-Man Remastered, GTA V, the Batman Arkham trilogy, F1 25, God of War, Uncharted, Resident Evil 4); co-op (Overcooked, Split Fiction, It Takes Two); first game: Counter-Strike 1.6 |
| Shelf item | Anime |
| Headset | 69k+ minutes of music in a year |
| Prats-Deck | "Right now": running local models, and swapping models between agent harnesses |
| Rubik's cube | One line, with his best time of about 45 seconds |

All panels are also reachable by keyboard and are readable as plain text without the drawing.

## 8. You

- Photo: source `D:\03_Important\IMG_5596.HEIC`. Crop from head to mid-chest, 4:5, eyes in the upper third. Treated as a two-colour print with paper grain. The original file is not committed; only the processed image is. **The final crop needs Pratham's approval before launch.**
- Short text in his voice. Includes: born and raised in Mumbai, in Pune now, Gujarati at heart.
- Timeline, newest first:
  1. Barclays — Software Engineer
  2. Colgate Global Business Services — Data Engineer intern
  3. Barclays — Technology summer intern
  4. K. J. Somaiya College of Engineering — B.Tech, Information Technology
- One quiet line: CGPA 9.54, third in the branch, honours in cyber security.

## 9. Contact

Email, GitHub, LinkedIn. The email address is shown as selectable text with a copy button. No contact form.

## 10. Visual system

- **Colour:** near-black wall with a slight warm bias; bone white for text; one signal colour taken from his orange mouse. Each poster carries its own palette; everything around the posters stays neutral.
- **Type:** three roles — a condensed display face for large words, a clean face for reading, a mono face for numbers and labels. Exact faces are chosen during the build and recorded in the token file.
- **Texture:** paper grain on posters, print marks on the photo.
- **Tokens:** all colours, type sizes, spacing and motion timings live in one token file.

## 11. Content model

Adding, removing and re-ranking projects must not need layout code changes.

Each project is one folder: `content/projects/<slug>/` containing `index.md` and its media.

Frontmatter fields:

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | |
| `slug` | string | Route segment |
| `size` | `poster` \| `postcard` | Controls wall size |
| `order` | number | Position on the wall |
| `hidden` | boolean | `true` removes it from the wall and from routes |
| `status` | string | Short label, e.g. "In daily use" |
| `tagline` | string | One line |
| `palette` | `{ bg, fg, accent }` | |
| `art` | `{ template, motif }` or `{ custom }` | See below |
| `stats` | three `{ value, label }` | |
| `sectors` | three `{ title, body }` | |
| `stack` | string list | |
| `links` | `{ repo, live?, paper? }` | |
| `role` | string, optional | For team projects |

The Markdown body holds the "why it exists" text.

**Poster art:** a small set of reusable poster templates (for example: bars, grid, waves, type-only, device, graph). A new project picks a template, a palette and a motif. A project may instead supply custom art.

**Wall layout:** computed from the visible projects, their `size` and `order`. Empty frames are generated to complete the grid, so the wall is balanced for any count from about 6 to 16.

**Other content:** the desk panels, the "You" text and the timeline each live in their own content file, not in components.

## 12. Technology

- **App:** React with Vite, written in TypeScript. Routes are pre-rendered to static files.
- **Content:** Markdown with frontmatter, validated against a schema at build time. A build fails on invalid content.
- **Motion:** GSAP. Lenis for scroll.
- **Wall rendering:** one small WebGL layer for wall light and paper. DOM posters remain the source of truth for content and accessibility.
- **Hosting:** Cloudflare Pages or Vercel, static.

Alternatives considered: Next.js (more runtime than a static site needs, and page-to-page morphs are harder); Astro (strong for content, but keeping the wall alive behind a project page is simpler in one React app).

## 13. Responsive behaviour

The site must be correct at every width, not only at named device sizes. Layout is fluid between these ranges; nothing may overflow horizontally at any width from 320px up.

| Range | Typical device | Wall |
| --- | --- | --- |
| 320–599px | Phones | Two columns, vertical scroll. Centre piece spans both columns at the top. No tilt, no depth. Peel transition kept. |
| 600–899px | Large phones, small tablets, split windows | Three columns, vertical scroll. No tilt. |
| 900–1279px | Small laptops, tablets in landscape | Full wall grid in one view, reduced gaps. Tilt and depth on for fine pointers. |
| 1280–1919px | Laptops, 1080p monitors | Reference layout. |
| 1920–2559px | Large monitors | Wall scales up to a maximum size, then gains margin. |
| 2560px and wider | 1440p, 4K, ultrawide | Wall is capped and centred. Text does not grow past its maximum size. |

Also required:

- **Short viewports** (for example 1366×768, or a browser with many toolbars): the wall fits the available height, or scrolls. It never clips.
- **Portrait monitors** (for example 1080×1920): treated by aspect ratio, not width alone. The wall uses a taller grid.
- **Input type decides hover and tilt**, not screen width. Touch devices get no hover-only content.
- **Browser zoom up to 200%** stays usable.
- Project pages, the desk, "You" and contact follow the same ranges and reflow to one column on narrow screens.

## 14. Quality

- **Fallback:** if WebGL is unavailable or the device is slow, the wall renders as flat posters and every function still works.
- **Loading:** the first view loads fast; project media loads when a poster opens.
- **Accessibility:** full keyboard use, visible focus, readable contrast inside every poster palette, text alternatives for the desk drawing, reduced-motion support.
- **Sharing:** each route has its own title, description and preview image.

## 15. Testing

End-to-end tests with Playwright, run at milestones rather than after every change:

- Open a poster, read the page, return to the wall.
- Next and previous poster.
- Direct load of a project route, then Back.
- Keyboard-only path through the wall and one project.
- Reduced motion.
- Viewports: 360×800, 768×1024, 1366×768, 1440×900, 1920×1080, 2560×1440, 1080×1920.
- Content: a hidden project does not appear and its route does not exist; adding a project folder adds a poster.

Lint, type check and build commands are defined in the implementation plan and must pass before any milestone is called done.

## 16. Out of scope for version 1

- A recruiter page.
- A blog.
- Live data from Spotify or GitHub. Numbers are fixed values in content files.
- Sound.

Each can be added later without redesign.

## 17. Open items

| Item | Owner |
| --- | --- |
| Final copy for every section. Drafts are written from Pratham's own messages; he edits them. | Pratham reviews |
| Final photo crop and treatment. | Pratham approves |
| Screenshots and recordings for project pages. These depend on the README work in each repo. | Pratham |
| Custom art versus template art for each launch poster. | Decided during the build, poster by poster |
| Hosting choice between Cloudflare Pages and Vercel. | Decided in the plan |

## 18. Repository rules

- Commits carry Pratham's git identity only. No co-author trailers and no mention of AI tools in commit messages.
- No force pushes and no rewriting of pushed history.
- No secrets in the repository.

## 19. Changes after the first build (2026-10-09)

Made on the owner's feedback after he saw the built site. Where these differ from the sections above, these apply.

- **Wall layout (replaces 4.1 empty frames and the strict grid):** posters and postcards are mixed across rows. Each piece has its own size, corner and tilt. There are no empty frames. When the wall has spare cells, some pieces hang double-wide to fill them, postcards first.
- **Poster hover (adds to 4.3):** a poster leans toward the pointer and springs back, a short rule draws in above its title, and the other posters step back.
- **Centre piece (adds to 4.1):** it is a link to the "Me" section.
- **Close (replaces part of 6.1):** Escape and the close link play the fold-down on the page itself, then go to the wall. The browser's Back button uses a plain sheet, because it cannot wait.
- **Entry sequence (replaces 4.5):** it plays on every load of the wall, on wide screens with a mouse. Phones and tablets show the wall at once.
- **Project page (adds to 5):** wider layout in two columns, with the poster's art drawn large in swapped colours beside the title.
- **Content (changes 12):** content files are parsed and checked at build time by `content.plugin.ts`. Text is plain paragraphs, with no Markdown formatting.

## 20. Second round of changes (2026-10-09)

Agreed with the owner after the first round. Where these differ from the sections above, these apply.

- **Wall, wide screens (replaces the layout in section 19):** hung in real paper sizes, like the owner's own poster wall. One A3 hero (Scrub) hangs left of the centre piece and into the next row. Seven A4 posters. Five A5 pieces at the corners, one of them outside the block on the right. Equal gaps, tilt under one degree, nothing stretched. `hero: true` in a project file marks the hero; `size: poster` is A4 and `size: postcard` is A5.
- **Personal pieces:** three A5 pieces that are not projects: a match ticket and a "right now" note (both lead to the desk) and a boarding pass BOM to PNQ (leads to "Me"). Their text is in `content/site/pieces.md`.
- **Boot-up (replaces 4.5):** boot lines, a hard cut to the word on the centre piece, a pull back to the whole wall, then the sheets are dealt onto it with a small knock for each. Any key or click skips it. Wide screens with a mouse only.
- **Calm wall:** with a mouse, poster art holds still and plays only on the sheet under the pointer or focus. On touch screens it keeps moving.
- **The cat** walks to the sheet under the pointer and sits there.
- **Scroll:** as the wall scrolls away it tips back, and the desk tips up into view.
- **The desk (replaces 7):** drawn from the owner's real setup. Seven objects open seven cards, each with its own design: scoreboard, game launcher, manga panels, minutes counter, spec sheet, stopwatch, terminal. A wall clock shows the time in Pune. A switch changes the room light from white to purple. Text is in `content/site/desk.md`.
- **Project pages:** each has one small working part of its own (`app/project/Demo.tsx`). Numbers in the Local LLM lab part are real. The FloatChat, iDEA, Chronicle, MalShield and Prats-Deck parts use labelled sample data.
- **Text rules from the owner:** collaborative projects are presented as his, with no split of who did what. No accuracy figure for the iDEA project. No mention of how far a team went, except the iDEA 3rd prize. The paper is "submitted, under review" and nothing more.
