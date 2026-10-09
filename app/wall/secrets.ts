import { track } from '~/lib/analytics';
import { prefersReducedMotion } from '~/lib/motion';

import { lightsOut } from './race';
import { playSport, type Sport } from './sport';

/** The small line in the corner of the wall. Each secret found moves it on to the next. */
export const HINTS = ['psst. type "meow"', 'she liked that. now type "lights out"', 'more words work. think sport, think names.', 'that is one. there are others.'];

// What to type, and what it starts. Spaces do not count.
const WORDS: Record<string, 'lights' | Sport> = {
  lightsout: 'lights',
  ferrari: 'lights',
  leclerc: 'lights',
  messi: 'messi',
  barca: 'messi',
  kohli: 'kohli',
  virat: 'kohli',
  federer: 'federer',
  roger: 'federer',
};
const LONGEST = Math.max(...Object.keys(WORDS).map((word) => word.length));
const STORE = 'wall-secrets';

// The secrets need the wide wall and a keyboard, and they are all motion.
const ROOM = '(min-width: 900px) and (orientation: landscape) and (hover: hover) and (pointer: fine)';

/** Listens for the secret words. Returns a function that stops listening. */
export function initSecrets(wall: HTMLElement, onStage: (stage: number) => void): () => void {
  let stage = 0;
  try {
    stage = Math.min(Number(localStorage.getItem(STORE)) || 0, HINTS.length - 1);
  } catch {
    // No storage. The hints start again on each visit.
  }
  onStage(stage);
  const reach = (next: number) => {
    if (next <= stage) return;
    stage = next;
    onStage(stage);
    try {
      localStorage.setItem(STORE, String(stage));
    } catch {
      // Not kept. Nothing else depends on it.
    }
  };

  let typed = '';
  let busy = false;
  const ready = () => {
    if (busy || prefersReducedMotion() || !window.matchMedia(ROOM).matches) return false;
    if (!('entered' in wall.dataset) || 'fallen' in wall.dataset || 'projectOpen' in document.documentElement.dataset) return false;
    // Only while the wall fills the screen. Nothing should play out of sight.
    const box = wall.getBoundingClientRect();
    return box.top > -window.innerHeight * 0.25 && box.bottom > window.innerHeight * 0.75;
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if ((event.target as Element).closest?.('input, textarea, select, [contenteditable]')) return;
    // The space in "lights out" would page the wall out of view, so it is held back mid-word.
    if (event.key === ' ' && !(event.target as Element).closest?.('button')) {
      const part = [3, 4, 5, 6].map((n) => typed.slice(-n)).some((end) => Object.keys(WORDS).some((w) => w.length > end.length && w.startsWith(end)));
      if (part && ready()) event.preventDefault();
      return;
    }
    if (!/^[a-z]$/i.test(event.key)) return;
    typed = (typed + event.key.toLowerCase()).slice(-LONGEST);
    const word = Object.keys(WORDS).find((w) => typed.endsWith(w));
    if (!word || !ready()) return;
    typed = '';
    busy = true;
    const done = () => void (busy = false);
    const secret = WORDS[word];
    track('secret', { name: secret, typed: word });
    if (secret === 'lights') {
      lightsOut(wall, done);
      reach(2);
    } else {
      playSport(secret, wall, done);
      reach(3);
    }
  };
  // The cat hears "meow" herself, and says so here.
  const onMeow = () => reach(1);

  window.addEventListener('keydown', onKey);
  window.addEventListener('wall:meow', onMeow);
  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('wall:meow', onMeow);
  };
}
