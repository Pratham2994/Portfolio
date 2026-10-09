import { track } from '~/lib/analytics';

import styles from './Centre.module.css';

const PANELS = ['AL', 'MO', 'ST'];

export function Centre({ className }: { className?: string }) {
  return (
    <a href="#you" className={`${styles.centre} ${className ?? ''}`} data-centre onClick={() => track('centre_clicked')}>
      <p className={styles.word}>
        <span className="sr-only">ALMOST</span>
        {PANELS.map((pair) => (
          <span key={pair} className={styles.panel} aria-hidden="true">
            <span className={styles.letters}>{pair}</span>
          </span>
        ))}
      </p>
      <p className={styles.line}>Most of my code exists because a tool almost did what I needed.</p>
      <p className={styles.name}>
        Pratham Panchal, software engineer <span className={styles.cue}>About me</span>
      </p>
    </a>
  );
}
