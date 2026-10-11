import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';

import { prefersReducedMotion } from '~/lib/motion';

import { CODE, DECK, MODELS, NATIVE, RUN } from './data';
import s from './Stage.module.css';

/** Counts up while the stage is on the page. With reduced motion it stays where it starts. */
function useTick(pace: number, from = 0): number {
  const [tick, setTick] = useState(from);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      // A tab in the background does not need the show.
      if (!document.hidden) setTick((before) => before + 1);
    }, pace);
    return () => window.clearInterval(timer);
  }, [pace]);
  return tick;
}

const LANGUAGES = Object.keys(CODE);
const BUTTONS = ['Step over', 'Step in', 'Step out', 'Continue'];
// The run, then a short rest on its last line before the next language takes over.
const TURN = RUN.length + 2;

/** OmniCompiler: one debugger window. The language changes, and the buttons and the run do not. */
function Omni() {
  const tick = useTick(620, 4);
  const lang = LANGUAGES[Math.floor(tick / TURN) % LANGUAGES.length];
  const step = Math.min(tick % TURN, RUN.length - 1);
  const frame = RUN[step];
  const before = RUN[Math.max(step - 1, 0)];
  // The button that brought the run to this line.
  const pressed = step === 0 ? -1 : frame.deep > before.deep ? 1 : frame.deep < before.deep ? 2 : 0;

  return (
    <div className={s.omni} role="img" aria-label="A debugger steps through the same small program in Python, JavaScript, Java, C++ and Go, with the same buttons.">
      <div className={s.tabs} aria-hidden="true">
        {LANGUAGES.map((name) => (
          <span key={name} data-on={name === lang || undefined}>
            {name}
          </span>
        ))}
      </div>
      <div className={s.editor} aria-hidden="true">
        <ol className={s.code}>
          {CODE[lang].map((text, i) => (
            <li key={i} data-at={i === frame.line || undefined}>
              <code>{text}</code>
            </li>
          ))}
        </ol>
        <dl className={s.seen}>
          <dt>{frame.deep ? 'inside area()' : 'at the top'}</dt>
          {frame.seen.map(([name, value]) => (
            // Keyed by the value, so a number that changes comes in new.
            <div key={`${name} ${value}`}>
              <dd>{name}</dd>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={s.controls} aria-hidden="true">
        {BUTTONS.map((name, i) => (
          <span key={i === pressed ? `${name} ${step}` : name} data-on={i === pressed || undefined}>
            {name}
          </span>
        ))}
        <em>
          runs on <b key={lang}>{NATIVE[lang]}</b>
        </em>
      </div>
    </div>
  );
}

const RANKS = [
  { key: 'pass', title: 'Tasks passed', show: (n: number) => `${n}%` },
  { key: 'perHour', title: 'Right answers per hour', show: (n: number) => n.toLocaleString('en') },
] as const;

/** Local LLM lab: the same five models, ranked by one number and then by the other. They change places. */
function Lab() {
  const by = RANKS[useTick(3600) % 2];
  const top = Math.max(...MODELS.map((model) => model[by.key]));
  const order = [...MODELS].sort((a, b) => b[by.key] - a[by.key]);

  return (
    <div className={s.lab} role="img" aria-label="Five models ranked by tasks passed, and then by right answers per hour. The winner is not the same.">
      <p className={s.by} aria-hidden="true">
        <span>Ranked by</span>
        {RANKS.map((rank) => (
          <b key={rank.key} data-on={rank === by || undefined}>
            {rank.title}
          </b>
        ))}
      </p>
      <ol className={s.board} aria-hidden="true">
        {MODELS.map((model) => {
          const place = order.indexOf(model);
          return (
            <li key={model.name} data-first={place === 0 || undefined} style={{ '--place': place, '--share': model[by.key] / top } as CSSProperties}>
              <span>{place + 1}</span>
              <strong>{model.name}</strong>
              <i />
              <b>{by.show(model[by.key])}</b>
            </li>
          );
        })}
      </ol>
      <p className={s.moral} aria-hidden="true">
        Same five models. Two different winners.
      </p>
    </div>
  );
}

// The home page, then one app after the other, the way a hand goes through them.
const TOUR = [null, 0, null, 3, null, 2, null, 4, null, 6, null, 11, null, 8];

/** Prats-Deck: the deck itself, large. Its screen goes from the home page into an app and back. */
function Deck() {
  const app = TOUR[useTick(1700) % TOUR.length];
  const [name, about, picture] = app === null ? ['Home', 'Fifteen apps, five across and three down.', 'home'] : DECK[app];
  const shots = ['home', ...new Set(TOUR.filter((i) => i !== null).map((i) => DECK[i][2]))];

  return (
    <div className={s.deck} role="img" aria-label="The deck, with its screen going from the home page into its apps and back.">
      <div className={s.unit} aria-hidden="true">
        <div className={s.glass}>
          {/* Every picture is there from the start, so a change of app never waits for a download. */}
          {shots.map((shot) => (
            <img key={shot} src={`/deck/${shot}.webp`} width={640} height={480} alt="" data-on={shot === picture || undefined} />
          ))}
        </div>
        <i className={s.cable} />
      </div>
      <p className={s.onScreen} aria-hidden="true">
        <span>On the screen</span>
        <strong key={name}>{name}</strong>
        <em key={about}>{about}</em>
      </p>
    </div>
  );
}

const STAGES: Record<string, { kind: 'tool' | 'study' | 'hardware'; scene: () => ReactElement }> = {
  omnicompiler: { kind: 'tool', scene: Omni },
  'local-llm-lab': { kind: 'study', scene: Lab },
  'prats-deck': { kind: 'hardware', scene: Deck },
};

/** What kind of page a project gets. Without a stage it keeps the plain one. */
export const kindOf = (slug: string) => STAGES[slug]?.kind;

/** The live scene at the top of a project page: the project doing its one thing, on a loop. */
export function Stage({ slug }: { slug: string }) {
  const Scene = STAGES[slug].scene;
  return (
    <div className={s.stage} data-stage={slug} data-in>
      <Scene />
    </div>
  );
}
