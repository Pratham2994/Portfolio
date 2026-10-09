import gsap from 'gsap';

export type Play = 'messi' | 'kohli' | 'federer' | 'rcb' | 'siuu' | 'smash' | 'ace' | 'boxbox' | 'naruto';

type Timeline = gsap.core.Timeline;

type Scene = {
  wall: HTMLElement;
  sheets: HTMLElement[];
  box: DOMRect;
  /** The ball. Moving `ball` moves it across the screen; `spin` is the part that turns and arcs. */
  ball: HTMLElement;
  spin: HTMLElement;
  /** Puts one more thing on the stage, centred on a point of the screen. */
  prop: (name: string, x: number, y: number, tag?: string) => HTMLElement;
  /** A small line of commentary while the play is on. */
  say: (text: string) => void;
  /** The big call at the end, with one line under it. */
  shout: (timeline: Timeline, at: number, word: string, line: string) => void;
};

const centreOf = (el: Element) => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

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

/** A free kick, curled into the top corner. The sheet up there takes it like a net. */
function messi({ wall, sheets, box, ball, spin, say, shout }: Scene, timeline: Timeline) {
  // The top corner: the highest sheet on the right half of the wall.
  const right = sheets.filter((sheet) => centreOf(sheet).x > box.left + box.width * 0.6);
  const net = right.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] ?? sheets[0];
  const from = { x: box.left + box.width * 0.14, y: box.bottom - 70 };
  const to = centreOf(net);
  say('Free kick. Twenty five yards out.');
  timeline
    .set(ball, { x: from.x, y: from.y, scale: 1.7, opacity: 0 })
    .to(ball, { opacity: 1, duration: 0.2 }, 0)
    // Straight across, but late to come down: that is the curl.
    .to(ball, { x: to.x, duration: 0.95, ease: 'power1.in' }, 0.9)
    .to(ball, { y: to.y, duration: 0.95, ease: 'power2.out' }, 0.9)
    .to(ball, { scale: 0.85, duration: 0.95, ease: 'none' }, 0.9)
    .to(spin, { rotation: 900, duration: 0.95, ease: 'none' }, 0.9)
    .call(() => say(''), undefined, 1.85)
    .to(ball, { y: to.y + 90, opacity: 0, duration: 0.6, ease: 'power2.in' }, 1.9);
  hit(timeline, wall, net, 1.85);
  shout(timeline, 1.9, 'Goooal', 'Messi. Top corner. The keeper did not move.');
}

/** A cover drive. The ball comes in, the centre piece meets it, and the crowd goes up. */
function kohli({ wall, sheets, box, ball, spin, say, shout }: Scene, timeline: Timeline) {
  const bat = wall.querySelector('[data-centre]');
  const middle = bat ? centreOf(bat) : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  say('Good length. Just outside off.');
  timeline
    .set(ball, { x: window.innerWidth + 40, y: middle.y - 90, scale: 0.9, opacity: 1 })
    .to(ball, { x: middle.x + 40, y: middle.y + 10, duration: 0.5, ease: 'none' }, 0.7)
    .to(spin, { rotation: -540, duration: 0.5, ease: 'none' }, 0.7)
    // Off the middle of the bat, along the ground, and gone.
    .to(ball, { x: -60, y: box.bottom - 40, scale: 1.5, duration: 0.6, ease: 'power1.out' }, 1.2)
    .to(spin, { rotation: 900, duration: 0.6, ease: 'none' }, 1.2)
    .call(() => say(''), undefined, 1.25);
  if (bat) timeline.fromTo(bat, { rotation: 4 }, { rotation: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.25)', immediateRender: false }, 1.2);
  hit(timeline, wall, null, 1.2);
  wave(timeline, sheets, 1.75);
  shout(timeline, 1.8, 'Four', 'Kohli. Cover drive. Nobody ran.');
}

/** A short rally, called point by point, and then an ace. */
function federer({ box, ball, spin, say, shout }: Scene, timeline: Timeline) {
  const left = box.left + box.width * 0.08;
  const right = box.left + box.width * 0.92;
  const line = box.top + box.height * 0.55;
  const SHOT = 0.5;
  timeline.set(ball, { x: left, y: line, scale: 1, opacity: 1 });
  ['15 - 0', '30 - 0', '40 - 0'].forEach((score, i) => {
    const at = 0.3 + i * SHOT;
    timeline
      .to(ball, { x: i % 2 ? left : right, duration: SHOT, ease: 'none' }, at)
      // Up over the net and down again.
      .to(spin, { y: -110, duration: SHOT / 2, ease: 'power1.out', yoyo: true, repeat: 1 }, at)
      .call(() => say(score), undefined, at + SHOT);
  });
  // The ace is flat, and too fast to watch.
  const ace = 0.3 + 3 * SHOT + 0.25;
  timeline
    .to(ball, { x: -80, y: line + 60, duration: 0.2, ease: 'none' }, ace)
    .call(() => say(''), undefined, ace + 0.2);
  shout(timeline, ace + 0.2, 'Game', 'Federer. One hand. No sweat.');
}

/** The cup stays in Bengaluru. Red and gold over everything, and paper from the roof. */
function rcb({ sheets, box, prop, shout }: Scene, timeline: Timeline) {
  const tint = prop('sport-tint', 0, 0);
  timeline.fromTo(tint, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0).to(tint, { opacity: 0, duration: 0.7 }, 2.5);
  for (let i = 0; i < 46; i++) {
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
  shout(timeline, 0.25, 'Ee sala bhi', 'Cup namdu. Bengaluru keeps it.');
}

/** Wrong player. Nothing happens, and the wall says why. */
function siuu({ say }: Scene, timeline: Timeline) {
  timeline
    .call(() => say('Wrong wall.'), undefined, 0.9)
    .to({}, { duration: 2.2 }, 0.9)
    .call(() => say(''));
}

/** A lift that hangs in the air too long, and what happens to it. One sheet pays for it. */
function smash({ wall, sheets, box, prop, say, shout }: Scene, timeline: Timeline) {
  // It lands on the lowest sheet on the left half of the wall.
  const left = sheets.filter((sheet) => centreOf(sheet).x < box.left + box.width * 0.5);
  const target = left.sort((a, b) => centreOf(b).y - centreOf(a).y)[0] ?? sheets[0];
  const to = centreOf(target);
  const apex = { x: box.left + box.width * 0.6, y: box.top + box.height * 0.2 };
  const shuttle = prop('sport-shuttle', apex.x + 60, -50);
  say('A high lift. Much too high.');
  timeline
    .to(shuttle, { x: apex.x, y: apex.y, duration: 1.5, ease: 'sine.out' }, 0.2)
    .fromTo(shuttle, { rotation: -14 }, { rotation: 14, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 2 }, 0.2)
    // The jump, and then it is already there.
    .set(shuttle, { rotation: (Math.atan2(to.y - apex.y, to.x - apex.x) * 180) / Math.PI - 90 }, 1.75)
    .to(shuttle, { x: to.x, y: to.y, duration: 0.13, ease: 'none' }, 1.75)
    .call(() => say(''), undefined, 1.88)
    .fromTo(target, { rotation: -13, y: 24, scale: 0.9 }, { rotation: 0, y: 0, scale: 1, duration: 1, ease: 'elastic.out(1.1, 0.3)', immediateRender: false }, 1.88)
    .fromTo(wall, { x: -14, y: 9 }, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1.3, 0.25)', immediateRender: false }, 1.88)
    .to(shuttle, { x: to.x - 70, y: to.y + 150, rotation: -220, opacity: 0, duration: 0.65, ease: 'power1.in' }, 1.9);
  shout(timeline, 1.95, 'Smash', 'Badminton. The one sport I can really play.');
}

/** Five sheets, five shots to the head, one after the other. */
function ace({ sheets, prop, say, shout }: Scene, timeline: Timeline) {
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
  });
  const end = 0.45 + targets.length * GAP + 0.2;
  timeline.to(aim, { opacity: 0, duration: 0.2 }, end).call(() => say(''), undefined, end);
  shout(timeline, end, 'Ace', 'Five shots. Basic FPS player. Still counts.');
}

/** A pit stop. One poster goes up on the jacks, the cat runs over to watch, four tyres change. */
function boxbox({ sheets, box, prop, say, shout }: Scene, timeline: Timeline) {
  // The car: a poster in the top row, where the cat can reach it.
  const posters = sheets.filter((sheet) => 'poster' in sheet.dataset);
  const top = Math.min(...posters.map((sheet) => sheet.getBoundingClientRect().top));
  const row = posters.filter((sheet) => sheet.getBoundingClientRect().top - top < 40);
  const car = row.sort((a, b) => Math.abs(centreOf(a).x - (box.left + box.width / 2)) - Math.abs(centreOf(b).x - (box.left + box.width / 2)))[0] ?? sheets[0];
  window.dispatchEvent(new CustomEvent('wall:cat', { detail: car }));

  const rect = car.getBoundingClientRect();
  const corners = [0.24, 0.8].flatMap((down) => [rect.left, rect.right].map((x) => ({ x, y: rect.top + rect.height * down })));
  const side = (i: number) => (i % 2 ? 1 : -1);
  const worn = corners.map(({ x, y }) => prop('sport-tyre', x, y));
  const fresh = corners.map(({ x, y }) => prop('sport-tyre', x, y));
  fresh.forEach((tyre) => (tyre.dataset.soft = ''));
  const clock = { time: 0 };

  say('Box box.');
  timeline
    .set(fresh, { opacity: 0 })
    .fromTo(worn, { scale: 0 }, { scale: 1, duration: 0.15, stagger: 0.03 }, 0.3)
    // Up on the jacks.
    .to(car, { y: -10, scale: 1.04, duration: 0.25, ease: 'power2.out' }, 0.5)
    .to(clock, { time: 2.1, duration: 2.1, ease: 'none', onUpdate: () => say(`Pit ${clock.time.toFixed(1)}s`) }, 0.75)
    .fromTo(car, { rotation: -0.7 }, { rotation: 0.7, duration: 0.05, repeat: 17, yoyo: true, immediateRender: false }, 1.9);
  corners.forEach(({ x }, i) => {
    timeline
      .to(worn[i], { x: x + side(i) * 150, rotation: side(i) * 360, opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.85 + i * 0.08)
      .fromTo(
        fresh[i],
        { x: x + side(i) * 150, rotation: side(i) * 360, opacity: 0 },
        { x, rotation: 0, opacity: 1, duration: 0.45, ease: 'power2.out', immediateRender: false },
        1.5 + i * 0.08,
      );
  });
  timeline
    // Down, and away.
    .to(car, { y: 0, scale: 1, rotation: 0, duration: 0.35, ease: 'bounce.out' }, 2.85)
    .to(fresh, { opacity: 0, duration: 0.3 }, 3)
    .call(() => say(''), undefined, 2.9);
  shout(timeline, 2.9, '2.1s', 'Box box. Softs on. Go go go.');
}

/** Three more cats, out of a puff of smoke. They hop about for a moment, and then they are smoke again. */
function naruto({ wall, box, prop, say }: Scene, timeline: Timeline) {
  const cat = wall.querySelector<HTMLCanvasElement>('[data-cat]');
  if (!cat) return;
  const rect = cat.getBoundingClientRect();
  const home = centreOf(cat);
  const poof = (at: number, x: number, y: number) => timeline.call(() => void prop('sport-poof', x, y), undefined, at);

  const clones = [-170, 150, 300].map((far) => {
    const clone = prop('sport-clone', home.x, home.y, 'canvas') as HTMLCanvasElement;
    clone.width = cat.width;
    clone.height = cat.height;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    const x = gsap.utils.clamp(box.left + 30, box.right - 30, home.x + far);
    return { clone, x, pen: clone.getContext('2d') };
  });
  // Each clone copies her, frame by frame, so their legs move with hers.
  timeline.eventCallback('onUpdate', () => {
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
      .set(clone, { opacity: 0 }, 3.1 + i * 0.15);
    poof(3.1 + i * 0.15, x, home.y);
  });
  timeline
    .call(() => say('They never last.'), undefined, 3.1)
    .to({}, { duration: 1.5 }, 3.4)
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
  const guard = setTimeout(finish, 10000);
  const timeline = gsap.timeline({ onComplete: finish });

  PLAYS[name].play(
    {
      wall,
      sheets,
      box: grid.getBoundingClientRect(),
      ball,
      spin,
      prop: (className, x, y, tag = 'div') => {
        const node = document.createElement(tag);
        node.className = className;
        // Under the commentary and the call, which are the last things on the stage.
        stage.insertBefore(node, sayLine);
        gsap.set(node, { x, y });
        return node;
      },
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
