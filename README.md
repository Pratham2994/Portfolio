# Portfolio

The site at [prathampanchal.dev](https://prathampanchal.dev). A wall of posters, one per project. Each project page has a demo you can press and a picture of how it works underneath. There is also a plain one-page version at [/brief](https://prathampanchal.dev/brief).

## Run it

```bash
npm install
npm run dev
```

Needs Node 20 or newer.

## Add a project

1. Copy a folder in `content/projects/`, for example `scrub`, and rename it. The folder name is the address: `content/projects/my-tool` becomes `/work/my-tool`.
2. Edit `index.md`. The top block holds the title, colours, three numbers and three "sectors". The text under it is the "why".
3. Set `size` to `poster` or `postcard`, and `order` for the previous and next links. On the wide wall both hang as A4 sheets. On a phone a postcard is a smaller, wide card. One project may have `hero: true`: it is the single A3 poster.
4. Pick the art with `art.template`: `frames`, `grid`, `bars`, `code`, `device`, `waves`, `type` or `hex`.
5. Optional lines in the top block:
   - `summary`: one formal sentence. The one-page version uses it in place of the tagline.
   - `links.live`: the address of a deployed copy. It adds an "Open it live" link.
   - `flow`: the boxes and links of the "Under the hood" picture. Copy one from another project. A name holds 16 letters and a note holds 50.
6. A demo is a function in `app/project/Demo.tsx`, listed in `DEMOS` under the folder name. A project with no entry has no demo.
7. Run `npm run og` to make its preview image.

The wall lays itself out. The first three rows hold one hero, nine A4 sheets and three small pieces. More than that adds a row.

## Other text

- `content/site/desk.md`: the cards on the desk.
- `content/site/pieces.md`: the boarding pass, the match ticket and the note on the wall.
- `content/site/you.md` and `timeline.md`: the "Me" section. The one-page version at `/brief` reads the same two files and the project files, so it has no text of its own to keep up to date.

Text is plain paragraphs. Leave a blank line between them.

## Hide or remove a project

Add `hidden: true` to its `index.md`, or delete the folder.

## Checks

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
```

The first `test:e2e` run needs `npx playwright install chromium`.

## Other scripts

- `npm run og` makes the link preview images in `public/og`.
- `node scripts/photo.mjs <photo>` crops the portrait.
- `node scripts/textures.mjs` makes the grain textures.

## Deploy

Cloudflare Workers, static assets. Build command `npm run build`, deploy command `npx wrangler deploy`. The settings are in `wrangler.jsonc`.
