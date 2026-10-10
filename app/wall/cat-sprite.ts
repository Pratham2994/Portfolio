export const CAT_WIDTH = 20;
export const CAT_HEIGHT = 14;
export const CAT_SCALE = 3;

// W white coat, O orange patch, T darker stripe, E eye, N nose, P inside of the ear, C a closed eye.
// The cat faces right.
const COLOURS: Record<string, string> = {
  W: '#f5f1ea',
  O: '#e08a3c',
  T: '#b9652a',
  E: '#23262f',
  N: '#e9a3a8',
  P: '#e9a3a8',
  C: '#8d877c',
};

// On four legs: the tail stands up behind, the head is a little higher than the back.
const BODY = [
  '.............O...O..',
  '..T..........OP.PO..',
  '.O...........OOOWWW.',
  '.T...........OWEWEW.',
  '.O...........WWWWNW.',
  '..O.OOOOWWWWWWWWWW..',
  '..TOOOOOOWWWWWWWW...',
  '...OOOOOWWWWWOOWW...',
  '...WOOOWWWWWWOOW....',
  '...WWWWWWWWWWWWW....',
];

// The same, with the tail down a little. The walk swaps the two, so the tail sways.
const TAIL_LOW = ['...', '...', '.T.', '.O.', '.T.', '..O'];

// Four steps of the walk. The legs on one side pass each other, as a cat's do.
const LEGS = [
  ['....WW.WW...WW.WW...', '....WW.WW...WW.WW...', '....WW.WW...WW.WW...'],
  ['...WW..WW..WW...WW..', '..WW....WW.WW....WW.', '..WW....WWWW.....WW.'],
  ['....WW.WW...WW.WW...', '....WW.WW...WW.WW...', '.....WWW.....WWW....'],
  ['....WW.WW...WW..WW..', '...WW...WW.WW....WW.', '..WW....WWWW.....WW.'],
];

// In the air: the front legs reach, the back legs trail, the tail is out straight.
const JUMP = [
  '..............O...O.',
  '..............OP.PO.',
  '..............OOOWWW',
  '..............OWEWEW',
  'TOT...........WWWWNW',
  '...OOOOOOWWWWWWWWWW.',
  '...OOOOOOWWWWWWWW...',
  '...OOOOOWWWWWOOWWW..',
  '..WWOOOWWWWWWOOWWWW.',
  '.WWWWWWWWWWWWW..WWWW',
  'WWW...............WW',
  'WW..................',
];

// Sitting up, front paws together, tail along the ground.
const SIT = [
  '.........O...O......',
  '.........OP.PO......',
  '.........OOOWWW.....',
  '.........OWEWEW.....',
  '.........WWWWNW.....',
  '..........WWWW......',
  '.........OWWWWW.....',
  '........OOOWWWW.....',
  '.......OOOOWWWW.....',
  '.......OOOWWWWW.....',
  '......WOOWWWWWW.....',
  '......WWWWWW.WW.....',
  '..TOTOWWWWWW.WW.....',
];

// Asleep in a loaf: legs under, head down, tail round the front.
const SLEEP = [
  '.............O...O..',
  '.....OOOOOO..OP.PO..',
  '...OOOOOOWWWWOOOWWW.',
  '..OOOOOWWWWWWWCWCWW.',
  '..WOOOWWWWWWWWWWNW..',
  '..WWWWWWWWWWTOTOTO..',
];

const ROWS = (pose: string[]) => [...Array<string>(CAT_HEIGHT - pose.length).fill('.'.repeat(CAT_WIDTH)), ...pose];
const swap = (rows: string[], over: string[]) => rows.map((row, y) => (over[y] ? over[y] + row.slice(over[y].length) : row));
const blink = (rows: string[]) => rows.map((row) => row.replaceAll('E', 'C'));
// The tip of the tail lifts off the ground.
const flick = (rows: string[]) => [...rows.slice(0, -2), '..T' + rows.at(-2)!.slice(3), '...' + rows.at(-1)!.slice(3)];
// A breath in: the back is one row higher.
const breathe = (rows: string[]) => [rows[0].slice(0, 6) + 'OOOO' + rows[0].slice(10), ...rows.slice(1)];

const walk = (legs: string[], low: boolean) => ROWS([...(low ? swap(BODY, TAIL_LOW) : BODY), ...legs]);

/** Each pose is a short loop of frames. */
export const CAT = {
  walk: [walk(LEGS[0], false), walk(LEGS[1], false), walk(LEGS[2], true), walk(LEGS[3], true)],
  sit: [ROWS(SIT), ROWS(SIT), ROWS(flick(SIT)), ROWS(SIT), ROWS(SIT), ROWS(blink(SIT)), ROWS(SIT), ROWS(flick(SIT))],
  jump: [ROWS(JUMP)],
  sleep: [ROWS(SLEEP), ROWS(breathe(SLEEP))],
} satisfies Record<string, string[][]>;

export type CatPose = keyof typeof CAT;

/** Draws one frame of a pose. The frame number wraps, so a caller can only count up. */
export function drawCat(ctx: CanvasRenderingContext2D, pose: CatPose, frame = 0): void {
  const frames = CAT[pose];
  ctx.clearRect(0, 0, CAT_WIDTH, CAT_HEIGHT);
  frames[frame % frames.length].forEach((row, y) => {
    for (let x = 0; x < CAT_WIDTH; x++) {
      const colour = COLOURS[row[x]];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}
