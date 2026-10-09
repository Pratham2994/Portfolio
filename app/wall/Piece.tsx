import type { CSSProperties } from 'react';

import { pieces } from '~/content';
import { track } from '~/lib/analytics';

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
          <li key={fixture.sport}>{fixture.sport}</li>
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

function Now() {
  return (
    <>
      <span className={s.kicker}>{pieces.now.title}</span>
      <ul className={s.lines}>
        {pieces.now.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </>
  );
}

const BODY = { ticket: Ticket, pass: Pass, now: Now };

export function Piece({ id, index }: { id: PieceId; index: number }) {
  const lean = useLean<HTMLAnchorElement>();
  const Body = BODY[id];
  return (
    <a
      {...lean}
      href={TARGET[id]}
      className={`${s.piece} ${s[id]}`}
      style={{ '--tilt': `${tilt(index)}deg` } as CSSProperties}
      data-piece={id}
      onClick={() => track('piece_clicked', { piece: id })}
    >
      <span className={s.body}>
        <Body />
      </span>
    </a>
  );
}
