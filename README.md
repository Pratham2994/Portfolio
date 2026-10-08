# Portfolio

The site at [prathampanchal.dev](https://prathampanchal.dev). A wall of posters, one per project.

## Run it

```bash
npm install
npm run dev
```

Needs Node 20 or newer.

## Add a project

1. Copy a folder in `content/projects/`, for example `scrub`, and rename it. The folder name is the address: `content/projects/my-tool` becomes `/work/my-tool`.
2. Edit `index.md`. The top block holds the title, colours, three numbers and three "sectors". The text under it is the "why".
3. Set `size` to `poster` (A4 on the wall) or `postcard` (A5, at a corner), and `order` for the previous and next links. One project may have `hero: true`: it is the single A3 poster.
4. Pick the art with `art.template`: `frames`, `grid`, `bars`, `code`, `device`, `waves`, `type` or `hex`.
5. Run `npm run og` to make its preview image.

The wall lays itself out. The first three rows hold one hero, seven posters and five small pieces. More than that adds a row.

## Other text

- `content/site/desk.md`: the cards on the desk.
- `content/site/pieces.md`: the boarding pass, the match ticket and the note on the wall.
- `content/site/you.md` and `timeline.md`: the "Me" section.

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

Static files. Build command `npm run build`, output folder `build/client`.
