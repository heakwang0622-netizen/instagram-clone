import { NavLink, useLocation } from 'react-router-dom';
import { CompassIcon, HomeIcon, PlusSquareIcon, ReelsIcon, SendIcon, UserNavIcon } from '../icons/NavIcons';
import { useAuth } from '../../features/auth/AuthContext';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const loginState = { from: location.pathname + location.search };

  return (
    <nav className={styles.bar} aria-label="하단 탭">
      <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : '')}>
        {({ isActive }) => <HomeIcon size={26} active={isActive} />}
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => (isActive ? styles.active : '')}>
        {({ isActive }) => <CompassIcon size={26} active={isActive} />}
      </NavLink>
      <NavLink to="/create">
        <PlusSquareIcon size={26} />
      </NavLink>
      <NavLink to="/reels" className={({ isActive }) => (isActive ? styles.active : '')}>
        {({ isActive }) => <ReelsIcon size={26} active={isActive} />}
      </NavLink>
      <NavLink to="/direct" className={({ isActive }) => (isActive ? styles.active : '')}>
        {({ isActive }) => <SendIcon size={26} active={isActive} />}
      </NavLink>
      {isAuthenticated && user ? (
        <NavLink to={`/${user.username}`} className={({ isActive }) => (isActive ? styles.active : '')}>
          {({ isActive }) =>
            isActive ? (
              <UserNavIcon size={26} active />
            ) : (
              <img src={user.avatarUrl} alt="" width={26} height={26} className={styles.thumb} />
            )
          }
        </NavLink>
      ) : (
        <NavLink to="/login" state={loginState}>
          <UserNavIcon size={26} />
        </NavLink>
      )}
    </nav>
  );
}
