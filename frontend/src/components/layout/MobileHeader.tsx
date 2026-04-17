import { Link } from 'react-router-dom';
import { HeartIcon } from '../icons/NavIcons';
import { InstagramLogo } from '../InstagramLogo';
import styles from './MobileHeader.module.css';

export function MobileHeader() {
  return (
    <header className={styles.header}>
      <Link to="/" aria-label="홈">
        <InstagramLogo variant="glyph" />
      </Link>
      <div className={styles.actions}>
        <Link to="/notifications" aria-label="알림">
          <HeartIcon size={26} />
        </Link>
        <Link to="/direct" aria-label="메시지">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
