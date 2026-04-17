import { Link } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import styles from './BookmarksPage.module.css';

export function BookmarksPage() {
  return (
    <div className={styles.page}>
      <AppTopNav />
      <div className={styles.inner}>
        <header className={styles.head}>
          <h1 className={styles.title}>북마크</h1>
          <p className={styles.subtitle}>저장한 게시물은 &quot;저장됨&quot; 탭에서 확인할 수 있습니다.</p>
        </header>
        <Link to="/saved" className={styles.card}>
          <div className={styles.cover}>
            <img src="https://picsum.photos/seed/saved-collection/400/200" alt="" />
          </div>
          <div className={styles.cardBody}>
            <h2 className={styles.cardTitle}>저장됨</h2>
            <p className={styles.cardMeta}>서버에 연동된 저장 게시물</p>
          </div>
          <span className={styles.chevron} aria-hidden>
            ›
          </span>
        </Link>
      </div>
    </div>
  );
}
