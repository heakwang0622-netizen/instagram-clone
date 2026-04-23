import { NavLink, useLocation } from 'react-router-dom';
import { KwangstaLogo } from '../KwangstaLogo';
import {
  CompassIcon,
  HomeIcon,
  PlusSquareIcon,
  ReelsIcon,
  SearchIcon,
  SendIcon,
  SettingsGearIcon,
  UserNavIcon,
} from '../icons/NavIcons';
import { useAuth } from '../../features/auth/AuthContext';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const loginState = { from: location.pathname + location.search };

  return (
    <aside className={styles.sidebar} aria-label="주요 메뉴">
      <div className={styles.logoRow}>
        <NavLink to="/" aria-label="홈">
          <KwangstaLogo />
        </NavLink>
      </div>
      <nav className={styles.nav}>
        <NavLink to="/" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          {({ isActive }) => (
            <>
              <HomeIcon size={26} active={isActive} />
              <span>홈</span>
            </>
          )}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <SearchIcon size={26} />
          <span>검색</span>
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          {({ isActive }) => (
            <>
              <CompassIcon size={26} active={isActive} />
              <span>탐색</span>
            </>
          )}
        </NavLink>
        <NavLink to="/reels" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          {({ isActive }) => (
            <>
              <ReelsIcon size={26} active={isActive} />
              <span>릴스</span>
            </>
          )}
        </NavLink>
        <NavLink to="/direct" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          {({ isActive }) => (
            <>
              <SendIcon size={26} active={isActive} />
              <span>메시지</span>
            </>
          )}
        </NavLink>
        <NavLink to="/create" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <PlusSquareIcon size={26} />
          <span>만들기</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <SettingsGearIcon size={26} />
          <span>설정</span>
        </NavLink>
        {isAuthenticated && user ? (
          <NavLink
            to={`/${user.username}`}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <UserNavIcon size={26} active />
                ) : (
                  <img src={user.avatarUrl} alt="" width={26} height={26} className={styles.profileThumb} />
                )}
                <span>프로필</span>
              </>
            )}
          </NavLink>
        ) : (
          <NavLink to="/login" state={loginState} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <UserNavIcon size={26} />
            <span>프로필</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
