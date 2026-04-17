import styles from './Skeleton.module.css';

export function Skeleton({ className }: { className?: string }) {
  return <div className={`${styles.pulse} ${className ?? ''}`} aria-hidden />;
}

export function FeedCardSkeleton() {
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <Skeleton className={styles.avatarSk} />
        <Skeleton className={styles.lineSk} />
      </div>
      <Skeleton className={styles.mediaSk} />
      <div className={styles.cardFoot}>
        <Skeleton className={styles.shortSk} />
        <Skeleton className={styles.longSk} />
      </div>
    </article>
  );
}
