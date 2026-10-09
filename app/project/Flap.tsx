import { useEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '~/lib/motion';

import s from './Flap.module.css';

const DIGITS = '0123456789';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// How long one card shows before the next falls, and how many cards later each place stops.
const BEAT = 55;
const LAG = 3;

/** A card on its way: a digit place shows digits, a letter place shows letters. */
function spin(ch: string, turn: number): string {
  if (DIGITS.includes(ch)) return DIGITS[(DIGITS.indexOf(ch) + turn * 7) % 10];
  if (LETTERS.includes(ch.toUpperCase())) return LETTERS[(LETTERS.indexOf(ch.toUpperCase()) + turn * 5) % 26];
  return ch;
}

/**
 * A number on a split-flap board, like the one over a stadium gate. The first time it is
 * seen, each place runs through a few cards and stops on its own, left to right.
 */
export function Flap({ text }: { text: string }) {
  const box = useRef<HTMLSpanElement>(null);
  // Counts down to 0. At 0 every place shows its real character, which is also what is built.
  const [left, setLeft] = useState(0);
  const places = [...text];
  const total = 6 + places.length * LAG;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timer = 0;
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen.disconnect();
        let now = total;
        setLeft(now);
        timer = window.setInterval(() => {
          now -= 1;
          setLeft(now);
          if (now <= 0) clearInterval(timer);
        }, BEAT);
      },
      { threshold: 0.6 },
    );
    seen.observe(box.current!);
    return () => {
      seen.disconnect();
      clearInterval(timer);
    };
  }, [total]);

  return (
    <span className={s.flap} ref={box} data-flap>
      <span className="sr-only">{text}</span>
      {places.map((ch, i) => {
        // Place i stops when the count passes its own mark, so they settle one after the other.
        const turns = left - (places.length - 1 - i) * LAG;
        const moving = turns > 0;
        return (
          <span key={i} aria-hidden="true" data-moving={moving || undefined}>
            {moving ? spin(ch, turns) : ch}
          </span>
        );
      })}
    </span>
  );
}
