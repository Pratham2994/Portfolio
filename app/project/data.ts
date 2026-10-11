/** The facts the demos and the stages on the project pages both show. Kept in one place, so they agree. */

// The home page of the deck, in the order of its icons: five across, three down.
// Each one opens a picture of that app, taken in the simulator.
export const DECK: [name: string, about: string, picture: string][] = [
  ['Chindi', 'A pet cat. She gets hungry, sleepy and bored, and she wants attention.', 'chindi'],
  ['Galaxy', 'Glowing dots that follow the stylus. Only for fun.', 'galaxy'],
  ['Macros', 'Buttons that control the PC. The deck is a USB keyboard, so the PC needs no software.', 'macros-song'],
  ['Monitor', 'How hard the PC works: processor, memory, graphics card, heat and network.', 'monitor'],
  ['Clock', 'A clock set from the internet, with three days of weather.', 'clock'],
  ['Wi-Fi', 'The networks near you, how strong each one is, and the best channel for your router.', 'wifi'],
  ['Scope', 'An oscilloscope. It draws the signal on one of the pins.', 'scope'],
  ['Guide', 'It explains each app, on the device itself.', 'guide'],
  ['Paint', 'Paint with light. Lines that cross get brighter.', 'paint'],
  ['Bricks', 'Hit the ball, break the bricks. Three lives.', 'bricks'],
  ['Life', 'The Game of Life. Draw on it to add living dots.', 'life'],
  ['Snake', 'The classic. Tap beside its head to turn it.', 'snake'],
  ['2048', 'Slide the tiles. Two of the same number join.', '2048'],
  ['Trackpad', 'The screen is a mouse pad. The deck is a USB mouse too.', 'trackpad'],
  ['Settings', 'Brightness, touch calibration, and the tear-free switch.', 'settings'],
];

// One small program, the same in five languages, line for line: a function, a loop that calls it, a print.
export const CODE: Record<string, string[]> = {
  Python: ['def area(w, h):', '    return w * h', 'total = 0', 'for size in [2, 3, 4]:', '    total += area(size, size)', 'print(total)'],
  JavaScript: ['function area(w, h) {', '  return w * h; }', 'let total = 0;', 'for (const size of [2, 3, 4]) {', '  total += area(size, size); }', 'console.log(total);'],
  Java: ['static int area(int w, int h) {', '  return w * h; }', 'int total = 0;', 'for (int size : new int[]{2, 3, 4}) {', '  total += area(size, size); }', 'System.out.println(total);'],
  'C++': ['int area(int w, int h) {', '  return w * h; }', 'int total = 0;', 'for (int size : {2, 3, 4}) {', '  total += area(size, size); }', 'std::cout << total;'],
  Go: ['func area(w, h int) int {', '  return w * h }', 'total := 0', 'for _, size := range []int{2, 3, 4} {', '  total += area(size, size) }', 'fmt.Println(total)'],
};

// The same run in every language: the line the debugger is on, how deep it is, and what it can see there.
export type Frame = { line: number; deep: 0 | 1; seen: [name: string, value: string][] };
const main = (line: number, total: string, size: string): Frame => ({ line, deep: 0, seen: [['total', total], ['size', size]] });
const inside = (side: string): Frame => ({ line: 1, deep: 1, seen: [['w', side], ['h', side]] });
export const RUN: Frame[] = [
  main(2, '-', '-'),
  main(3, '0', '-'),
  main(4, '0', '2'),
  inside('2'),
  main(3, '4', '2'),
  main(4, '4', '3'),
  inside('3'),
  main(3, '13', '3'),
  main(4, '13', '4'),
  inside('4'),
  main(3, '29', '4'),
  main(5, '29', '4'),
];

// The debugger each language really runs on. The page never shows these: that is the point.
export const NATIVE: Record<string, string> = { Python: 'bdb', JavaScript: 'Node Inspector', Java: 'jdb', 'C++': 'gdb', Go: 'Delve' };

// From my own report: 4,101 runs on an RTX 5070. Each model did 33 checked tasks, 5 times each.
export const MODELS = [
  { name: 'Gemma 4 12B coder', pass: 79, right: 131, perHour: 1588 },
  { name: 'Gemma 4 12B', pass: 87, right: 143, perHour: 1519 },
  { name: 'Gemma 4 E4B', pass: 70, right: 115, perHour: 1357 },
  { name: 'Gemma 4 26B', pass: 93, right: 154, perHour: 808 },
  { name: 'GPT-OSS 20B', pass: 81, right: 134, perHour: 792 },
];
