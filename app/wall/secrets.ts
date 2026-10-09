import { track } from '~/lib/analytics';
import { prefersReducedMotion } from '~/lib/motion';

import { lightsOut } from './race';
import { playSport, type Play } from './sport';

type Name = 'meow' | 'lights' | Play;

/** Every secret word, in the order of the list on the wall. `about` says only where it comes from. */
export const SECRETS: { name: Name; word: string; about: string }[] = [
  { name: 'meow', word: 'meow', about: 'the cat' },
  { name: 'lights', word: 'lights out', about: 'F1' },
  { name: 'boxbox', word: 'box box', about: 'F1' },
  { name: 'messi', word: 'messi', about: 'football' },
  { name: 'siuu', word: 'siuu', about: 'football' },
  { name: 'kohli', word: 'kohli', about: 'cricket' },
  { name: 'rcb', word: 'rcb', about: 'cricket' },
  { name: 'federer', word: 'federer', about: 'tennis' },
  { name: 'smash', word: 'smash', about: 'badminton' },
  { name: 'ace', word: 'ace', about: 'Valorant' },
  { name: 'naruto', word: 'naruto', about: 'anime' },
];

/** The small line in the corner of the wall. It leads to the first two, then to the list. */
export const HINTS = ['psst. type "meow"', 'she liked that. now type "lights out"', 'there are more. the list is right here.'];

// Other things to type that start the same secret. Spaces do not count.
const WORDS: Record<string, Exclude<Name, 'meow'>> = {
  lightsout: 'lights',
  ferrari: 'lights',
  leclerc: 'lights',
  boxbox: 'boxbox',
  messi: 'messi',
  barca: 'messi',
  siu: 'siuu',
  ronaldo: 'siuu',
  kohli: 'kohli',
  virat: 'kohli',
  rcb: 'rcb',
  federer: 'federer',
  roger: 'federer',
  smash: 'smash',
  ace: 'ace',
  valorant: 'ace',
  naruto: 'naruto',
};
const LONGEST = Math.max(...Object.keys(WORDS).map((word) => word.length));
const STORE = 'wall-secrets';

// The secrets need the wide wall and a keyboard, and they are all motion.
const ROOM = '(min-width: 900px) and (orientation: landscape) and (hover: hover) and (pointer: fine)';

export type Secrets = { stop: () => void; run: (name: Name) => void };

/**
 * Listens for the secret words. `onFound` gets the names found so far, now and on each
 * new one. `run` starts a secret by name, for the list on the wall.
 */
export function initSecrets(wall: HTMLElement, onFound: (found: Name[]) => void): Secrets {
  const found = new Set<Name>();
  try {
    const kept: unknown = JSON.parse(localStorage.getItem(STORE) ?? '[]');
    if (Array.isArray(kept)) for (const name of kept) if (SECRETS.some((secret) => secret.name === name)) found.add(name as Name);
  } catch {
    // No storage, or nothing readable in it. The list starts empty.
  }
  onFound([...found]);
  const reach = (name: Name) => {
    if (found.has(name)) return;
    found.add(name);
    onFound([...found]);
    try {
      localStorage.setItem(STORE, JSON.stringify([...found]));
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

  const run = (name: Name, typedWord?: string) => {
    if (name === 'meow') {
      // The cat listens for the word herself, so it is typed for her.
      for (const key of 'meow') window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      return;
    }
    if (!ready()) return;
    busy = true;
    const done = () => void (busy = false);
    track('secret', { name, typed: typedWord ?? 'list' });
    if (name === 'lights') lightsOut(wall, done);
    else playSport(name, wall, done);
    reach(name);
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
    run(WORDS[word], word);
  };
  // The cat hears "meow" herself, and says so here.
  const onMeow = () => reach('meow');

  window.addEventListener('keydown', onKey);
  window.addEventListener('wall:meow', onMeow);
  return {
    run,
    stop: () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wall:meow', onMeow);
    },
  };
}
