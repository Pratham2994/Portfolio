import gsap from 'gsap';

import { track } from '~/lib/analytics';

const LAMPS = 5;
const FIRST = 1.3; // when the first lamp comes on, in seconds
const GAP = 0.55; // between lamps
const CAR = 64; // how tall a sheet is while it waits on the grid, in pixels

// What the pit wall says about your start. The limit is in milliseconds.
const VERDICTS: [limit: number, line: string][] = [
  [200, 'Faster than Max. I do not believe you.'],
  [300, 'Clean launch. First into turn one.'],
  [450, 'Decent. Leclerc got past you.'],
  [Infinity, 'Slow. Ferrari strategy wants to hire you.'],
];

function el(tag: string, name: string, parent: HTMLElement): HTMLElement {
  const node = document.createElement(tag);
  node.className = name;
  parent.append(node);
  return node;
}

/**
 * A race start. The sheets leave the wall and line up as a starting grid, five red lights
 * come on one by one, and when they go out you launch them: space, enter or a click. Your
 * reaction time goes on screen, and going early is a jump start. The sheets race back to
 * their places either way.
 */
export function lightsOut(wall: HTMLElement, done: () => void): void {
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const grid = wall.querySelector<HTMLElement>(':scope > div')!;
  const centre = wall.querySelector<HTMLElement>('[data-centre]');
  const box = grid.getBoundingClientRect();

  const stage = el('div', 'race', document.body);
  stage.dataset.race = '';
  stage.setAttribute('aria-hidden', 'true');
  const veil = el('div', 'race-veil', stage);
  const gantry = el('div', 'race-gantry', stage);
  const pods = Array.from({ length: LAMPS }, () => {
    const pod = el('div', 'race-pod', gantry);
    el('i', '', pod);
    el('i', '', pod);
    return pod;
  });
  const call = el('div', 'race-call', stage);
  const time = el('strong', 'race-time', call);
  const line = el('span', 'race-line', call);

  // The grid: two rows, the second one a half step back, pole position on the left.
  const columns = Math.ceil(sheets.length / 2);
  const slots = sheets.map((sheet, i) => {
    const rect = sheet.getBoundingClientRect();
    const scale = CAR / rect.height;
    const x = box.left + box.width / 2 + ((i >> 1) - (columns - 1) / 2) * (CAR * 1.25) + (i % 2 ? CAR * 0.3 : -CAR * 0.3);
    const y = box.top + box.height * 0.56 + (i % 2 ? CAR * 0.75 : -CAR * 0.75);
    return { sheet, scale, x: x - (rect.left + rect.width / 2), y: y - (rect.top + rect.height / 2) };
  });

  let phase: 'forming' | 'armed' | 'jumped' | 'green' | 'away' = 'forming';
  let wentOut = 0;
  let waiting = 0;
  const lit = (count: number) => {
    pods.forEach((pod, i) => pod.toggleAttribute('data-on', i < count));
    stage.style.setProperty('--lit', String(count));
  };

  const finish = () => {
    if (!stage.isConnected) return;
    clearTimeout(guard);
    clearTimeout(waiting);
    window.removeEventListener('keydown', onKey, true);
    stage.removeEventListener('pointerdown', onPress);
    motion.kill();
    stage.remove();
    gsap.set([...sheets, centre, wall], { clearProps: 'transform,opacity,x,y,rotation,scale' });
    delete wall.dataset.fallen;
    done();
  };
  // If frames stop (a hidden tab, a stalled page), the wall still comes back.
  const guard = setTimeout(finish, 16000);

  /** The start. `reaction` is in milliseconds; null means nobody pressed anything. */
  const launch = (reaction: number | null, jumped = false) => {
    if (phase === 'away') return;
    phase = 'away';
    clearTimeout(waiting);
    lit(0);
    track('lights_out', { reaction: reaction ?? -1, jumped });

    if (jumped) {
      time.textContent = 'Jump start';
      line.textContent = 'Five second penalty. The stewards saw it.';
    } else if (reaction === null) {
      time.textContent = 'Stalled';
      line.textContent = 'No reaction. The whole grid went past you.';
    } else {
      time.textContent = `${(reaction / 1000).toFixed(3)}s`;
      line.textContent = VERDICTS.find(([limit]) => reaction < limit)![1];
    }
    // She jumps back up as the sheets leave the line.
    delete wall.dataset.fallen;

    motion.add(() => {
      const away = gsap.timeline({ onComplete: finish });
      away
        .to(veil, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0)
        .fromTo(time, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power4.out' }, 0)
        .fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.12);
      if (centre) away.to(centre, { opacity: 1, duration: 0.5 }, 0.2);
      slots.forEach(({ sheet }, i) => {
        // Pole goes first. Each one squats, then is gone.
        const at = i * 0.045;
        away
          .to(sheet, { x: '-=10', duration: 0.07, ease: 'power1.out' }, at)
          .to(sheet, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.42, ease: 'power3.in' }, at + 0.07)
          .fromTo(sheet, { scale: 0.94 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, at + 0.49)
          .fromTo(
            wall,
            { x: gsap.utils.random(-5, 5), y: gsap.utils.random(-3, 3) },
            { x: 0, y: 0, duration: 0.14, ease: 'power2.out', immediateRender: false },
            at + 0.49,
          );
      });
      const landed = slots.length * 0.045 + 0.8;
      away
        .call(() => void (stage.style.pointerEvents = 'none'), undefined, landed)
        .to(gantry, { yPercent: -260, duration: 0.5, ease: 'power3.in' }, landed + 0.9)
        .to(call, { opacity: 0, duration: 0.4 }, landed + 1.6);
    });
  };

  const press = () => {
    if (phase === 'green') return launch(performance.now() - wentOut);
    if (phase !== 'armed') return;
    // Too early. Every lamp comes on, and the start is thrown away.
    phase = 'jumped';
    forming.kill();
    lit(LAMPS);
    motion.add(() => {
      gsap.fromTo(gantry, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.2)' });
      gsap.delayedCall(0.7, () => launch(null, true));
    });
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    // Space would scroll the page away from the race.
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) press();
  };
  const onPress = () => press();
  window.addEventListener('keydown', onKey, true);
  stage.addEventListener('pointerdown', onPress);

  // The cat has nothing to stand on while the sheets are away, so the wall counts as fallen.
  wall.dataset.fallen = '';
  line.textContent = 'Space or click when the lights go out';

  let forming!: gsap.core.Timeline;
  const motion = gsap.context(() => {
    forming = gsap.timeline();
    forming
      .fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
      .fromTo(gantry, { yPercent: -260 }, { yPercent: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.45)
      .fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.9);
    if (centre) forming.to(centre, { opacity: 0.12, duration: 0.4 }, 0);
    slots.forEach(({ sheet, scale, x, y }, i) => {
      forming.to(sheet, { x, y, scale, rotation: 0, duration: 0.65, ease: 'power3.inOut' }, 0.05 + i * 0.025);
    });
    // From the first lamp on, a press is a jump start.
    forming.call(() => void (phase = 'armed'), undefined, FIRST);
    for (let i = 1; i <= LAMPS; i++) forming.call(lit, [i], FIRST + (i - 1) * GAP);
    // The wait is never the same twice, as on a real grid.
    forming.call(
      () => {
        lit(0);
        phase = 'green';
        wentOut = performance.now();
        line.textContent = '';
        waiting = window.setTimeout(() => launch(null), 1500);
      },
      undefined,
      FIRST + (LAMPS - 1) * GAP + gsap.utils.random(0.6, 2),
    );
  });
}
