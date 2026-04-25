import styles from './CloudDecoration.module.css';

function Cloud({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="45" rx="52" ry="16" fill="currentColor" />
      <ellipse cx="40" cy="38" rx="24" ry="20" fill="currentColor" />
      <ellipse cx="70" cy="33" rx="30" ry="24" fill="currentColor" />
      <ellipse cx="92" cy="40" rx="20" ry="16" fill="currentColor" />
    </svg>
  );
}

export function CloudDecoration() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <Cloud className={`${styles.cloud} ${styles.c1}`} />
      <Cloud className={`${styles.cloud} ${styles.c2}`} />
      <Cloud className={`${styles.cloud} ${styles.c3}`} />
      <Cloud className={`${styles.cloud} ${styles.c4}`} />
      <Cloud className={`${styles.cloud} ${styles.c5}`} />
    </div>
  );
}
