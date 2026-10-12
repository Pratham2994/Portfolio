import { useEffect, useState } from 'react';

import { track } from '~/lib/analytics';
import { prefersReducedMotion } from '~/lib/motion';

import styles from './Centre.module.css';

/**
 * What the board says, a word at a time. Each word has six letters, two to a panel. The first
 * is the word of the line under the board, which never changes. The others are what came of
 * that "almost", each with one small true line of its own.
 */
const BOARD = [
  { word: 'ALMOST', proof: '' },
  { word: 'FASTER', proof: 'So I made it faster: the cat on my desk went from 5 frames a second to 40.' },
  { word: 'MYSELF', proof: 'So I measured it myself: 4,101 runs, when the benchmarks did not agree.' },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// How long one card shows, how many cards later each place stops, and how long a word stays up.
const BEAT = 60;
const LAG = 3;
const HOLD = 6500;
const TURNS = 8 + 6 * LAG;

/** A card on its way to a letter: some other letter, a fixed number of cards before it. */
const spin = (letter: string, turns: number) => LETTERS[(LETTERS.indexOf(letter) + turns * 5) % 26];

/** True while the top of the home page is what the visitor is looking at. */
const watching = () =>
  !document.hidden &&
  window.scrollY < window.innerHeight * 0.5 &&
  !('projectOpen' in document.documentElement.dataset) &&
  document.querySelector('[data-wall][data-entered]') !== null;

/**
 * The centre of the wall: a split-flap board, like the one over a stadium gate. It opens on
 * ALMOST. While the wall is in view the cards fall to the next word, left to right, and the
 * line under the board changes with it.
 */
export function Centre({ className }: { className?: string }) {
  const [at, setAt] = useState(0);
  // Counts down to 0 while the cards fall. At 0 every place shows its real letter.
  const [left, setLeft] = useState(0);
  // A word put on the board from outside (the wall, when it is down). It holds until it is taken off.
  const [told, setTold] = useState<{ word: string; proof: string } | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let fall = 0;
    let held = false;
    // The cards fall to whatever the board says next.
    const flip = () => {
      let now = TURNS;
      setLeft(now);
      window.clearInterval(fall);
      fall = window.setInterval(() => {
        now -= 1;
        setLeft(now);
        if (now <= 0) window.clearInterval(fall);
      }, BEAT);
    };
    const next = window.setInterval(() => {
      if (held || !watching()) return;
      setAt((before) => (before + 1) % BOARD.length);
      flip();
    }, HOLD);
    const onBoard = (event: Event) => {
      const detail = (event as CustomEvent<{ word: string; proof: string } | null>).detail;
      held = detail !== null;
      setTold(detail);
      // Taken off, the board goes back to the word the page opens on.
      if (!detail) setAt(0);
      flip();
    };
    window.addEventListener('wall:board', onBoard);
    return () => {
      window.clearInterval(next);
      window.clearInterval(fall);
      window.removeEventListener('wall:board', onBoard);
    };
  }, []);

  const { word, proof } = told ?? BOARD[at];
  const cards = [...word].map((letter, i) => {
    // Place i stops when the count passes its own mark, so they settle one after the other.
    const turns = left - (5 - i) * LAG;
    return turns > 0 ? { letter: spin(letter, turns), moving: true } : { letter, moving: false };
  });

  return (
    <a href="#you" className={`${styles.centre} ${className ?? ''}`} data-centre data-word={word} onClick={() => track('centre_clicked', { word })}>
      <p className={styles.word}>
        {/* Read out once, as the word the page opens on. The board itself is for the eyes. */}
        <span className="sr-only">ALMOST</span>
        {[0, 2, 4].map((from) => (
          <span key={from} className={styles.panel} aria-hidden="true">
            {cards.slice(from, from + 2).map((card, i) => (
              <span key={i} className={styles.letters} data-moving={card.moving || undefined}>
                {card.letter}
              </span>
            ))}
          </span>
        ))}
      </p>
      <p className={styles.line}>Most of my code exists because a tool almost did what I needed.</p>
      {/* Empty on ALMOST. It keeps its room, so nothing moves when a line comes in. */}
      <p className={styles.proof} key={word} data-proof>
        {proof}
      </p>
      <p className={styles.name}>
        Pratham Panchal, software engineer <span className={styles.cue}>About me</span>
      </p>
    </a>
  );
}
