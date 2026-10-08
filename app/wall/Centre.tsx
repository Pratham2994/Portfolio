import styles from './Centre.module.css';

const PANELS = ['AL', 'MO', 'ST'];

export function Centre({ className }: { className?: string }) {
  return (
    <div className={`${styles.centre} ${className ?? ''}`} data-centre>
      <p className={styles.word} aria-label="ALMOST">
        {PANELS.map((pair) => (
          <span key={pair} className={styles.panel} aria-hidden="true">
            <span className={styles.letters}>{pair}</span>
          </span>
        ))}
      </p>
      <p className={styles.line}>Most of my code exists because a tool almost did what I needed.</p>
      <p className={styles.name}>Pratham Panchal, software engineer</p>
    </div>
  );
}
