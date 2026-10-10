import { useState, useSyncExternalStore, type CSSProperties } from 'react';

import { pieces } from '~/content';
import { track } from '~/lib/analytics';
import { prefersReducedMotion } from '~/lib/motion';

import s from './Piece.module.css';
import { useLean } from './useLean';

/** Personal pieces on the wall that are not projects. The order decides which corner each takes. */
export const PIECES = ['ticket', 'pass', 'now'] as const;
export type PieceId = (typeof PIECES)[number];

const TARGET: Record<PieceId, string> = { ticket: '#desk', pass: '#you', now: '#desk' };
const tilt = (index: number) => (((index * 37) % 7) - 3) * 0.28;

function Ticket() {
  return (
    <>
      <span className={s.kicker}>{pieces.ticket.title}</span>
      <ul className={s.fixtures}>
        {pieces.ticket.fixtures.map((fixture) => (
          <li key={fixture.sport}>
            {fixture.sport}
            <small>{fixture.side}</small>
          </li>
        ))}
      </ul>
    </>
  );
}

function Pass() {
  const { pass } = pieces;
  return (
    <>
      <span className={s.route}>
        <strong>{pass.from}</strong>
        <i aria-hidden="true" />
        <strong>{pass.to}</strong>
      </span>
      <span className={s.cities}>
        {pass.fromCity} to {pass.toCity}
      </span>
      <span className={s.note}>{pass.note}</span>
    </>
  );
}

/** The other side of the boarding pass: the road it stands for, drawn as it turns over. */
function PassBack() {
  const { pass } = pieces;
  return (
    <span className={s.back} aria-hidden="true">
      <svg viewBox="0 0 100 46" preserveAspectRatio="none">
        <path className={s.road} d="M8 34 C 26 34, 30 12, 50 16 S 76 30, 92 10" pathLength={1} />
        <circle cx="8" cy="34" r="2.6" />
        <circle className={s.arrive} cx="92" cy="10" r="2.6" />
      </svg>
      <span className={s.ends}>
        <b>{pass.fromCity}</b>
        <b>{pass.toCity}</b>
      </span>
      <span className={s.far}>150 km, door to door</span>
    </span>
  );
}

const noop = () => () => {};
/** Today, as the calendar on the wall would show it. Empty on the built page, so the two agree. */
function useToday(): string {
  return useSyncExternalStore(
    noop,
    () => new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    () => '',
  );
}

/**
 * The note is a tear-off calendar. The top page is today. Pull it, and the page under it
 * says what I was doing before.
 */
function Now({ page, tearing, onTorn }: { page: number; tearing: boolean; onTorn: () => void }) {
  const today = useToday();
  const { now } = pieces;
  const pages = [{ when: today, lines: now.more ? [...now.lines, now.more] : now.lines }, ...(now.before ?? [])];
  const shown = pages[page % pages.length];
  return (
    <span className={s.leaf} data-tearing={tearing || undefined} onAnimationEnd={tearing ? onTorn : undefined}>
      <span className={s.kicker}>{page % pages.length ? 'Before' : now.title}</span>
      <span className={s.date} data-date>
        {shown.when}
      </span>
      <ul className={s.lines}>
        {shown.lines.map((line, i) => (
          <li key={line} className={!(page % pages.length) && now.more && i === shown.lines.length - 1 ? s.more : undefined}>
            {line}
          </li>
        ))}
      </ul>
    </span>
  );
}

export function Piece({ id, index }: { id: PieceId; index: number }) {
  const leanLink = useLean<HTMLAnchorElement>();
  const leanButton = useLean<HTMLButtonElement>();
  const [page, setPage] = useState(0);
  const [tearing, setTearing] = useState(false);
  const style = { '--tilt': `${tilt(index)}deg` } as CSSProperties;

  // The calendar is the one piece you act on where it hangs, so it is a button, not a link.
  if (id === 'now') {
    const turn = () => {
      setTearing(false);
      setPage((before) => before + 1);
    };
    return (
      <button
        {...leanButton}
        type="button"
        className={`${s.piece} ${s.now}`}
        style={style}
        data-piece={id}
        aria-label="Right now. Pull the page to see what came before"
        onClick={() => {
          track('piece_clicked', { piece: id });
          if (prefersReducedMotion()) turn();
          else setTearing(true);
        }}
      >
        <span className={s.body}>
          <Now page={page} tearing={tearing} onTorn={turn} />
        </span>
      </button>
    );
  }

  const Body = id === 'ticket' ? Ticket : Pass;
  return (
    <a
      {...leanLink}
      href={TARGET[id]}
      className={`${s.piece} ${s[id]}`}
      style={style}
      data-piece={id}
      onClick={() => track('piece_clicked', { piece: id })}
    >
      <span className={s.body}>
        <Body />
      </span>
      {id === 'pass' && <PassBack />}
    </a>
  );
}
