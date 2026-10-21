import gsap from 'gsap';

export type Play = 'messi' | 'kohli' | 'federer' | 'rcb' | 'siuu' | 'smash' | 'ace' | 'boxbox' | 'naruto' | 'creeper' | 'domain' | 'titan' | 'geass';

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
  /** Runs once when the play is over, however it ends. */
  onEnd: (run: () => void) => void;
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
  const line = pick('siuu', ['Wrong wall.', 'Wrong wall. This one belongs to the number 10.', 'Not here. This wall is taken.']);
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

// The creeper, drawn in its own pixels: a face of eight by eight, a body, and its feet.
const CREEPER_FACE = ['........', '.##..##.', '.##..##.', '...##...', '..####..', '..####..', '..#..#..', '........'];
function creeperSvg(): string {
  const greens = ['#5aa33f', '#4c8f34', '#6dbb4c', '#3f7d2b', '#7bc95a'];
  const cells: string[] = [];
  const cell = (x: number, y: number, fill: string) => cells.push(`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fill}"/>`);
  const green = () => greens[Math.floor(Math.random() * greens.length)];
  CREEPER_FACE.forEach((row, y) => [...row].forEach((dot, x) => cell(x, y, dot === '#' ? '#111' : green())));
  for (let y = 8; y < 18; y++) for (let x = 2; x < 6; x++) cell(x, y, green());
  for (let y = 18; y < 22; y++) for (let x = 0; x < 8; x++) if (x !== 3 && x !== 4) cell(x, y, green());
  return `<svg viewBox="0 0 8 22" shape-rendering="crispEdges">${cells.join('')}</svg>`;
}

/** Minecraft: a creeper steps out from behind a sheet, hisses, swells, and goes off. */
function creeper({ wall, sheets, prop, say, shout, impact }: Scene, timeline: Timeline) {
  // A poster well up the screen, so it is not under the bars or off the bottom.
  const posters = sheets.filter((sheet) => {
    const box = sheet.getBoundingClientRect();
    return 'poster' in sheet.dataset && box.top > 0 && box.bottom < window.innerHeight * 0.72;
  });
  const sheet = pick('creeper', posters.length ? posters : sheets);
  const rect = sheet.getBoundingClientRect();
  // It comes out on the side with room for it.
  const side = rect.right < window.innerWidth - 140 ? 1 : -1;
  const edge = side > 0 ? rect.right : rect.left;
  const width = 56;
  const height = 154;
  const feet = Math.min(rect.bottom, window.innerHeight - 30);
  const mob = prop('sport-creeper', edge, feet - height / 2);
  mob.innerHTML = creeperSvg();
  const point = { x: edge + side * (width / 2 + 6), y: feet - height / 2 };

  // The cat wants none of it: she goes to the sheet furthest away.
  const away = sheets.slice().sort((a, b) => Math.hypot(centreOf(b).x - point.x, centreOf(b).y - point.y) - Math.hypot(centreOf(a).x - point.x, centreOf(a).y - point.y))[0];
  window.dispatchEvent(new CustomEvent('wall:cat', { detail: away }));

  // Out from behind the sheet: the part still behind it is cut away as it moves.
  const out = { x: edge - side * (width / 2) };
  const place = () => {
    const left = out.x - width / 2;
    const behind = side > 0 ? Math.min(Math.max(edge - left, 0), width) : Math.min(Math.max(left + width - edge, 0), width);
    gsap.set(mob, { x: out.x, clipPath: side > 0 ? `inset(0 0 0 ${behind}px)` : `inset(0 ${behind}px 0 0)` });
  };
  place();
  timeline
    .to(out, { x: point.x, duration: 0.9, ease: 'power1.inOut', onUpdate: place }, 0.3)
    .call(() => say('Sssssss...'), undefined, 1.25)
    .call(() => void (mob.dataset.hiss = ''), undefined, 1.25)
    // It swells as the fuse runs.
    .to(mob, { scale: 1.28, duration: 1.15, ease: 'power2.in' }, 1.25)
    .set(mob, { opacity: 0 }, 2.4)
    .call(() => say(''), undefined, 2.4)
    .call(
      () => {
        // The blast: blocks of it, thrown out and falling.
        const blocks = ['#5aa33f', '#3f7d2b', '#7bc95a', '#8b8b8b', '#5a5a5a', '#111'];
        for (let i = 0; i < 28; i++) {
          const block = prop('sport-block', point.x, point.y);
          block.style.background = blocks[i % blocks.length];
          const turn = gsap.utils.random(0, Math.PI * 2);
          const far = gsap.utils.random(80, 340);
          gsap.to(block, {
            x: point.x + Math.cos(turn) * far,
            y: point.y + Math.sin(turn) * far * 0.7 + 120,
            rotation: gsap.utils.random(-360, 360),
            opacity: 0,
            duration: gsap.utils.random(0.7, 1.2),
            ease: 'power2.out',
          });
        }
      },
      undefined,
      2.4,
    );
  hit(timeline, wall, sheet, 2.4);
  impact(timeline, 2.4, point);
  shout(timeline, 2.5, 'Boom', 'It was a creeper. It is always a creeper.');
}

/**
 * Jujutsu Kaisen: a domain. The wall goes into the void, every sheet floats into a slow ring
 * round the board, the name of the domain is called, and then the wall comes back.
 */
function domain({ wall, sheets, box, prop, say, shout, onEnd }: Scene, timeline: Timeline) {
  const board = wall.querySelector('[data-centre]');
  const middle = board ? centreOf(board) : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  // The void goes on the wall itself, under the sheets, so they float in it and stay in sight.
  const empty = document.createElement('div');
  empty.className = 'sport-void';
  empty.setAttribute('aria-hidden', 'true');
  const light = wall.querySelector('[data-light]');
  if (light) light.after(empty);
  else wall.prepend(empty);
  onEnd(() => empty.remove());
  // Stars in the void, a few hundred points of light that do not move.
  empty.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${gsap.utils.random(0, 100)}%;top:${gsap.utils.random(0, 100)}%;opacity:${gsap.utils.random(0.2, 0.9).toFixed(2)}"></i>`).join('');

  const from = sheets.map(centreOf);
  const across = Math.min(box.width * 0.42, 640);
  const down = Math.min(box.height * 0.38, 320);
  const ring = { turn: 0, gather: 0 };
  // Each sheet's place on the ring, as the ring turns. Gathered 0 is home, 1 is on the ring.
  const place = () =>
    sheets.forEach((sheet, i) => {
      const angle = (i / sheets.length + ring.turn) * Math.PI * 2 - Math.PI / 2;
      gsap.set(sheet, {
        x: (middle.x + Math.cos(angle) * across - from[i].x) * ring.gather,
        y: (middle.y + Math.sin(angle) * down - from[i].y) * ring.gather,
        scale: 1 - 0.35 * ring.gather,
      });
    });

  timeline
    .call(() => say('Ryōiki tenkai.'), undefined, 0.15)
    .fromTo(empty, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.inOut' }, 0.45)
    .to(ring, { gather: 1, duration: 1.2, ease: 'power3.inOut', onUpdate: place }, 0.7)
    .to(ring, { turn: 0.2, duration: 3.3, ease: 'none', onUpdate: place }, 0.7)
    .call(() => say(''), undefined, 1.5);
  // The domain opens: rings go out from the board, one after another.
  [0.55, 0.9, 1.25, 1.6].forEach((at) => timeline.call(() => void prop('sport-ring', middle.x, middle.y), undefined, at));
  // The board steps back while the name is called, so the name is the only word in the middle.
  if (board) {
    onEnd(() => gsap.set(board, { clearProps: 'opacity' }));
    timeline.to(board, { opacity: 0.12, duration: 0.4, ease: 'power2.out' }, 1.4).to(board, { opacity: 1, duration: 0.6, ease: 'power2.inOut' }, 3.7);
  }
  shout(timeline, 1.6, '領域展開', 'Ryōiki tenkai. Muryōkūsho.');
  timeline
    .call(() => say('Throughout heaven and earth, this wall alone is the honoured one.'), undefined, 3.7)
    .to(ring, { gather: 0, duration: 1.1, ease: 'power3.inOut', onUpdate: place }, 4)
    .to(empty, { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, 4.2)
    .call(() => say(''), undefined, 5.3);
}

// The Colossal Titan's face: the head without its skin, the teeth, and the eyes.
const TITAN = `<svg viewBox="0 0 200 230">
  <path d="M100 6 C152 6 184 44 184 100 C184 150 168 196 132 222 L68 222 C32 196 16 150 16 100 C16 44 48 6 100 6 Z" fill="#7a1a12"/>
  <path d="M60 30 C70 70 66 110 72 150 M100 14 C100 60 98 100 100 140 M140 30 C130 70 134 110 128 150 M36 90 C52 110 54 140 60 170 M164 90 C148 110 146 140 140 170" stroke="#a8301f" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="68" cy="104" rx="20" ry="12" fill="#2a0806"/><ellipse cx="132" cy="104" rx="20" ry="12" fill="#2a0806"/>
  <circle class="eye" cx="68" cy="104" r="5" fill="#f3e2c0"/><circle class="eye" cx="132" cy="104" r="5" fill="#f3e2c0"/>
  <path d="M92 128 L100 150 L108 128" stroke="#3a0b07" stroke-width="5" fill="none"/>
  <rect x="50" y="168" width="100" height="34" rx="6" fill="#2a0806"/>
  <g fill="#efe4cc">${Array.from({ length: 10 }, (_, i) => `<rect x="${53 + i * 9.6}" y="170" width="8" height="13" rx="1.5"/><rect x="${53 + i * 9.6}" y="187" width="8" height="13" rx="1.5"/>`).join('')}</g>
</svg>`;

/**
 * Attack on Titan: the site is a wall, so something looks over it. The wall sinks, a flash,
 * the Colossal Titan rises behind it in a cloud of steam, looks, and goes down again.
 */
function titan({ wall, box, prop, say, shout }: Scene, timeline: Timeline) {
  const grid = wall.querySelector<HTMLElement>(':scope > div')!;
  const drop = window.innerHeight * 0.42;
  // Everything above the top of the wall, once it has sunk: the titan shows only there.
  const sky = prop('sport-sky', 0, 0);
  sky.style.height = `${Math.max(box.top + drop, 0)}px`;
  const head = document.createElement('div');
  head.className = 'sport-titan';
  head.innerHTML = TITAN;
  sky.append(head);
  const light = prop('sport-bolt', 0, 0);
  const steam = (at: number) =>
    [0.3, 0.5, 0.7].forEach((share, i) =>
      timeline.call(() => void prop('sport-steam', box.left + box.width * share, box.top + drop - 20), undefined, at + i * 0.12),
    );

  timeline
    .call(() => say('That day, the wall was not tall enough.'), undefined, 0.2)
    .to(grid, { y: drop, duration: 1.1, ease: 'power3.inOut' }, 0.3)
    // The flash of a titan's coming.
    .fromTo(light, { opacity: 0 }, { keyframes: [{ opacity: 0.85, duration: 0.06 }, { opacity: 0.1, duration: 0.1 }, { opacity: 0.7, duration: 0.05 }, { opacity: 0, duration: 0.5 }] }, 1.2)
    .fromTo(head, { yPercent: 100 }, { yPercent: 8, duration: 1.6, ease: 'power2.out' }, 1.3);
  steam(1.4);
  steam(2.4);
  timeline
    .to(head, { yPercent: 12, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 2.9)
    .call(() => say(''), undefined, 3.4)
    .to(head, { yPercent: 100, duration: 1, ease: 'power2.in' }, 3.9)
    .to(grid, { y: 0, duration: 1, ease: 'power3.inOut' }, 4.5);
  steam(4.1);
  shout(timeline, 5.4, 'Tatakae', 'Keep moving forward.');
}

// The sigil of the Geass: a bird with its wings spread, in red.
const SIGIL = `<svg viewBox="0 0 120 80">
  <path d="M60 52 C46 34 26 22 4 18 C22 30 34 40 44 54 C34 50 24 50 14 52 C30 56 44 62 54 72 Z" fill="currentColor"/>
  <path d="M60 52 C74 34 94 22 116 18 C98 30 86 40 76 54 C86 50 96 50 106 52 C90 56 76 62 66 72 Z" fill="currentColor"/>
  <path d="M60 30 L66 52 L60 76 L54 52 Z" fill="currentColor"/>
</svg>`;

/**
 * Code Geass: an order no one can refuse. The sigil lights up over the board, and every sheet,
 * however it was hung, hangs perfectly straight. The order holds for a moment, then wears off.
 */
function geass({ wall, sheets, box, prop, say, shout, onEnd }: Scene, timeline: Timeline) {
  // However the play ends, no sheet stays under the order.
  onEnd(() => sheets.forEach((sheet) => sheet.style.removeProperty('--nudge')));
  const board = wall.querySelector('[data-centre]');
  const middle = board ? centreOf(board) : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  const sigil = prop('sport-sigil', middle.x, middle.y);
  sigil.innerHTML = SIGIL;
  // The ones nearest the board obey first.
  const order = sheets.slice().sort((a, b) => Math.hypot(centreOf(a).x - middle.x, centreOf(a).y - middle.y) - Math.hypot(centreOf(b).x - middle.x, centreOf(b).y - middle.y));

  timeline
    .call(() => say('Lelouch vi Britannia commands you.'), undefined, 0.2)
    .fromTo(sigil, { opacity: 0, scale: 0.4, rotation: -25 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: 'power3.out' }, 0.7);
  [0.9, 1.2].forEach((at) => timeline.call(() => void prop('sport-ring', middle.x, middle.y).classList.add('sport-ring-red'), undefined, at));
  order.forEach((sheet, i) => {
    timeline
      // Straight: its tilt taken away, as the cat does when she bumps one.
      .call(() => sheet.style.setProperty('--nudge', 'calc(var(--tilt) * -1)'), undefined, 1.1 + i * 0.05)
      .fromTo(sheet, { filter: 'drop-shadow(0 0 0 #ff1a3c)' }, { filter: 'drop-shadow(0 0 14px #ff1a3c)', duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.1 + i * 0.05)
      .call(() => sheet.style.removeProperty('--nudge'), undefined, 4.3 + i * 0.03);
  });
  shout(timeline, 1.9, 'Obey', 'All of you. Perfectly straight.');
  timeline
    .to(sigil, { opacity: 0, scale: 1.3, duration: 0.6, ease: 'power2.in' }, 3.8)
    .call(() => say('A Geass only works once.'), undefined, 4.2)
    .call(() => say(''), undefined, 5.4)
    // The last of the order wearing off, and the sheets settling back.
    .to({}, { duration: 0.6 }, 5.4);
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
  creeper: { play: creeper },
  domain: { play: domain },
  titan: { play: titan },
  geass: { play: geass },
};

/**
 * The film bars. They close in from the top and the bottom as a play starts, and open again
 * as it ends, so the wall is a screen for as long as the play is on.
 */
function film(stage: HTMLElement, timeline: Timeline, sheets: HTMLElement[], dim: boolean) {
  const end = Math.max(timeline.duration(), 1);
  // Where the cats are the play, bars would cover them: they are up on the top edge. There the
  // sheets go dim, and the cats are what is left in the light.
  if (dim) {
    timeline
      .to(sheets, { filter: 'brightness(0.42) saturate(0.7)', duration: 0.5, ease: 'power2.out' }, 0)
      .to(sheets, { filter: 'brightness(1) saturate(1)', duration: 0.5, ease: 'power2.in' }, end - 0.5);
    return;
  }
  const bars = [0, 1].map(() => {
    const bar = document.createElement('div');
    bar.className = 'sport-bar';
    stage.prepend(bar);
    return bar;
  });
  timeline
    .fromTo(bars[0], { yPercent: -100 }, { yPercent: 0, duration: 0.45, ease: 'power3.out' }, 0)
    .fromTo(bars[1], { yPercent: 100 }, { yPercent: 0, duration: 0.45, ease: 'power3.out' }, 0)
    .to(bars[0], { yPercent: -100, duration: 0.4, ease: 'power2.in' }, end - 0.4)
    .to(bars[1], { yPercent: 100, duration: 0.4, ease: 'power2.in' }, end - 0.4);
}

/**
 * A landing goes through the wall like a wave. Each sheet is pushed away from the point, the
 * near ones first and hardest, and springs back. It moves by a share of its own size, which
 * the plays themselves never use, so the wave and the play do not fight over a sheet.
 */
function ripple(timeline: Timeline, sheets: HTMLElement[], at: number, point: Point, strength: number) {
  for (const sheet of sheets) {
    const centre = centreOf(sheet);
    const far = Math.hypot(centre.x - point.x, centre.y - point.y);
    const push = strength * Math.max(0, 1 - far / 1100) * 9;
    if (push < 0.4) continue;
    const reach = at + far / 2600;
    timeline
      .to(sheet, { xPercent: ((centre.x - point.x) / (far || 1)) * push, yPercent: ((centre.y - point.y) / (far || 1)) * push, duration: 0.09, ease: 'power2.out' }, reach)
      .to(sheet, { xPercent: 0, yPercent: 0, duration: 0.7, ease: 'elastic.out(1, 0.32)' }, reach + 0.09);
  }
}

/** Sparks, thrown out from the point of the biggest landing. */
function sparks(prop: Scene['prop'], point: Point) {
  for (let i = 0; i < 18; i++) {
    const spark = prop('sport-spark', point.x, point.y);
    const turn = (i / 18) * Math.PI * 2 + gsap.utils.random(-0.2, 0.2);
    const far = gsap.utils.random(90, 300);
    gsap.to(spark, { x: point.x + Math.cos(turn) * far, y: point.y + Math.sin(turn) * far, opacity: 0, scale: 0.2, duration: gsap.utils.random(0.5, 0.9), ease: 'power3.out' });
  }
}

/** Plays one short moment across the wall, then leaves the wall as it was. */
export function playSport(name: Play, wall: HTMLElement, done: () => void): void {
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const grid = wall.querySelector<HTMLElement>(':scope > div')!;
  const gridBox = grid.getBoundingClientRect();

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

  // Every place something lands, in the order the play was written.
  const landings: { at: number; point: Point }[] = [];
  let slow: gsap.core.Timeline | null = null;

  const finish = () => {
    if (!stage.isConnected) return;
    clearTimeout(guard);
    slow?.kill();
    timeline.kill();
    stage.remove();
    for (const run of ends) run();
    gsap.set([...sheets, wall, grid, wall.querySelector('[data-centre]')], { clearProps: 'transform,x,y,rotation,scale,filter' });
    // The cat is free to go back to what she was doing.
    window.dispatchEvent(new CustomEvent('wall:cat', { detail: null }));
    done();
  };
  // If frames stop (a hidden tab, a stalled page), the wall is still left clean.
  const guard = setTimeout(finish, 12000);
  const frames: (() => void)[] = [];
  const ends: (() => void)[] = [];
  const timeline = gsap.timeline({ onComplete: finish, onUpdate: () => frames.forEach((run) => run()) });

  // The light of a flash, over everything. It is dark until a call asks for it.
  const flash = document.createElement('div');
  flash.className = 'sport-flash';
  stage.append(flash);

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
      onEnd: (run) => void ends.push(run),
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
      impact: (tl, at, point) => {
        landings.push({ at, point });
        tl.call(() => void prop('sport-impact', point.x, point.y), undefined, at);
      },
      say: (text) => void (sayLine.textContent = text),
      shout: (tl, at, word, line) => {
        tl.call(
          () => {
            // The word is set a letter at a time, so each letter can come up on its own.
            const letters = [...word].map((letter) => {
              const one = document.createElement('i');
              one.textContent = letter === ' ' ? '\u00a0' : letter;
              return one;
            });
            call.children[0].replaceChildren(...letters);
            call.children[1].textContent = line;
            gsap.fromTo(
              letters,
              { yPercent: 115, rotation: 9 },
              { yPercent: 0, rotation: 0, duration: 0.55, ease: 'back.out(2.4)', stagger: 0.035 },
            );
          },
          undefined,
          at,
        )
          // A flash, as from the stands, and the room goes dark behind the word.
          .fromTo(flash, { opacity: 0.55 }, { opacity: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, at)
          .fromTo(call, { opacity: 0 }, { opacity: 1, duration: 0.2 }, at)
          .fromTo(call.children[1], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, at + 0.45)
          .to(call, { opacity: 0, duration: 0.4 }, at + 2);
      },
    },
    timeline,
  );

  film(stage, timeline, sheets, name === 'naruto');
  // The wall feels every landing. The last one is the big one: time slows, the view pushes in, and sparks fly.
  landings.sort((one, other) => one.at - other.at);
  landings.forEach(({ at, point }, i) => {
    const last = i === landings.length - 1;
    ripple(timeline, sheets, at, point, last ? 1 : 0.4);
    if (!last) return;
    timeline
      .call(
        () => {
          sparks(prop, point);
          slow = gsap
            .timeline()
            .to(timeline, { timeScale: 0.12, duration: 0.05, ease: 'none' })
            .to(timeline, { timeScale: 1, duration: 0.32, ease: 'power2.in' }, 0.3);
        },
        undefined,
        at,
      )
      .fromTo(
        grid,
        { scale: 1 },
        { scale: 1.05, transformOrigin: `${point.x - gridBox.left}px ${point.y - gridBox.top}px`, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false },
        at,
      );
  });
}
