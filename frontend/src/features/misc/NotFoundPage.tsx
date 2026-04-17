import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>페이지를 찾을 수 없습니다</h1>
        <p className={styles.desc}>링크가 잘못되었거나 페이지가 삭제되었을 수 있습니다. 주소를 다시 확인해 주세요.</p>
        <Link to="/" className={styles.home}>
          인스타그램 클론 홈으로
        </Link>
      </div>
    </div>
  );
}
