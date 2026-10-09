import gsap from 'gsap';

export type Sport = 'messi' | 'kohli' | 'federer';

type Scene = {
  wall: HTMLElement;
  sheets: HTMLElement[];
  box: DOMRect;
  /** The ball. Moving `ball` moves it across the screen; `spin` is the part that turns and arcs. */
  ball: HTMLElement;
  spin: HTMLElement;
  /** A small line of commentary while the play is on. */
  say: (text: string) => void;
  /** The big call at the end, with one line under it. */
  shout: (timeline: gsap.core.Timeline, at: number, word: string, line: string) => void;
};

const centreOf = (el: Element) => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

// The knock a sheet and the wall take when something hits them.
function hit(timeline: gsap.core.Timeline, wall: HTMLElement, sheet: Element | null, at: number) {
  if (sheet) timeline.fromTo(sheet, { scale: 0.9 }, { scale: 1, duration: 0.55, ease: 'back.out(4)', immediateRender: false }, at);
  timeline.fromTo(wall, { x: 7, y: -4 }, { x: 0, y: 0, duration: 0.35, ease: 'elastic.out(1.2, 0.3)', immediateRender: false }, at);
}

/** A free kick, curled into the top corner. The sheet up there takes it like a net. */
function messi({ wall, sheets, box, ball, spin, say, shout }: Scene, timeline: gsap.core.Timeline) {
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
function kohli({ wall, sheets, box, ball, spin, say, shout }: Scene, timeline: gsap.core.Timeline) {
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
  // The stands: every sheet gets up and sits down, left to right.
  const stands = sheets.slice().sort((a, b) => centreOf(a).x - centreOf(b).x);
  stands.forEach((sheet, i) => {
    timeline.to(sheet, { y: -16, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1 }, 1.75 + i * 0.045);
  });
  shout(timeline, 1.8, 'Four', 'Kohli. Cover drive. Nobody ran.');
}

/** A short rally, called point by point, and then an ace. */
function federer({ box, ball, spin, say, shout }: Scene, timeline: gsap.core.Timeline) {
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

const PLAYS: Record<Sport, { ball: string; play: (scene: Scene, timeline: gsap.core.Timeline) => void }> = {
  messi: { ball: 'football', play: messi },
  kohli: { ball: 'cricket', play: kohli },
  federer: { ball: 'tennis', play: federer },
};

/** Plays one short moment of sport across the wall, then leaves the wall as it was. */
export function playSport(name: Sport, wall: HTMLElement, done: () => void): void {
  const sheets = gsap.utils.toArray<HTMLElement>('[data-poster], [data-piece]', wall);
  const grid = wall.querySelector<HTMLElement>(':scope > div')!;

  const stage = document.createElement('div');
  stage.className = 'sport';
  stage.dataset.sport = name;
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `<div class="sport-ball" data-ball="${PLAYS[name].ball}"><i></i></div><p class="sport-say"></p><div class="sport-call"><strong></strong><span></span></div>`;
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
    gsap.set([...sheets, wall, wall.querySelector('[data-centre]')], { clearProps: 'transform,x,y,rotation,scale' });
    done();
  };
  // If frames stop (a hidden tab, a stalled page), the wall is still left clean.
  const guard = setTimeout(finish, 9000);
  const timeline = gsap.timeline({ onComplete: finish });

  PLAYS[name].play(
    {
      wall,
      sheets,
      box: grid.getBoundingClientRect(),
      ball,
      spin,
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
