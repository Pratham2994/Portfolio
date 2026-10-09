import gsap from 'gsap';

export type Play = 'messi' | 'kohli' | 'federer' | 'rcb' | 'siuu' | 'smash' | 'ace' | 'boxbox' | 'naruto';

type Timeline = gsap.core.Timeline;
type Point = { x: number; y: number };

type Scene = {
  wall: HTMLElement;
  sheets: HTMLElement[];
  box: DOMRect;
  /** The ball. Moving `ball` moves it across the screen; `spin` is the part that turns and arcs. */
  ball: HTMLElement;
  spin: HTMLElement;
  /** Puts one more thing on the stage, centred on a point of the screen. */
  prop: (name: string, x: number, y: number, tag?: string) => HTMLElement;
  /** Leaves a fading trail behind a thing as it moves. */
  trail: (node: HTMLElement, colour: string) => void;
  /** A ring that opens where something lands. */
  impact: (timeline: Timeline, at: number, point: Point) => void;
  /** Runs on every frame of the play. */
  onFrame: (run: () => void) => void;
  /** A small line of commentary while the play is on. */
  say: (text: string) => void;
  /** The big call at the end, with one line under it. */
  shout: (timeline: Timeline, at: number, word: string, line: string) => void;
};

const centreOf = (el: Element): Point => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

// Each word has more than one way to go. It goes through all of them, in a new order each
// round, so the next try is never the one just seen.
const rounds: Record<string, { order: number[]; last: number }> = {};
function pick<T>(key: string, options: T[]): T {
  const round = (rounds[key] ??= { order: [], last: -1 });
  if (!round.order.length) {
    round.order = gsap.utils.shuffle(options.map((_, i) => i));
    // A new round does not start with the one the last round ended on.
    if (options.length > 1 && round.order[0] === round.last) round.order.push(round.order.shift()!);
  }
  round.last = round.order.shift()!;
  return options[round.last];
}

// The knock a sheet and the wall take when something hits them.
function hit(timeline: Timeline, wall: HTMLElement, sheet: Element | null, at: number) {
  if (sheet) timeline.fromTo(sheet, { scale: 0.9 }, { scale: 1, duration: 0.55, ease: 'back.out(4)', immediateRender: false }, at);
  timeline.fromTo(wall, { x: 7, y: -4 }, { x: 0, y: 0, duration: 0.35, ease: 'elastic.out(1.2, 0.3)', immediateRender: false }, at);
}

// The stands: every sheet gets up and sits down, left to right.
function wave(timeline: Timeline, sheets: HTMLElement[], at: number) {
  const stands = sheets.slice().sort((a, b) => centreOf(a).x - centreOf(b).x);
  stands.forEach((sheet, i) => {
    timeline.to(sheet, { y: -16, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1 }, at + i * 0.045);
  });
}

/** Three goals of his. A free kick into the top corner, a run past everyone, and a chip. */
function messi(scene: Scene, timeline: Timeline) {
  const { wall, sheets, box, ball, spin, say, shout, trail, impact } = scene;
  trail(ball, '#f5f1ea');
  const right = sheets.filter((sheet) => centreOf(sheet).x > box.left + box.width * 0.6);
  const goal = (at: number, net: HTMLElement, line: string) => {
    const to = centreOf(net);
    timeline.call(() => say(''), undefined, at).to(ball, { y: to.y + 90, opacity: 0, duration: 0.6, ease: 'power2.in' }, at + 0.05);
    hit(timeline, wall, net, at);
    impact(timeline, at, to);
    shout(timeline, at + 0.05, 'Goooal', line);
  };

  pick('messi', [
    // The free kick. Straight across, but late to come down: that is the curl.
    () => {
      const net = right.slice().sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] ?? sheets[0];
      const to = centreOf(net);
      say('Free kick. Twenty five yards out.');
      timeline
        .set(ball, { x: box.left + box.width * 0.14, y: box.bottom - 70, scale: 1.7, opacity: 0 })
        .to(ball, { opacity: 1, duration: 0.2 }, 0)
        .to(ball, { x: to.x, duration: 0.95, ease: 'power1.in' }, 0.9)
        .to(ball, { y: to.y, duration: 0.95, ease: 'power2.out' }, 0.9)
        .to(ball, { scale: 0.85, duration: 0.95, ease: 'none' }, 0.9)
        .to(spin, { rotation: 900, duration: 0.95, ease: 'none' }, 0.9);
      goal(1.85, net, 'Messi. Top corner. The keeper did not move.');
    },
    // The run. He goes past four sheets, each on the wrong side, and rolls it in.
    () => {
      const row = sheets.slice().sort((a, b) => centreOf(a).x - centreOf(b).x);
      const step = Math.max(Math.floor(row.length / 5), 1);
      const defenders = [1, 2, 3, 4].map((i) => row[Math.min(i * step, row.length - 2)]).filter((sheet, i, all) => all.indexOf(sheet) === i);
      const net = row[row.length - 1];
      say('He picks it up in his own half.');
      timeline.set(ball, { x: box.left + 30, y: box.top + box.height * 0.62, scale: 1.2, opacity: 1 });
      let at = 0.5;
      defenders.forEach((sheet, i) => {
        const rect = sheet.getBoundingClientRect();
        const side = i % 2 ? -1 : 1;
        timeline
          .to(ball, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 + side * (rect.height / 2 + 24), duration: 0.3, ease: 'sine.inOut' }, at)
          // The defender goes the other way.
          .to(sheet, { rotation: -side * 9, y: -side * 10, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }, at + 0.12)
          .call(() => say(`Past ${i + 1}.`), undefined, at + 0.3);
        at += 0.3;
      });
      const to = centreOf(net);
      timeline.to(spin, { rotation: 1080, duration: at - 0.5 + 0.3, ease: 'none' }, 0.5).to(ball, { x: to.x, y: to.y, scale: 0.9, duration: 0.3, ease: 'power2.in' }, at + 0.1);
      goal(at + 0.4, net, 'Messi. Went past all of them. On his own.');
    },
    // The chip. Up over the keeper, who is the piece in the middle, and down behind him.
    () => {
      const keeper = wall.querySelector('[data-centre]');
      const net = right.slice().sort((a, b) => centreOf(b).y - centreOf(a).y)[0] ?? sheets[0];
      const to = centreOf(net);
      say('The keeper is off his line.');
      timeline
        .set(ball, { x: box.left + box.width * 0.16, y: box.bottom - 90, scale: 1.2, opacity: 1 })
        .to(ball, { x: to.x, y: to.y, duration: 1.3, ease: 'none' }, 0.8)
        .to(spin, { y: -Math.min(box.height * 0.55, 380), duration: 0.65, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.8)
        .to(spin, { scale: 1.9, duration: 0.65, ease: 'sine.out', yoyo: true, repeat: 1 }, 0.8)
        .to(spin, { rotation: -500, duration: 1.3, ease: 'none' }, 0.8);
      // He jumps. It is not enough.
      if (keeper) timeline.to(keeper, { y: -22, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: 1 }, 1.2);
      goal(2.1, net, 'Messi. The chip. The keeper just watched.');
    },
  ])();
}

/** Three shots of his. The ball comes in the same way each time; what he does with it changes. */
function kohli(scene: Scene, timeline: Timeline) {
  const { wall, sheets, box, ball, spin, say, shout, trail, impact } = scene;
  trail(ball, '#d1273a');
  const bat = wall.querySelector('[data-centre]');
  const middle = bat ? centreOf(bat) : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  const shot = pick('kohli', [
    // Along the ground through the off side, and gone.
    { ball: 'Good length. Just outside off.', word: 'Cover drive', line: 'Four. Kohli. Nobody ran.', to: { x: -60, y: box.bottom - 40 }, grow: 1.6, time: 0.8, lean: 4 },
    // Off the pads, with the wrists.
    { ball: 'On the pads. That is a mistake.', word: 'The flick', line: 'Four. Kohli. Off the pads. All wrists.', to: { x: window.innerWidth + 60, y: box.top + box.height * 0.3 }, grow: 1.6, time: 0.75, lean: -6 },
    // Off the back foot, straight back over the bowler, and out of the ground.
    { ball: 'Back of a length. Quick.', word: 'Six', line: 'Kohli. Back foot. Straight over the bowler.', to: { x: middle.x + 60, y: -90 }, grow: 3, time: 1.05, lean: 3 },
  ]);
  say(shot.ball);
  timeline
    .set(ball, { x: window.innerWidth + 40, y: middle.y - 90, scale: 0.9, opacity: 1 })
    .to(ball, { x: middle.x + 40, y: middle.y + 10, duration: 0.5, ease: 'none' }, 0.7)
    .to(spin, { rotation: -540, duration: 0.5, ease: 'none' }, 0.7)
    .to(ball, { ...shot.to, scale: shot.grow, duration: shot.time, ease: 'power1.out' }, 1.2)
    .to(spin, { rotation: 900, duration: shot.time, ease: 'none' }, 1.2)
    .call(() => say(''), undefined, 1.25);
  if (bat) timeline.fromTo(bat, { rotation: shot.lean }, { rotation: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.25)', immediateRender: false }, 1.2);
  hit(timeline, wall, null, 1.2);
  impact(timeline, 1.2, { x: middle.x + 40, y: middle.y + 10 });
  wave(timeline, sheets, 1.2 + shot.time - 0.05);
  // A six gets the stands up twice.
  if (shot.word === 'Six') wave(timeline, sheets, 1.2 + shot.time + 0.7);
  shout(timeline, 1.2 + shot.time, shot.word, shot.line);
}

/** Three points of his. An ace after a rally, the one-handed backhand, and the shot between the legs. */
function federer(scene: Scene, timeline: Timeline) {
  const { box, ball, spin, say, shout, trail, impact } = scene;
  trail(ball, '#d6ee3b');
  const left = box.left + box.width * 0.08;
  const right = box.left + box.width * 0.92;
  const line = box.top + box.height * 0.55;
  const SHOT = 0.5;
  // One shot of a rally: across, and up over the net on the way.
  const rally = (at: number, toX: number, call: string) =>
    timeline
      .to(ball, { x: toX, duration: SHOT, ease: 'none' }, at)
      .to(spin, { y: -110, duration: SHOT / 2, ease: 'power1.out', yoyo: true, repeat: 1 }, at)
      .call(() => say(call), undefined, at + SHOT);
  timeline.set(ball, { x: left, y: line, scale: 1, opacity: 1 });

  pick('federer', [
    // The ace is flat, and too fast to watch.
    () => {
      ['15 - 0', '30 - 0', '40 - 0'].forEach((score, i) => rally(0.3 + i * SHOT, i % 2 ? left : right, score));
      const at = 0.3 + 3 * SHOT + 0.25;
      timeline.to(ball, { x: -80, y: line + 60, duration: 0.2, ease: 'none' }, at).call(() => say(''), undefined, at + 0.2);
      shout(timeline, at + 0.2, 'Ace', 'Federer. Down the middle. No sweat.');
    },
    // Two shots to set it up, then the backhand, with one hand, down the line.
    () => {
      rally(0.3, right, 'Deuce');
      rally(0.3 + SHOT, left, 'Advantage');
      const at = 0.3 + 2 * SHOT + 0.3;
      const corner = { x: box.left + box.width * 0.97, y: box.top + box.height * 0.12 };
      timeline.to(ball, { ...corner, duration: 0.22, ease: 'none' }, at).to(ball, { opacity: 0, duration: 0.1 }, at + 0.22);
      impact(timeline, at + 0.22, corner);
      timeline.call(() => say(''), undefined, at + 0.22);
      shout(timeline, at + 0.25, 'Game', 'Federer. One-handed backhand. Down the line.');
    },
    // He is lobbed, runs back, lets it bounce, and hits it between his legs.
    () => {
      say('He is lobbed. He runs back.');
      timeline
        .set(ball, { x: right, y: line })
        .to(ball, { x: left + 90, duration: 1, ease: 'none' }, 0.4)
        .to(spin, { y: -Math.min(box.height * 0.5, 340), duration: 0.5, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.4)
        // The bounce.
        .to(ball, { x: left, duration: 0.35, ease: 'none' }, 1.4)
        .to(spin, { y: -70, duration: 0.175, ease: 'power1.out', yoyo: true, repeat: 1 }, 1.4)
        // And back, flat, past the man at the net.
        .to(ball, { x: window.innerWidth + 80, y: line + 40, duration: 0.24, ease: 'none' }, 1.85)
        .call(() => say(''), undefined, 2.05);
      impact(timeline, 1.85, { x: left, y: line });
      shout(timeline, 2.1, 'Tweener', 'Federer. Between the legs. Then he smiled.');
    },
  ])();
}

/** The cup stays in Bengaluru. Red and gold over everything, and paper from the roof. */
function rcb({ sheets, box, prop, shout }: Scene, timeline: Timeline) {
  const tint = prop('sport-tint', 0, 0);
  timeline.fromTo(tint, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0).to(tint, { opacity: 0, duration: 0.7 }, 2.5);
  for (let i = 0; i < 60; i++) {
    const bit = prop('sport-bit', gsap.utils.random(box.left, box.right), -20);
    if (i % 2) bit.dataset.gold = '';
    timeline.to(
      bit,
      { y: window.innerHeight + 40, x: `+=${gsap.utils.random(-140, 140)}`, rotation: gsap.utils.random(-720, 720), duration: gsap.utils.random(1.5, 2.5), ease: 'none' },
      gsap.utils.random(0, 0.9),
    );
  }
  wave(timeline, sheets, 0.15);
  wave(timeline, sheets, 1.1);
  shout(timeline, 0.25, 'Ee sala bhi', pick('rcb', ['Cup namdu. Bengaluru keeps it.', 'Cup namdu. Chinnaswamy is loud tonight.', 'Cup namdu. Again. Get used to it.']));
}

/** Wrong player. Nothing happens, and the wall says why. */
function siuu({ say }: Scene, timeline: Timeline) {
  const line = pick('siuu', ['Wrong wall.', 'Wrong wall. Try the other number 10.', 'Not here. This wall is taken.']);
  timeline
    .call(() => say(line), undefined, 0.9)
    .to({}, { duration: 2.2 }, 0.9)
    .call(() => say(''));
}

/** A lift that hangs in the air too long. Most times it gets smashed. Now and then, a drop. */
function smash(scene: Scene, timeline: Timeline) {
  const { wall, sheets, box, prop, say, shout, trail, impact } = scene;
  const apex = { x: box.left + box.width * gsap.utils.random(0.45, 0.65), y: box.top + box.height * 0.2 };
  // It lands on a sheet well below it, a different one each time.
  const below = sheets.filter((sheet) => centreOf(sheet).y > apex.y + 140);
  const target = gsap.utils.random(below.length ? below : sheets);
  const to = centreOf(target);
  const shuttle = prop('sport-shuttle', apex.x + 60, -50);
  trail(shuttle, '#f5f1ea');
  say('A high lift. Much too high.');
  timeline
    .to(shuttle, { x: apex.x, y: apex.y, duration: 1.5, ease: 'sine.out' }, 0.2)
    .fromTo(shuttle, { rotation: -14 }, { rotation: 14, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 2 }, 0.2);

  pick('smash', [
    // The jump, and then it is already there.
    () => {
      timeline
        .set(shuttle, { rotation: (Math.atan2(to.y - apex.y, to.x - apex.x) * 180) / Math.PI - 90 }, 1.75)
        .to(shuttle, { x: to.x, y: to.y, duration: 0.13, ease: 'none' }, 1.75)
        .call(() => say(''), undefined, 1.88)
        .fromTo(target, { rotation: -13, y: 24, scale: 0.9 }, { rotation: 0, y: 0, scale: 1, duration: 1, ease: 'elastic.out(1.1, 0.3)', immediateRender: false }, 1.88)
        .fromTo(wall, { x: -14, y: 9 }, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1.3, 0.25)', immediateRender: false }, 1.88)
        .to(shuttle, { x: to.x - 70, y: to.y + 150, rotation: -220, opacity: 0, duration: 0.65, ease: 'power1.in' }, 1.9);
      impact(timeline, 1.88, to);
      shout(timeline, 1.95, 'Smash', 'Badminton. The one sport I can really play.');
    },
    // Everyone waits for the smash. It just falls over the net.
    () => {
      const top = { x: to.x, y: target.getBoundingClientRect().top - 6 };
      timeline
        .call(() => say('Here comes the smash.'), undefined, 1.6)
        .to(shuttle, { x: top.x, y: top.y, rotation: 0, duration: 0.9, ease: 'sine.in' }, 1.9)
        .call(() => say(''), undefined, 2.8)
        .to(target, { y: 5, duration: 0.12, ease: 'power1.out', yoyo: true, repeat: 1 }, 2.8)
        .to(shuttle, { rotation: 95, y: top.y + 8, duration: 0.3, ease: 'power1.out' }, 2.8)
        .to(shuttle, { opacity: 0, duration: 0.4 }, 3.5);
      shout(timeline, 2.9, 'Drop', 'Badminton. Did not even need the smash.');
    },
  ])();
}

/** Five sheets, five shots to the head, one after the other. */
function ace({ sheets, prop, say, shout, impact }: Scene, timeline: Timeline) {
  const targets = gsap.utils.shuffle(sheets.slice()).slice(0, 5);
  const aim = prop('sport-aim', window.innerWidth / 2, window.innerHeight / 2);
  const GAP = 0.42;
  timeline.fromTo(aim, { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power3.out' }, 0.1);
  targets.forEach((sheet, i) => {
    const rect = sheet.getBoundingClientRect();
    const head = { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.3 };
    const at = 0.45 + i * GAP;
    timeline
      // The flick, then the shot.
      .to(aim, { x: head.x, y: head.y, duration: 0.24, ease: 'power3.out' }, at)
      .call(
        () => {
          prop('sport-mark', head.x, head.y);
          say(`${i + 1} / 5`);
        },
        undefined,
        at + 0.28,
      )
      .fromTo(aim, { scale: 1.6 }, { scale: 1, duration: 0.14, ease: 'power2.out', immediateRender: false }, at + 0.28)
      .fromTo(sheet, { scale: 0.92, filter: 'brightness(2.2)' }, { scale: 1, filter: 'brightness(1)', duration: 0.3, ease: 'power2.out', immediateRender: false }, at + 0.28);
    impact(timeline, at + 0.28, head);
  });
  const end = 0.45 + targets.length * GAP + 0.2;
  timeline.to(aim, { opacity: 0, duration: 0.2 }, end).call(() => say(''), undefined, end);
  shout(timeline, end, 'Ace', pick('ace', ['Five shots. Basic FPS player. Still counts.', 'One against five. Clutch.', 'Five taps. The team said nothing.']));
}

/** A pit stop. One poster goes up on the jacks, the cat runs over to watch, four tyres change. */
function boxbox({ sheets, prop, say, shout }: Scene, timeline: Timeline) {
  // The car: a poster in the top row, where the cat can reach it. Not the same one each time.
  const posters = sheets.filter((sheet) => 'poster' in sheet.dataset);
  const top = Math.min(...posters.map((sheet) => sheet.getBoundingClientRect().top));
  const row = posters.filter((sheet) => sheet.getBoundingClientRect().top - top < 40);
  const car = pick('boxbox-car', row.length ? row : sheets);
  window.dispatchEvent(new CustomEvent('wall:cat', { detail: car }));

  // Most stops are quick. Now and then one wheel will not go on.
  const stop = pick('boxbox', [
    { time: 2.1, stuck: 0, line: 'Box box. Softs on. Go go go.' },
    { time: 1.9, stuck: 0, line: 'Box box. Fastest stop of the day.' },
    { time: 2.3, stuck: 0, line: 'Box box. Clean. Out in front of the traffic.' },
    { time: 4.8, stuck: 2.5, line: 'Front left would not go on. We are checking.' },
  ]);

  const rect = car.getBoundingClientRect();
  const corners = [0.24, 0.8].flatMap((down) => [rect.left, rect.right].map((x) => ({ x, y: rect.top + rect.height * down })));
  const side = (i: number) => (i % 2 ? 1 : -1);
  const worn = corners.map(({ x, y }) => prop('sport-tyre', x, y));
  const fresh = corners.map(({ x, y }) => prop('sport-tyre', x, y));
  fresh.forEach((tyre) => (tyre.dataset.soft = ''));
  const clock = { time: 0 };
  const end = 0.75 + stop.time;

  say('Box box.');
  timeline
    .set(fresh, { opacity: 0 })
    .fromTo(worn, { scale: 0 }, { scale: 1, duration: 0.15, stagger: 0.03 }, 0.3)
    // Up on the jacks.
    .to(car, { y: -10, scale: 1.04, duration: 0.25, ease: 'power2.out' }, 0.5)
    .to(clock, { time: stop.time, duration: stop.time, ease: 'none', onUpdate: () => say(`Pit ${clock.time.toFixed(1)}s`) }, 0.75)
    // The wheel guns.
    .fromTo(car, { rotation: -0.7 }, { rotation: 0.7, duration: 0.05, repeat: Math.round((stop.time - 1.2) / 0.05), yoyo: true, immediateRender: false }, 1.9);
  corners.forEach(({ x }, i) => {
    // The front left is the first corner. On a bad stop it comes on late, after two tries.
    const late = i === 0 ? stop.stuck : 0;
    timeline.to(worn[i], { x: x + side(i) * 150, rotation: side(i) * 360, opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.85 + i * 0.08);
    if (late) {
      timeline
        .fromTo(fresh[i], { x: x - 150, opacity: 0 }, { x: x - 26, opacity: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, 1.5)
        .to(fresh[i], { x: x - 12, duration: 0.14, ease: 'power1.inOut', yoyo: true, repeat: 9 }, 1.9);
    }
    timeline.fromTo(
      fresh[i],
      late ? { rotation: 0 } : { x: x + side(i) * 150, rotation: side(i) * 360, opacity: 0 },
      { x, rotation: 0, opacity: 1, duration: late ? 0.2 : 0.45, ease: 'power2.out', immediateRender: false },
      1.5 + i * 0.08 + late + (late ? 0.4 : 0),
    );
  });
  timeline
    // Down, and away.
    .to(car, { y: 0, scale: 1, rotation: 0, duration: 0.35, ease: 'bounce.out' }, end)
    .to(fresh, { opacity: 0, duration: 0.3 }, end + 0.15)
    .call(() => say(''), undefined, end + 0.05);
  shout(timeline, end + 0.05, `${stop.time.toFixed(1)}s`, stop.line);
}

/** More cats, out of a puff of smoke. They hop about for a moment, and then they are smoke again. */
function naruto({ wall, box, prop, say, onFrame }: Scene, timeline: Timeline) {
  const cat = wall.querySelector<HTMLCanvasElement>('[data-cat]');
  if (!cat) return;
  const rect = cat.getBoundingClientRect();
  const home = centreOf(cat);
  const poof = (at: number, x: number, y: number) => timeline.call(() => void prop('sport-poof', x, y), undefined, at);

  // Two, three or five of them, at different distances each time.
  const count = pick('naruto', [3, 5, 2]);
  const clones = Array.from({ length: count }, (_, i) => {
    const clone = prop('sport-clone', home.x, home.y, 'canvas') as HTMLCanvasElement;
    clone.width = cat.width;
    clone.height = cat.height;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    const far = (i % 2 ? 1 : -1) * (Math.floor(i / 2) + 1) * gsap.utils.random(120, 170);
    return { clone, x: gsap.utils.clamp(box.left + 30, box.right - 30, home.x + far), pen: clone.getContext('2d') };
  });
  // Each clone copies her, frame by frame, so their legs move with hers.
  onFrame(() => {
    for (const { clone, pen } of clones) {
      pen?.clearRect(0, 0, clone.width, clone.height);
      pen?.drawImage(cat, 0, 0);
    }
  });

  say('Kage bunshin no jutsu.');
  poof(0.5, home.x, home.y);
  clones.forEach(({ clone, x }, i) => {
    timeline
      .set(clone, { opacity: 0, scaleX: x < home.x ? -1 : 1 }, 0)
      .to(clone, { opacity: 1, duration: 0.1 }, 0.55)
      .to(clone, { x, duration: 0.9, ease: 'power1.inOut' }, 0.6)
      .to(clone, { y: home.y - 34, duration: 0.15, ease: 'power1.out', yoyo: true, repeat: 5 }, 0.6)
      .to(clone, { y: home.y - 12, duration: 0.2, ease: 'power1.out', yoyo: true, repeat: 5 }, 1.7 + i * 0.1)
      .set(clone, { opacity: 0 }, 3.1 + i * 0.12);
    poof(3.1 + i * 0.12, x, home.y);
  });
  const line = pick('naruto-line', ['They never last.', 'One of them was the real one. Maybe.', 'Dattebayo.']);
  timeline
    .call(() => say(line), undefined, 3.1)
    .to({}, { duration: 1.5 }, 3.5)
    .call(() => say(''));
}

const PLAYS: Record<Play, { ball?: string; play: (scene: Scene, timeline: Timeline) => void }> = {
  messi: { ball: 'football', play: messi },
  kohli: { ball: 'cricket', play: kohli },
  federer: { ball: 'tennis', play: federer },
  rcb: { play: rcb },
  siuu: { play: siuu },
  smash: { play: smash },
  ace: { play: ace },
  boxbox: { play: boxbox },
  naruto: { play: naruto },
};

/** Plays one short moment across the wall, then leaves the wall as it was. */
export function playSport(name: Play, wall: HTMLElement, done: () => void): void {
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const grid = wall.querySelector<HTMLElement>(':scope > div')!;

  const stage = document.createElement('div');
  stage.className = 'sport';
  stage.dataset.sport = name;
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `<div class="sport-ball" data-ball="${PLAYS[name].ball ?? ''}"><i></i></div><p class="sport-say"></p><div class="sport-call"><strong></strong><span></span></div>`;
  document.body.append(stage);
  const ball = stage.querySelector<HTMLElement>('.sport-ball')!;
  const spin = ball.querySelector<HTMLElement>('i')!;
  const sayLine = stage.querySelector<HTMLElement>('.sport-say')!;
  const call = stage.querySelector<HTMLElement>('.sport-call')!;

  const finish = () => {
    if (!stage.isConnected) return;
    clearTimeout(guard);
    timeline.kill();
    stage.remove();
    gsap.set([...sheets, wall, wall.querySelector('[data-centre]')], { clearProps: 'transform,x,y,rotation,scale,filter' });
    // The cat is free to go back to what she was doing.
    window.dispatchEvent(new CustomEvent('wall:cat', { detail: null }));
    done();
  };
  // If frames stop (a hidden tab, a stalled page), the wall is still left clean.
  const guard = setTimeout(finish, 12000);
  const frames: (() => void)[] = [];
  const timeline = gsap.timeline({ onComplete: finish, onUpdate: () => frames.forEach((run) => run()) });

  const prop: Scene['prop'] = (className, x, y, tag = 'div') => {
    const node = document.createElement(tag);
    node.className = className;
    // Under the commentary and the call, which are the last things on the stage.
    stage.insertBefore(node, sayLine);
    gsap.set(node, { x, y });
    return node;
  };

  PLAYS[name].play(
    {
      wall,
      sheets,
      box: grid.getBoundingClientRect(),
      ball,
      spin,
      prop,
      onFrame: (run) => void frames.push(run),
      trail: (node, colour) => {
        let at: Point | null = null;
        frames.push(() => {
          // Where it is on the screen now, with every arc and spin counted.
          const rect = (node.firstElementChild ?? node).getBoundingClientRect();
          const now = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          const shown = Number(gsap.getProperty(node, 'opacity')) > 0.5;
          if (shown && at && Math.hypot(now.x - at.x, now.y - at.y) > 14) prop('sport-trail', now.x, now.y).style.background = colour;
          if (!at || Math.hypot(now.x - at.x, now.y - at.y) > 14) at = now;
        });
      },
      impact: (tl, at, point) => void tl.call(() => void prop('sport-impact', point.x, point.y), undefined, at),
      say: (text) => void (sayLine.textContent = text),
      shout: (tl, at, word, line) => {
        tl.call(
          () => {
            call.children[0].textContent = word;
            call.children[1].textContent = line;
          },
          undefined,
          at,
        )
          .fromTo(call, { opacity: 0 }, { opacity: 1, duration: 0.2 }, at)
          .fromTo(call.children, { scale: 1.6 }, { scale: 1, duration: 0.35, ease: 'power4.out' }, at)
          .to(call, { opacity: 0, duration: 0.4 }, at + 2);
      },
    },
    timeline,
  );
}
