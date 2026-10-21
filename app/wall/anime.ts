import gsap from 'gsap';

import { centreOf, hit, pick, type Point, type Scene, type Timeline } from './play-kit';

/** The anime secrets. Each is one famous moment of its show, played on the wall. */
export type AnimePlay =
  | 'jajanken'
  | 'alchemy'
  | 'mob'
  | 'rezero'
  | 'bakuman'
  | 'water'
  | 'kamehameha'
  | 'kira'
  | 'gearfive'
  | 'rasengan'
  | 'purple'
  | 'arise';

const far = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** The middle of the board, or of the wall when there is no board. */
function middleOf(wall: HTMLElement, box: DOMRect): Point {
  const board = wall.querySelector('[data-centre]');
  return board ? centreOf(board) : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/** Posters that are fully on the screen, clear of the bars at the top and the bottom. */
function inView(sheets: HTMLElement[]): HTMLElement[] {
  const shown = sheets.filter((sheet) => {
    const box = sheet.getBoundingClientRect();
    return 'poster' in sheet.dataset && box.top > window.innerHeight * 0.08 && box.bottom < window.innerHeight * 0.92;
  });
  return shown.length ? shown : sheets;
}

/** Hunter x Hunter: Gon's Jajanken. The aura builds while he calls it, and then: rock. */
function jajanken({ wall, box, prop, say, shout, impact }: Scene, timeline: Timeline) {
  const target = middleOf(wall, box);
  const aura = prop('sport-aura', box.left + box.width * 0.12, target.y + 40);
  // Rock: a fist in the middle of the aura, side on, knuckles forward.
  aura.innerHTML = `<svg viewBox="0 0 60 50"><path d="M8 14 C8 8 14 6 18 8 C20 4 26 3 29 6 C32 3 38 3 40 7 C43 5 49 6 50 11 C54 12 56 16 55 22 L54 34 C53 42 46 47 38 47 L22 47 C13 47 7 41 7 33 Z" fill="#f2c9a0" stroke="#5a3a1a" stroke-width="2"/><path d="M18 8 V20 M29 6 V20 M40 7 V20" stroke="#5a3a1a" stroke-width="2" fill="none"/><path d="M8 26 C14 22 22 24 24 30" stroke="#5a3a1a" stroke-width="2" fill="none"/></svg>`;
  timeline
    .call(() => say('Saisho wa guu…'), undefined, 0.2)
    .fromTo(aura, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.3)
    .call(() => say('Jan… ken…'), undefined, 1)
    .to(aura, { scale: 1.8, duration: 1, ease: 'power2.in' }, 0.9)
    .to(aura, { x: target.x, y: target.y, duration: 0.35, ease: 'power3.in' }, 1.95)
    .to(aura, { scale: 3.2, opacity: 0, duration: 0.35, ease: 'power2.out' }, 2.3)
    .call(() => say(''), undefined, 2.3);
  hit(timeline, wall, wall.querySelector('[data-centre]'), 2.3);
  impact(timeline, 2.3, target);
  shout(timeline, 2.35, 'Guu!', pick('jajanken', ['Jajanken. Rock.', 'First comes rock.', 'Rock. Every time.']));
}

// A transmutation circle: two rings, a star of two triangles, a small ring at the heart.
const CIRCLE = `<svg viewBox="-110 -110 220 220">
  <circle r="102"/><circle r="90"/><circle r="38"/>
  <path d="M0 -90 L77.9 45 L-77.9 45 Z"/><path d="M0 90 L-77.9 -45 L77.9 -45 Z"/>
  <path d="M-38 0 H38 M0 -38 V38"/>
</svg>`;

/** Fullmetal Alchemist: a circle draws itself, hands clap, and two sheets trade places. */
function alchemy({ wall, sheets, box, prop, say, shout, impact }: Scene, timeline: Timeline) {
  const middle = middleOf(wall, box);
  const circle = prop('sport-circle', middle.x, middle.y);
  circle.innerHTML = CIRCLE;
  const lines = circle.querySelectorAll('circle, path');
  // Two sheets, as far apart as the screen allows.
  const pool = inView(sheets);
  const one = pick('alchemy', pool);
  const other = pool.filter((sheet) => sheet !== one).sort((a, b) => far(centreOf(b), centreOf(one)) - far(centreOf(a), centreOf(one)))[0] ?? one;
  const a = centreOf(one);
  const b = centreOf(other);
  timeline
    .call(() => say('Hands together.'), undefined, 0.2)
    .fromTo(lines, { strokeDashoffset: 700 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.06 }, 0.3)
    .call(() => say('Clap.'), undefined, 1.35)
    .fromTo(circle, { opacity: 1, scale: 1 }, { scale: 1.08, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 }, 1.4)
    // The exchange: each goes where the other was.
    .to(one, { x: b.x - a.x, y: b.y - a.y, duration: 0.9, ease: 'power3.inOut' }, 1.6)
    .to(other, { x: a.x - b.x, y: a.y - b.y, duration: 0.9, ease: 'power3.inOut' }, 1.6)
    .to(circle, { opacity: 0, scale: 1.25, duration: 0.6, ease: 'power2.in' }, 2.7)
    .call(() => say(''), undefined, 2.7)
    // And back, before the wall is left as it was.
    .to([one, other], { x: 0, y: 0, duration: 0.9, ease: 'power3.inOut' }, 4.3);
  impact(timeline, 1.45, middle);
  shout(timeline, 2.1, 'Alchemy', 'To gain something, something of equal value must be lost.');
}

/** Mob Psycho 100: his meter climbs, the sheets start to float, and at 100% everything goes. */
function mob({ sheets, box, prop, say, shout }: Scene, timeline: Timeline) {
  const meter = prop('sport-meter', box.left + box.width / 2, box.top + 70);
  // GSAP places it, so GSAP centres it too: a CSS translate would be replaced by its transform.
  gsap.set(meter, { xPercent: -50 });
  const count = { value: 0 };
  timeline
    .call(() => say('Mob is at 10%.'), undefined, 0.2)
    .to(count, { value: 100, duration: 2.3, ease: 'power2.in', onUpdate: () => void (meter.textContent = `${Math.round(count.value)}%`) }, 0.3)
    .call(() => say('50%.'), undefined, 1.6)
    .call(() => void (meter.dataset.full = ''), undefined, 2.6)
    .call(() => void (meter.textContent = '???%'), undefined, 3.2)
    .call(() => say(''), undefined, 2.6);
  // The sheets lift off the wall, slowly, each its own way, then all fall back at once.
  sheets.forEach((sheet, i) => {
    const lift = gsap.utils.random(24, 70);
    timeline
      .to(sheet, { y: -lift, duration: 2.1, ease: 'sine.inOut' }, 0.6 + i * 0.04)
      .to(sheet, { y: -lift - 40, duration: 0.5, ease: 'power2.out' }, 2.6)
      .to(sheet, { y: 0, duration: 0.7, ease: 'bounce.out' }, 4.2 + i * 0.02);
  });
  timeline.call(() => void prop('sport-psychic', 0, 0), undefined, 2.6);
  shout(timeline, 2.65, '100%', pick('mob', ['Mob has reached 100%.', 'Emotion: overflowing.', '???%']));
}

// A clock face for the rewind: the ring, twelve marks, and two hands.
const CLOCK = `<svg viewBox="-60 -60 120 120">
  <circle r="54"/>
  ${Array.from({ length: 12 }, (_, i) => `<path d="M0 -50 V-42" transform="rotate(${i * 30})"/>`).join('')}
  <path class="hour" d="M0 0 V-24"/><path class="minute" d="M0 0 V-40"/>
</svg>`;

/** Re:Zero: something goes wrong, the screen goes dark, and the wall rewinds to before it. */
function rezero({ sheets, box, prop, say, shout }: Scene, timeline: Timeline) {
  const shade = prop('sport-witch', 0, 0);
  const clock = prop('sport-clock', box.left + box.width / 2, window.innerHeight / 2);
  clock.innerHTML = CLOCK;
  // It goes wrong: every sheet is knocked out of its place.
  sheets.forEach((sheet, i) => {
    timeline.to(sheet, { x: gsap.utils.random(-50, 50), y: gsap.utils.random(-40, 40), duration: 0.45, ease: 'power2.out' }, 0.3 + i * 0.02);
  });
  timeline
    .call(() => say('Something went wrong.'), undefined, 0.2)
    .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.in' }, 1)
    .call(() => say('Return by death.'), undefined, 1.3)
    .fromTo(clock, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }, 1.3)
    .to(clock.querySelector('.minute'), { rotation: -1080, svgOrigin: '0 0', duration: 1.4, ease: 'power1.inOut' }, 1.5)
    .to(clock.querySelector('.hour'), { rotation: -90, svgOrigin: '0 0', duration: 1.4, ease: 'power1.inOut' }, 1.5)
    // Back, in jumps, like a tape that rewinds.
    .to(sheets, { x: 0, y: 0, duration: 1.2, ease: 'steps(8)' }, 1.6)
    .to([clock, shade], { opacity: 0, duration: 0.5, ease: 'power2.out' }, 3)
    .call(() => say(''), undefined, 3);
  shout(timeline, 3.1, 'Return by Death', pick('rezero', ['Back to the last save point.', 'From zero, again.', 'Nobody remembers but him.']));
}

/** Bakuman: the wall becomes a page of a manga, with its dots and its speech bubbles. */
function bakuman({ wall, sheets, prop, say, shout }: Scene, timeline: Timeline) {
  const grid = wall.querySelector<HTMLElement>(':scope > div')!;
  const tone = prop('sport-tone', 0, 0);
  const pool = inView(sheets).slice().sort((a, b) => centreOf(a).x - centreOf(b).x);
  const three = [pool[0], pool[Math.floor(pool.length / 2)], pool[pool.length - 1]].filter((sheet, i, all) => sheet && all.indexOf(sheet) === i);
  const lines = pick('bakuman', [
    ['Is this good enough?', 'One more page.', 'The deadline is tonight!'],
    ['Draw it again.', 'This panel is the one.', 'We are getting an anime!'],
  ]);
  timeline
    .call(() => say('Chapter one. Due tomorrow.'), undefined, 0.2)
    .to(grid, { filter: 'grayscale(1) contrast(1.7) brightness(1.05)', duration: 0.6, ease: 'power2.out' }, 0.4)
    .fromTo(tone, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.4);
  three.forEach((sheet, i) => {
    const box = sheet.getBoundingClientRect();
    const bubble = prop('sport-bubble', box.left + box.width * 0.55, box.top + 6);
    gsap.set(bubble, { xPercent: -50, yPercent: -100 });
    bubble.textContent = lines[i] ?? lines[0];
    timeline.fromTo(bubble, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }, 1 + i * 0.35).to(bubble, { opacity: 0, duration: 0.3 }, 4.2);
  });
  shout(timeline, 2.4, 'Serialized', 'Ink it. Then ink the next one.');
  timeline
    .call(() => say(''), undefined, 2.4)
    .to(grid, { filter: 'grayscale(0) contrast(1) brightness(1)', duration: 0.6, ease: 'power2.inOut' }, 4.4)
    .to(tone, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 4.4);
}

// A great wave, in the old woodblock way: deep water, a lighter crest, and white foam curling.
const WAVE = `<svg viewBox="0 0 400 220">
  <path d="M0 220 V150 C30 110 60 90 100 96 C140 102 150 132 186 128 C226 124 222 70 262 38 C292 14 336 12 364 34 C380 46 392 64 400 84 V220 Z" fill="#163f86"/>
  <path d="M262 38 C292 14 336 12 364 34 C344 28 322 32 308 46 C324 38 342 40 352 52 C334 48 316 56 306 70 C318 64 330 66 338 76 C320 76 304 86 296 100 C288 80 276 58 262 38 Z" fill="#f4f7ff"/>
  <g fill="#f4f7ff">
    <circle cx="340" cy="22" r="3"/><circle cx="356" cy="14" r="2.4"/><circle cx="372" cy="24" r="2"/><circle cx="328" cy="10" r="1.8"/><circle cx="384" cy="36" r="1.6"/><circle cx="350" cy="4" r="1.4"/>
  </g>
  <path d="M0 220 V172 C40 140 80 132 120 142 C170 154 200 176 250 160 C300 144 330 120 370 130 C384 134 394 140 400 146 V220 Z" fill="#2a68c4"/>
  <path d="M0 220 V196 C50 178 100 176 150 186 C200 196 250 204 300 190 C340 180 372 176 400 182 V220 Z" fill="#4b8fe0"/>
  <path d="M100 96 C118 92 134 100 140 114 C128 106 116 108 108 118" fill="none" stroke="#f4f7ff" stroke-width="4" stroke-linecap="round"/>
  <path d="M120 142 C134 138 148 144 152 156" fill="none" stroke="#dbe8ff" stroke-width="3" stroke-linecap="round"/>
</svg>`;

/** Demon Slayer: Water Breathing. A great wave crosses the wall, and a sword cuts through it. */
function water({ wall, box, prop, say, shout, impact }: Scene, timeline: Timeline) {
  const middle = middleOf(wall, box);
  const wave = prop('sport-wave', 0, window.innerHeight * 0.32);
  wave.innerHTML = WAVE;
  const reach = wave.getBoundingClientRect().width || window.innerWidth;
  const slash = prop('sport-slash', middle.x, middle.y);
  slash.innerHTML = '<svg viewBox="0 0 400 140"><path d="M10 120 C120 20 280 10 390 60"/></svg>';
  timeline
    .call(() => say('Total concentration breathing.'), undefined, 0.2)
    // From just off the left edge to past the right one: the crest crosses the middle as the sword cuts.
    .fromTo(wave, { x: -reach }, { x: window.innerWidth + 40, duration: 1.5, ease: 'none' }, 0.4)
    .fromTo(slash.querySelector('path'), { strokeDashoffset: 520 }, { strokeDashoffset: 0, duration: 0.22, ease: 'power3.out' }, 1.25)
    .to(slash, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 1.8)
    .call(() => say(''), undefined, 1.3);
  impact(timeline, 1.3, middle);
  shout(timeline, 1.6, 'Water Breathing', pick('water', ['First form. Water Surface Slash.', 'Eleventh form. Dead Calm.', 'Tenth form. Constant Flux.']));
}

/** Dragon Ball Z: Kamehameha. It charges while he says it, and the beam crosses the wall. */
function kamehameha({ wall, sheets, box, prop, say, shout, impact }: Scene, timeline: Timeline) {
  const middle = middleOf(wall, box);
  const from = { x: box.left + 50, y: middle.y };
  const ki = prop('sport-ki', from.x, from.y);
  const beam = prop('sport-beam', from.x, from.y);
  beam.style.width = `${window.innerWidth - from.x + 200}px`;
  ['Ka…', 'Ka… me…', 'Ka… me… ha…', 'Ka… me… ha… me…'].forEach((line, i) => timeline.call(() => say(line), undefined, 0.2 + i * 0.4));
  timeline
    .fromTo(ki, { scale: 0.2, opacity: 0 }, { scale: 1.4, opacity: 1, duration: 1.6, ease: 'power1.in' }, 0.2)
    .call(() => say('HA!'), undefined, 1.9)
    .fromTo(beam, { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: 'power3.out' }, 1.9)
    .to(beam, { scaleY: 0.05, opacity: 0, duration: 0.6, ease: 'power2.in' }, 2.7)
    .to(ki, { opacity: 0, scale: 0.5, duration: 0.4, ease: 'power2.in' }, 2.7)
    .call(() => say(''), undefined, 2.8);
  // Every sheet in its way is pushed back as the beam goes past.
  for (const sheet of sheets) {
    const at = centreOf(sheet);
    if (Math.abs(at.y - from.y) > 190) continue;
    timeline.to(sheet, { x: 70, rotation: '+=6', duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1 }, 1.92 + (at.x - from.x) / 4500);
  }
  impact(timeline, 2, middle);
  shout(timeline, 2.9, 'Kamehameha', pick('kamehameha', ['Ka. Me. Ha. Me. Ha.', 'Over nine thousand. Probably.', 'Full power.']));
}

/** Death Note: a poster's name is written in the notebook, and forty seconds later it falls. */
function kira({ sheets, prop, say, shout }: Scene, timeline: Timeline) {
  const victim = pick('kira', inView(sheets));
  const name = victim.querySelector('strong')?.textContent?.trim() || 'This poster';
  const note = prop('sport-note', window.innerWidth / 2, window.innerHeight + 200);
  note.innerHTML = '<b>DEATH NOTE</b><p></p>';
  const page = note.querySelector('p')!;
  const written = 0.9 + name.length * 0.08;
  const falls = written + 2.2;
  timeline.to(note, { y: window.innerHeight * 0.74, duration: 0.6, ease: 'power3.out' }, 0.2);
  [...name].forEach((_, i) => timeline.call(() => void (page.textContent = name.slice(0, i + 1)), undefined, 0.9 + i * 0.08));
  timeline
    .call(() => say('Forty seconds. Or four.'), undefined, written + 0.15)
    .call(() => say('3'), undefined, written + 0.9)
    .call(() => say('2'), undefined, written + 1.3)
    .call(() => say('1'), undefined, written + 1.7)
    .call(() => say(''), undefined, falls)
    .to(note, { y: window.innerHeight + 200, duration: 0.5, ease: 'power2.in' }, falls)
    // A heart attack: it drops off the wall.
    .to(victim, { y: window.innerHeight, rotation: '+=28', duration: 0.9, ease: 'power2.in' }, falls)
    .to(victim, { y: 0, rotation: '-=28', duration: 0.9, ease: 'power3.out' }, falls + 2.9);
  shout(timeline, falls + 0.6, 'Kira', pick('kira', ['Just as planned.', 'I am justice.', 'I will take a potato chip, and eat it.']));
}

/** One Piece: Gear Five. The drums of liberation, and the whole wall turns to rubber. */
function gearfive({ wall, sheets, box, prop, say, shout }: Scene, timeline: Timeline) {
  const middle = middleOf(wall, box);
  ['Don.', 'Don don.', 'Don don don.'].forEach((line, i) => {
    timeline.call(() => say(line), undefined, 0.2 + i * 0.4).call(() => void prop('sport-ring', middle.x, middle.y).classList.add('sport-ring-white'), undefined, 0.2 + i * 0.4);
  });
  const flash = prop('sport-splash', 0, 0);
  timeline.fromTo(flash, { opacity: 0 }, { keyframes: [{ opacity: 0.9, duration: 0.06 }, { opacity: 0, duration: 0.6, ease: 'power2.out' }] }, 1.3).call(() => say(''), undefined, 1.3);
  // Everything is rubber now: it squashes, stretches, jumps, and wobbles back.
  [...sheets, wall.querySelector<HTMLElement>('[data-centre]')].forEach((sheet, i) => {
    if (!sheet) return;
    const at = 1.4 + i * 0.05;
    timeline
      .to(sheet, { scaleX: 1.35, scaleY: 0.7, duration: 0.18, ease: 'power2.out' }, at)
      .to(sheet, { scaleX: 0.75, scaleY: 1.4, y: -46, duration: 0.2, ease: 'power2.inOut' }, at + 0.18)
      .to(sheet, { scaleX: 1, scaleY: 1, y: 0, duration: 1.3, ease: 'elastic.out(1.2, 0.25)' }, at + 0.38);
  });
  shout(timeline, 2, 'Gear Five', pick('gearfive', ['The drums of liberation.', 'The most ridiculous power in the world.', 'Nika.']));
}

/** Naruto: a Rasengan, spun up in one hand and driven into the nearest sheet. */
function rasengan({ wall, sheets, box, prop, say, shout, impact }: Scene, timeline: Timeline) {
  const cat = wall.querySelector('[data-cat]');
  // Where the cat is, but never at the very edge of the screen, where it would be half out of sight.
  const near = cat ? centreOf(cat) : middleOf(wall, box);
  const start = {
    x: gsap.utils.clamp(box.left + box.width * 0.12, box.right - box.width * 0.12, near.x),
    y: gsap.utils.clamp(window.innerHeight * 0.18, window.innerHeight * 0.8, near.y),
  };
  const target = inView(sheets)
    .filter((sheet) => far(centreOf(sheet), start) > 160)
    .sort((a, b) => far(centreOf(a), start) - far(centreOf(b), start))[0];
  const to = target ? centreOf(target) : middleOf(wall, box);
  const ball = prop('sport-rasengan', start.x, start.y - 30);
  timeline
    .fromTo(ball, { scale: 0.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.3)
    .call(() => say('Rasengan!'), undefined, 1.4)
    .to(ball, { x: to.x, y: to.y, duration: 0.35, ease: 'power3.in' }, 1.5)
    .to(ball, { scale: 2.6, opacity: 0, duration: 0.35, ease: 'power2.out' }, 1.85)
    .call(() => say(''), undefined, 1.9);
  hit(timeline, wall, target ?? null, 1.85);
  impact(timeline, 1.85, to);
  shout(timeline, 1.95, 'Rasengan', 'A spiral of chakra, held in one hand.');
}

/** Jujutsu Kaisen: Hollow Purple. Blue, then red, then the two together, fired across the wall. */
function purple({ wall, sheets, box, prop, say, shout, impact, onEnd }: Scene, timeline: Timeline) {
  const middle = middleOf(wall, box);
  const blue = prop('sport-orb', box.left + box.width * 0.2, middle.y);
  blue.dataset.tone = 'blue';
  const red = prop('sport-orb', box.right - box.width * 0.2, middle.y);
  red.dataset.tone = 'red';
  const hollow = prop('sport-hollow', middle.x, middle.y);
  onEnd(() => gsap.set(sheets, { clearProps: 'opacity' }));
  timeline
    .call(() => say('Cursed technique lapse: Blue.'), undefined, 0.2)
    .fromTo(blue, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.3)
    .call(() => say('Cursed technique reversal: Red.'), undefined, 1)
    .fromTo(red, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' }, 1.1)
    .call(() => say('Hollow technique.'), undefined, 1.8)
    .to(blue, { x: middle.x, duration: 0.6, ease: 'power2.in' }, 1.8)
    .to(red, { x: middle.x, duration: 0.6, ease: 'power2.in' }, 1.8)
    .set([blue, red], { opacity: 0 }, 2.4)
    .fromTo(hollow, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'expo.out' }, 2.4)
    .call(() => say('Purple.'), undefined, 2.6)
    // Fired: it crosses the wall, and whatever it passes is gone for a moment.
    .to(hollow, { x: window.innerWidth + 400, scale: 1.7, duration: 0.9, ease: 'power2.in' }, 2.9)
    .call(() => say(''), undefined, 3.4);
  for (const sheet of sheets) {
    const at = centreOf(sheet);
    if (Math.abs(at.y - middle.y) > 210 || at.x < middle.x - 60) continue;
    const when = 2.9 + Math.max(0, (at.x - middle.x) / (window.innerWidth - middle.x + 400)) * 0.9;
    timeline.to(sheet, { opacity: 0, duration: 0.08 }, when).to(sheet, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 4.4);
  }
  impact(timeline, 2.4, middle);
  shout(timeline, 3.6, 'Murasaki', 'Hollow technique. Purple.');
}

// A shadow soldier: a head, shoulders and a body in the dark, and two violet eyes.
const SOLDIER = `<svg viewBox="0 0 40 84">
  <path d="M20 2 C26 2 30 7 30 13 C30 19 26 23 20 23 C14 23 10 19 10 13 C10 7 14 2 20 2 Z M6 30 C10 25 30 25 34 30 L39 60 L33 61 L30 42 L29 84 H11 L10 42 L7 61 L1 60 Z" fill="#160a28"/>
  <ellipse class="eye" cx="16" cy="13" rx="2.2" ry="1.3"/><ellipse class="eye" cx="24" cy="13" rx="2.2" ry="1.3"/>
</svg>`;

/** Solo Leveling: Arise. The system asks, and shadow soldiers stand up out of the sheets. */
function arise({ sheets, prop, say, shout }: Scene, timeline: Timeline) {
  const panel = prop('sport-system', window.innerWidth / 2, window.innerHeight * 0.18);
  gsap.set(panel, { xPercent: -50 });
  panel.innerHTML = '<b>[ System ]</b><span>Extract the shadows? Arise.</span>';
  const pool = inView(sheets).slice().sort((a, b) => centreOf(a).x - centreOf(b).x);
  const step = Math.max(Math.floor(pool.length / 7), 1);
  const chosen = pool.filter((_, i) => i % step === 0).slice(0, 7);
  timeline
    .to(sheets, { filter: 'brightness(0.35) saturate(0.6)', duration: 0.5, ease: 'power2.out' }, 0.2)
    .fromTo(panel, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }, 0.3)
    .call(() => say('Arise.'), undefined, 1.2);
  chosen.forEach((sheet, i) => {
    const box = sheet.getBoundingClientRect();
    const soldier = prop('sport-soldier', box.left + box.width / 2, box.bottom - box.height * 0.06);
    gsap.set(soldier, { xPercent: -50 });
    soldier.innerHTML = SOLDIER;
    timeline
      .fromTo(soldier, { yPercent: -50, scaleY: 0.15, opacity: 0 }, { yPercent: -100, scaleY: 1, opacity: 1, duration: 0.7, ease: 'power3.out' }, 1.3 + i * 0.12)
      .to(soldier, { yPercent: -50, scaleY: 0.1, opacity: 0, duration: 0.5, ease: 'power2.in' }, 3.9 + i * 0.05);
  });
  shout(timeline, 2.6, 'Arise', pick('arise', ['The shadows answer.', 'Every one of them, his.', 'Level up.']));
  timeline
    .to(panel, { opacity: 0, duration: 0.3 }, 3.6)
    .call(() => say(''), undefined, 3.6)
    .to(sheets, { filter: 'brightness(1) saturate(1)', duration: 0.6, ease: 'power2.inOut' }, 4.2);
}

export const ANIME: Record<AnimePlay, (scene: Scene, timeline: Timeline) => void> = {
  jajanken,
  alchemy,
  mob,
  rezero,
  bakuman,
  water,
  kamehameha,
  kira,
  gearfive,
  rasengan,
  purple,
  arise,
};
