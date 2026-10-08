export const CAT_WIDTH = 16;
export const CAT_HEIGHT = 10;
export const CAT_SCALE = 3;

// W body, O orange patch, T tail stripe, E eye, N nose. The cat faces right.
const COLOURS: Record<string, string> = {
  W: '#f5f1ea',
  O: '#e08a3c',
  T: '#b9652a',
  E: '#8fae5a',
  N: '#e9a3a8',
};

const BODY = [
  '............O.O.',
  '............OOO.',
  '.T..........EWE.',
  '.O..........WNW.',
  '.T.OOOOWWWWWWW..',
  '.OOOOOOWWWWWW...',
  '..WOOWWWWWWWW...',
  '..WWWWWWWWWWW...',
];

const LEGS = [
  ['..WW.WW..WW.WW..', '..WW.WW..WW.WW..'],
  ['...WW.WW.WW.WW..', '..WW..WW..WW.WW.'],
];

const TAIL_UP = ['.T..............', '.O..............'];

export type CatFrame = 0 | 1;

/** Draws one frame. `sitting` lifts the tail and keeps the legs still. */
export function drawCat(ctx: CanvasRenderingContext2D, frame: CatFrame, sitting = false): void {
  const rows = [...BODY, ...LEGS[sitting ? 0 : frame]];
  if (sitting && frame === 1) rows.splice(0, 2, ...TAIL_UP.map((tail, i) => tail.slice(0, 2) + BODY[i].slice(2)));
  ctx.clearRect(0, 0, CAT_WIDTH, CAT_HEIGHT);
  rows.forEach((row, y) => {
    for (let x = 0; x < CAT_WIDTH; x++) {
      const colour = COLOURS[row[x]];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}
