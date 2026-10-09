import { useEffect, useState, type ReactNode } from 'react';

import { desk } from '~/content';
import type { DeskId } from '~/content/schema';
import { prefersReducedMotion } from '~/lib/motion';
import { track } from '~/lib/analytics';

import s from './Desk.module.css';
import { DeskScene } from './DeskScene';

// The room light. Each press of the switch moves to the next colour.
const ROOMS = ['white', 'purple', 'red', 'cyan', 'green', 'amber'] as const;

const ORDER: DeskId[] = ['sports', 'games', 'anime', 'music', 'pc', 'cube', 'now'];

/** A scoreboard: the sport, and whose side he is on. */
function Sports() {
  return (
    <table className={s.board}>
      <thead>
        <tr>
          <th scope="col">Sport</th>
          <th scope="col">My side</th>
        </tr>
      </thead>
      <tbody>
        {desk.sports.rows.map((row) => (
          <tr key={row.sport}>
            <th scope="row">{row.sport}</th>
            <td>{row.side}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A game launcher: the one he plays most, the shelf of story games, co-op, and the first install. */
function Games() {
  const { main, story, coop, first } = desk.games;
  return (
    <div className={s.launcher}>
      <p className={s.featured}>
        <span>Most played</span>
        <strong>{main}</strong>
      </p>
      <div>
        <h4>Story</h4>
        <ul className={s.tiles}>
          {story.map((game) => (
            <li key={game}>{game}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4>Co-op</h4>
        <ul className={s.tiles}>
          {coop.map((game) => (
            <li key={game}>{game}</li>
          ))}
        </ul>
      </div>
      <p className={s.first}>
        <span>First install</span> {first}
      </p>
    </div>
  );
}

/** A page of manga panels, one title in each. */
function Anime() {
  return (
    <ol className={s.panels}>
      {desk.anime.list.map((title) => (
        <li key={title}>{title}</li>
      ))}
    </ol>
  );
}

/** One big number and a strip of level bars. */
function Music() {
  return (
    <div className={s.music}>
      <p className={s.minutes}>{desk.music.minutes}</p>
      <div className={s.levels} aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <i key={i} style={{ animationDelay: `-${(i * 173) % 1100}ms`, animationDuration: `${700 + ((i * 97) % 600)}ms` }} />
        ))}
      </div>
    </div>
  );
}

/** A spec sheet, like the label on the side of the box. */
function Pc() {
  return (
    <dl className={s.specs}>
      {desk.pc.specs.map((spec) => (
        <div key={spec.part}>
          <dt>{spec.part}</dt>
          <dd>
            {spec.name}
            {spec.quip && <span>{spec.quip}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const FACE = ['#ffc21a', '#ece8df', '#3ddc84', '#ff3b3b', '#ffc21a', '#2f6bff', '#ff7a1a', '#3ddc84', '#ece8df'];

/** A stopwatch that runs up to his best time, beside one face of the cube. */
function Cube({ running }: { running: boolean }) {
  const best = desk.cube.best;
  const [seconds, setSeconds] = useState(best);
  useEffect(() => {
    if (!running || prefersReducedMotion()) return;
    const started = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      // The watch runs fifteen times faster than a real solve, then stops on the best time.
      const value = Math.min(((now - started) / 1000) * 15, best);
      setSeconds(value);
      if (value < best) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [running, best]);

  return (
    <div className={s.cube}>
      <div className={s.face} aria-hidden="true">
        {FACE.map((colour, i) => (
          <i key={i} style={{ background: colour }} />
        ))}
      </div>
      <p className={s.watch} data-watch>
        {seconds.toFixed(2)}
        <span>seconds</span>
      </p>
    </div>
  );
}

/** A terminal, with what he is doing this month. */
function Now() {
  return (
    <ul className={s.terminal}>
      {desk.now.lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export function Desk() {
  const [active, setActive] = useState<DeskId>('sports');
  const [light, setLight] = useState(0);
  const pick = (id: DeskId) => {
    setActive(id);
    track('desk_card', { card: id });
  };
  const room = ROOMS[light];

  const cards: Record<DeskId, { note?: string; body: ReactNode }> = {
    sports: { note: desk.sports.note, body: <Sports /> },
    games: { note: desk.games.note, body: <Games /> },
    anime: { note: desk.anime.note, body: <Anime /> },
    music: { note: desk.music.note, body: <Music /> },
    pc: { note: desk.pc.note, body: <Pc /> },
    cube: { note: desk.cube.note, body: <Cube running={active === 'cube'} /> },
    now: { body: <Now /> },
  };

  return (
    <section id="desk" className={s.desk} aria-labelledby="desk-title" data-room={room}>
      <header className={s.head} data-reveal>
        <h2 id="desk-title">The desk</h2>
        <p>Under the wall. Pick something up.</p>
        <button type="button" className={s.switch} onClick={() => {
            const next = (light + 1) % ROOMS.length;
            setLight(next);
            track('room_light', { colour: ROOMS[next] });
          }} data-switch>
          Room light <span>{room}</span>
        </button>
      </header>

      <div className={s.stage} data-reveal>
        <DeskScene active={active} onPick={pick} />
      </div>

      <div className={s.side} data-reveal>
        <div className={s.tabs} role="group" aria-label="Things on the desk">
          {ORDER.map((id) => (
            <button key={id} type="button" aria-expanded={active === id} aria-controls={`desk-${id}`} onClick={() => pick(id)}>
              {desk[id].title}
            </button>
          ))}
        </div>

        {ORDER.map((id) => (
          <div key={id} id={`desk-${id}`} className={s.card} role="region" aria-label={desk[id].title} data-card={id} data-open={active === id || undefined}>
            <h3>{desk[id].title}</h3>
            {cards[id].body}
            {cards[id].note && <p className={s.note}>{cards[id].note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
