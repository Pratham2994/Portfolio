import gsap from 'gsap';

import { centreOf, pick, type Point, type Scene, type Timeline } from './play-kit';

/** Pop culture secrets: a dance and a hero. Each is one famous moment. */
export type PopPlay = 'moonwalk' | 'batman';

/** The middle of the board, or of the wall when there is no board. */
function middleOf(wall: HTMLElement, box: DOMRect): Point {
  const board = wall.querySelector('[data-centre]');
  return board ? centreOf(board) : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
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
  onEnd(() => sheets.forEach((sheet) => sheet.style.removeProperty('transform-origin')));
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

export const POP: Record<PopPlay, (scene: Scene, timeline: Timeline) => void> = { moonwalk, batman };
