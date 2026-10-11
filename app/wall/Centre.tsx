import { useEffect, useState } from 'react';

import { track } from '~/lib/analytics';
import { prefersReducedMotion } from '~/lib/motion';

import styles from './Centre.module.css';

/**
 * What the board says, a word at a time. Each word has six letters, two to a panel, and each
 * comes with the true line behind it. The first one is the one the page is built with.
 */
const BOARD = [
  { word: 'ALMOST', line: 'Most of my code exists because a tool almost did what I needed.' },
  { word: 'FASTER', line: 'The cat on my desk drew at 5 frames a second. Now it draws at 40.' },
  { word: 'MYSELF', line: 'The benchmarks did not agree, so I measured it myself. 4,101 runs.' },
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

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let fall = 0;
    const next = window.setInterval(() => {
      if (!watching()) return;
      setAt((before) => (before + 1) % BOARD.length);
      let now = TURNS;
      setLeft(now);
      window.clearInterval(fall);
      fall = window.setInterval(() => {
        now -= 1;
        setLeft(now);
        if (now <= 0) window.clearInterval(fall);
      }, BEAT);
    }, HOLD);
    return () => {
      window.clearInterval(next);
      window.clearInterval(fall);
    };
  }, []);

  const { word, line } = BOARD[at];
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
      <p className={styles.line} key={word} data-line>
        {line}
      </p>
      <p className={styles.name}>
        Pratham Panchal, software engineer <span className={styles.cue}>About me</span>
      </p>
    </a>
  );
}
