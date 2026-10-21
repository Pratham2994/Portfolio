import gsap from 'gsap';

import { centreOf, pick, type Point, type Scene, type Timeline } from './play-kit';

/** Pop culture secrets: a dance, two heroes and a villain. Each is one famous moment. */
export type PopPlay = 'moonwalk' | 'spiderman' | 'snap' | 'batman';

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

// The dancer: a fedora, a black suit, white socks, and one white glove. The legs are apart, to move.
const DANCER = `<svg viewBox="0 0 60 140">
  <path d="M14 16 H46 L42 8 C40 3 20 3 18 8 Z M8 17 C18 13 42 13 52 17 C44 20 16 20 8 17 Z" fill="#111"/>
  <circle cx="30" cy="25" r="8" fill="#e8c9a6"/>
  <path d="M18 36 C22 32 38 32 42 36 L44 78 H16 Z" fill="#111"/>
  <path d="M18 38 L8 64 L12 66 L22 44 Z" fill="#111"/><circle class="glove" cx="9" cy="67" r="4.2" fill="#f4f4f4"/>
  <path d="M42 38 L50 62 L46 64 L38 44 Z" fill="#111"/><circle cx="48" cy="65" r="3.6" fill="#e8c9a6"/>
  <g class="leg back"><path d="M18 76 L20 118 H30 L30 76 Z" fill="#111"/><rect x="19" y="116" width="11" height="6" fill="#f4f4f4"/><path d="M16 122 H32 V128 H14 Z" fill="#111"/></g>
  <g class="leg front"><path d="M30 76 L30 118 H40 L42 76 Z" fill="#111"/><rect x="30" y="116" width="11" height="6" fill="#f4f4f4"/><path d="M28 122 H46 V128 H28 Z" fill="#111"/></g>
</svg>`;

/** The moonwalk: he glides backwards along the foot of the wall, and the whole wall does the lean. */
function moonwalk({ sheets, box, prop, say, shout, onEnd }: Scene, timeline: Timeline) {
  // The lean turns each sheet on its feet; afterwards each one hangs from its pin again.
  onEnd(() => gsap.set(sheets, { clearProps: 'transformOrigin' }));
  const floor = Math.min(box.bottom, window.innerHeight * 0.86);
  const spot = prop('sport-spotlight', box.left + box.width * 0.7, floor - 60);
  const dancer = prop('sport-dancer', box.left + box.width * 0.78, floor);
  // Standing on the floor line: GSAP centres him, as it is what places him.
  gsap.set(dancer, { xPercent: -50, yPercent: -100 });
  dancer.innerHTML = DANCER;
  const back = dancer.querySelector('.back')!;
  const front = dancer.querySelector('.front')!;
  const glide = box.width * 0.5;
  timeline
    .fromTo(spot, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.1)
    .fromTo(dancer, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.2)
    .call(() => say('Lights. One spotlight.'), undefined, 0.2)
    // He goes back, though his feet look as if they walk forward: one foot slides back flat while the other is up on its toes.
    .to([dancer, spot], { x: `-=${glide}`, duration: 2.2, ease: 'none' }, 0.6)
    .call(() => say(''), undefined, 0.9);
  for (let step = 0; step < 6; step++) {
    const at = 0.6 + step * 0.36;
    const [slide, lift] = step % 2 ? [front, back] : [back, front];
    timeline
      .to(slide, { x: 8, duration: 0.36, ease: 'none' }, at)
      .set(slide, { x: 0 }, at + 0.36)
      .to(lift, { y: -5, rotation: 8, svgOrigin: '35 122', duration: 0.18, ease: 'power1.out', yoyo: true, repeat: 1 }, at);
  }
  // The toe stand, and then the lean: every sheet tips forward from its feet, together, and back.
  timeline
    .to(dancer, { y: '-=8', duration: 0.2, ease: 'power2.out' }, 2.85)
    .call(() => say('Hee-hee!'), undefined, 2.9)
    .to(sheets, { rotation: '+=14', transformOrigin: '50% 100%', duration: 0.6, ease: 'power2.inOut' }, 3.2)
    .to(sheets, { rotation: '-=14', duration: 0.7, ease: 'power2.inOut' }, 4.4)
    .to([dancer, spot], { opacity: 0, duration: 0.5 }, 4.6)
    .call(() => say(''), undefined, 4.6);
  shout(timeline, 3.3, 'Hee-hee!', pick('moonwalk', ['Backwards, and somehow forwards.', 'The lean. Every poster at once.', 'One glove is enough.']));
}

// The mask: red, with the web on it and the two white eyes.
const MASK = `<svg viewBox="0 0 60 70">
  <path d="M30 2 C50 2 58 18 58 34 C58 54 44 68 30 68 C16 68 2 54 2 34 C2 18 10 2 30 2 Z" fill="#d1121f"/>
  <g stroke="#3a0006" stroke-width="1" fill="none" opacity="0.7"><path d="M30 2 V68 M2 34 H58 M8 14 L52 56 M52 14 L8 56"/><ellipse cx="30" cy="34" rx="12" ry="14"/><ellipse cx="30" cy="34" rx="22" ry="26"/></g>
  <path d="M8 28 C14 20 24 22 27 34 C20 38 10 36 8 28 Z" fill="#fff" stroke="#111" stroke-width="2"/>
  <path d="M52 28 C46 20 36 22 33 34 C40 38 50 36 52 28 Z" fill="#fff" stroke="#111" stroke-width="2"/>
</svg>`;

/** Spider-Man: web lines shoot out to the sheets, he swings across, and a web catches the board. */
function spiderman({ wall, sheets, box, prop, say, shout }: Scene, timeline: Timeline) {
  const middle = middleOf(wall, box);
  const anchor = { x: box.left + box.width / 2, y: -40 };
  const lines = prop('sport-webs', 0, 0, 'div');
  const targets = inView(sheets)
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  lines.innerHTML = `<svg viewBox="0 0 ${window.innerWidth} ${window.innerHeight}">${targets
    .map((sheet) => {
      const to = centreOf(sheet);
      return `<path d="M${window.innerWidth + 20} ${-20} L${to.x} ${to.y - sheet.getBoundingClientRect().height * 0.4}"/>`;
    })
    .join('')}</svg>`;
  const strands = lines.querySelectorAll('path');
  const hero = prop('sport-swing', anchor.x, anchor.y);
  hero.innerHTML = `<i></i>${MASK}`;
  const net = prop('sport-net', middle.x, middle.y);
  net.innerHTML = `<svg viewBox="-100 -100 200 200">${Array.from({ length: 8 }, (_, i) => `<path d="M0 0 L${Math.cos((i * Math.PI) / 4) * 100} ${Math.sin((i * Math.PI) / 4) * 100}"/>`).join('')}${[25, 50, 75, 98].map((r) => `<polygon points="${Array.from({ length: 8 }, (_, i) => `${Math.cos((i * Math.PI) / 4) * r},${Math.sin((i * Math.PI) / 4) * r}`).join(' ')}"/>`).join('')}</svg>`;

  timeline.call(() => say('Thwip.'), undefined, 0.2);
  strands.forEach((strand, i) => {
    const length = (strand as SVGPathElement).getTotalLength();
    timeline.fromTo(strand, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 0.18, ease: 'power3.out' }, 0.25 + i * 0.12);
    // The sheet on the end of it is tugged toward the line, once.
    timeline.to(targets[i], { x: 14, y: -10, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.43 + i * 0.12);
  });
  timeline
    .to(lines, { opacity: 0, duration: 0.4 }, 1.2)
    // The swing: a pendulum from far above the middle, from one side of the wall to the other.
    .fromTo(hero, { rotation: 62, opacity: 1 }, { rotation: -62, duration: 1.4, ease: 'sine.inOut' }, 0.9)
    .to(hero, { opacity: 0, duration: 0.2 }, 2.25)
    .call(() => say(''), undefined, 1)
    .fromTo(net, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }, 2.2)
    .to(net, { opacity: 0, duration: 0.6 }, 4.2);
  shout(timeline, 2.5, 'Thwip', pick('spiderman', ['With great power comes great responsibility.', 'Your friendly neighbourhood poster wall.', 'Just a kid from Queens.']));
}

// The gauntlet: a gold fist with its six stones.
const GAUNTLET = `<svg viewBox="0 0 80 100">
  <path d="M14 40 C14 26 22 20 30 22 L30 10 C30 4 38 4 38 10 L38 20 L40 8 C40 2 48 2 48 8 L48 22 L52 12 C52 6 60 6 60 12 L58 30 L64 22 C68 18 74 22 70 28 L60 50 C58 70 50 82 40 84 L40 98 H18 L18 80 C14 70 14 56 14 40 Z" fill="#d9a520" stroke="#7a5200" stroke-width="2"/>
  <circle cx="34" cy="10" r="2.6" fill="#ffd400"/><circle cx="44" cy="8" r="2.6" fill="#ff2a2a"/><circle cx="56" cy="12" r="2.6" fill="#2a6cff"/><circle cx="68" cy="25" r="2.6" fill="#9b30ff"/><circle cx="20" cy="42" r="2.6" fill="#ff8a00"/>
  <circle cx="38" cy="56" r="7" fill="#1fd15a" stroke="#7a5200" stroke-width="2"/>
</svg>`;

/** The snap: half of everything turns to dust. Then a second snap, and everything comes back. */
function snap({ wall, sheets, box, prop, say, shout, onEnd }: Scene, timeline: Timeline) {
  const middle = middleOf(wall, box);
  const fist = prop('sport-gauntlet', middle.x, middle.y);
  fist.innerHTML = GAUNTLET;
  // Perfectly balanced: every other sheet, by place, so the half is spread over the wall.
  const gone = sheets.slice().sort((a, b) => centreOf(a).x - centreOf(b).x).filter((_, i) => i % 2 === 0);
  onEnd(() => gsap.set(sheets, { clearProps: 'opacity' }));
  timeline
    .call(() => say('I am inevitable.'), undefined, 0.2)
    .fromTo(fist, { scale: 0.4, opacity: 0, y: '+=40' }, { scale: 1, opacity: 1, y: '-=40', duration: 0.6, ease: 'power3.out' }, 0.3)
    // The snap itself: a jolt, and a flash of the stones.
    .to(fist, { scale: 1.12, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.3)
    .call(() => void prop('sport-ring', middle.x, middle.y).classList.add('sport-ring-gold'), undefined, 1.3)
    .call(() => say(''), undefined, 1.3)
    .to(fist, { opacity: 0, duration: 0.4 }, 1.7);
  gone.forEach((sheet, i) => {
    const at = 1.6 + i * 0.12;
    const area = sheet.getBoundingClientRect();
    const colour = getComputedStyle(sheet).getPropertyValue('--bg').trim() || '#888';
    timeline
      .call(
        () => {
          // The dust: bits of the sheet, carried off to the right by a wind nobody feels.
          for (let n = 0; n < 26; n++) {
            const bit = prop('sport-dust', area.left + Math.random() * area.width, area.top + Math.random() * area.height);
            bit.style.background = n % 3 ? colour : '#3b2a1e';
            gsap.to(bit, {
              x: `+=${gsap.utils.random(90, 300)}`,
              y: `-=${gsap.utils.random(20, 140)}`,
              opacity: 0,
              rotation: gsap.utils.random(-180, 180),
              duration: gsap.utils.random(1, 1.8),
              ease: 'power1.out',
              delay: gsap.utils.random(0, 0.5),
            });
          }
        },
        undefined,
        at,
      )
      .to(sheet, { opacity: 0, duration: 0.9, ease: 'power1.in' }, at)
      // The second snap brings each one back.
      .to(sheet, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 4.7 + i * 0.06);
  });
  shout(timeline, 3, 'Perfectly balanced', 'As all things should be.');
  timeline
    .call(() => say('And I… am… Iron Man.'), undefined, 4.4)
    .call(() => void prop('sport-ring', middle.x, middle.y).classList.add('sport-ring-gold'), undefined, 4.6)
    .call(() => say(''), undefined, 5.6);
}

// The bat, as it is on the signal.
const BAT = `<svg viewBox="0 0 200 90"><path d="M100 22 L94 12 L96 28 C84 18 64 14 44 20 C56 26 60 36 54 46 C46 38 30 36 16 40 C26 46 30 56 26 66 C46 58 70 60 86 76 L100 88 L114 76 C130 60 154 58 174 66 C170 56 174 46 184 40 C170 36 154 38 146 46 C140 36 144 26 156 20 C136 14 116 18 104 28 L106 12 Z" fill="#0b0b0b"/></svg>`;

/** Batman: night falls on the wall, the signal lights up the sky, and the bats come out. */
function batman({ wall, sheets, box, prop, say, shout }: Scene, timeline: Timeline) {
  const sky = { x: box.left + box.width * 0.72, y: Math.max(box.top - 10, window.innerHeight * 0.18) };
  const night = prop('sport-night', 0, 0);
  const beam = prop('sport-searchlight', 0, 0);
  // The beam, from a roof below the left of the wall up to the signal in the sky.
  const from = { x: box.left + box.width * 0.18, y: window.innerHeight + 20 };
  const angle = Math.atan2(sky.y - from.y, sky.x - from.x);
  const length = Math.hypot(sky.x - from.x, sky.y - from.y);
  gsap.set(beam, { x: from.x, y: from.y, width: length, rotation: (angle * 180) / Math.PI, transformOrigin: '0 50%' });
  const signal = prop('sport-signal', sky.x, sky.y);
  signal.innerHTML = BAT;
  timeline
    .call(() => say('Gotham needs you.'), undefined, 0.2)
    .to(sheets, { filter: 'brightness(0.32) saturate(0.5)', duration: 0.6, ease: 'power2.out' }, 0.2)
    .fromTo(night, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.2)
    // The light comes on, unsure at first.
    .fromTo([beam, signal], { opacity: 0 }, { keyframes: [{ opacity: 0.8, duration: 0.06 }, { opacity: 0.1, duration: 0.1 }, { opacity: 0.9, duration: 0.05 }, { opacity: 0.3, duration: 0.1 }, { opacity: 1, duration: 0.4 }] }, 0.9)
    .call(() => say(''), undefined, 1.6);
  // The bats, out of the board and away over the wall.
  const middle = middleOf(wall, box);
  timeline.call(
    () => {
      for (let i = 0; i < 16; i++) {
        const bat = prop('sport-bat', middle.x, middle.y);
        bat.innerHTML = BAT;
        const turn = gsap.utils.random(-Math.PI * 0.95, -Math.PI * 0.05);
        const far = gsap.utils.random(400, 1100);
        gsap.fromTo(
          bat,
          { scale: 0.2, opacity: 1 },
          { x: middle.x + Math.cos(turn) * far, y: middle.y + Math.sin(turn) * far, scale: gsap.utils.random(0.6, 1.2), opacity: 0, duration: gsap.utils.random(1.2, 2), ease: 'power1.in', delay: i * 0.04 },
        );
      }
    },
    undefined,
    1.7,
  );
  shout(timeline, 2.3, 'Batman', pick('batman', ["I'm Batman.", 'It is not who I am underneath.', 'Why do we fall? So we can learn to pick ourselves up.']));
  timeline
    .to([beam, signal], { opacity: 0, duration: 0.6, ease: 'power2.in' }, 4.4)
    .to(night, { opacity: 0, duration: 0.6 }, 4.5)
    .to(sheets, { filter: 'brightness(1) saturate(1)', duration: 0.6, ease: 'power2.inOut' }, 4.5);
}

export const POP: Record<PopPlay, (scene: Scene, timeline: Timeline) => void> = { moonwalk, spiderman, snap, batman };
