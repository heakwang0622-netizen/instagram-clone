import { Link } from 'react-router-dom';
import { HeartIcon, SendIcon } from '../icons/NavIcons';
import { MeongstagramLogo } from '../MeongstagramLogo';
import styles from './MobileHeader.module.css';

export function MobileHeader() {
  return (
    <header className={styles.header}>
      <Link to="/" aria-label="홈">
        <MeongstagramLogo variant="glyph" />
      </Link>
      <div className={styles.actions}>
        <Link to="/notifications" aria-label="알림">
          <HeartIcon size={26} />
        </Link>
        <Link to="/direct" aria-label="메시지">
          <SendIcon size={26} />
        </Link>
      </div>
    </header>
  );
}
