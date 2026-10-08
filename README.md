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
3. Set `size` to `poster` (large) or `postcard` (small), and `order` to place it on the wall.
4. Pick the art with `art.template`: `frames`, `grid`, `bars`, `code`, `device`, `waves`, `type` or `hex`.
5. Run `npm run og` to make its preview image.

The wall lays itself out. Empty frames fill the gaps.

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
