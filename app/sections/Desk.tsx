import { useState } from 'react';
import Markdown from 'react-markdown';

import { desk } from '~/content';
import type { DeskItem } from '~/content/schema';

import s from './Desk.module.css';

type Id = DeskItem['id'];

/** The setup, drawn flat from the front. Each group lights up when its panel is open. */
function Drawing({ active, onPick }: { active: Id; onPick: (id: Id) => void }) {
  const part = (id: Id) => ({
    className: s.object,
    'data-active': active === id || undefined,
    onClick: () => onPick(id),
  });

  return (
    <svg className={s.drawing} viewBox="0 0 800 400" aria-hidden="true" data-reveal>
      <rect className={s.top} x="0" y="330" width="800" height="8" />
      <rect className={s.leg} x="60" y="338" width="10" height="62" />
      <rect className={s.leg} x="730" y="338" width="10" height="62" />

      <g {...part('anime')}>
        <rect className={s.top} x="590" y="62" width="170" height="6" />
        <rect className={s.line} x="604" y="14" width="18" height="48" />
        <rect className={s.line} x="626" y="22" width="14" height="40" />
        <rect className={s.fill} x="644" y="8" width="20" height="54" />
        <rect className={s.line} x="668" y="26" width="12" height="36" />
        <circle className={s.line} cx="722" cy="34" r="12" />
        <rect className={s.line} x="712" y="46" width="20" height="16" />
      </g>

      <g {...part('sports')}>
        <rect className={s.line} x="92" y="64" width="124" height="226" rx="5" />
        <rect className={s.screen} x="102" y="74" width="104" height="206" />
        <rect className={s.line} x="146" y="290" width="16" height="32" />
        <rect className={s.line} x="118" y="322" width="72" height="8" />
      </g>

      <g {...part('games')}>
        <rect className={s.line} x="262" y="110" width="310" height="182" rx="5" />
        <rect className={s.screen} x="272" y="120" width="290" height="162" />
        <rect className={s.line} x="408" y="292" width="18" height="30" />
        <rect className={s.line} x="368" y="322" width="98" height="8" />
        <rect className={s.line} x="306" y="312" width="150" height="18" rx="3" />
        <rect className={s.mouse} x="474" y="314" width="26" height="16" rx="8" />
      </g>

      <g {...part('music')}>
        <rect className={s.line} x="664" y="196" width="8" height="126" />
        <rect className={s.line} x="640" y="322" width="56" height="8" />
        <path className={s.line} d="M632 232 a36 40 0 0 1 72 0" />
        <rect className={s.fill} x="622" y="226" width="16" height="40" rx="6" />
        <rect className={s.fill} x="698" y="226" width="16" height="40" rx="6" />
      </g>

      <g {...part('now')}>
        <rect className={s.deck} x="556" y="296" width="52" height="34" rx="4" />
        <rect className={s.deckScreen} x="562" y="302" width="40" height="22" />
      </g>

      <g {...part('cube')}>
        <rect className={s.line} x="226" y="302" width="28" height="28" />
        <path className={s.line} d="M235.3 302v28M244.6 302v28M226 311.3h28M226 320.6h28" />
        <rect className={s.fill} x="226" y="302" width="9.3" height="9.3" />
        <rect className={s.mouse} x="244.6" y="311.3" width="9.4" height="9.3" />
      </g>
    </svg>
  );
}

export function Desk() {
  const [active, setActive] = useState<Id>('sports');

  return (
    <section id="desk" className={s.desk} aria-labelledby="desk-title">
      <header className={s.head} data-reveal>
        <h2 id="desk-title">The desk</h2>
        <p>Under the wall. What I do when I am not building.</p>
      </header>

      <Drawing active={active} onPick={setActive} />

      <div className={s.items} data-reveal>
        {desk.map((item) => (
          <div key={item.id} className={s.item} data-open={active === item.id || undefined}>
            <h3>
              <button type="button" aria-expanded={active === item.id} aria-controls={`desk-${item.id}`} onClick={() => setActive(item.id)}>
                {item.title}
              </button>
            </h3>
            <div id={`desk-${item.id}`} className={s.panel} role="region" aria-label={item.title}>
              <Markdown>{item.body}</Markdown>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
