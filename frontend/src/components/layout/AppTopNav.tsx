import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MeongstagramLogo } from '../MeongstagramLogo';
import {
  CameraIcon,
  HeartIcon,
  HomeIcon,
  LogOutDoorIcon,
  PlusSquareIcon,
  SearchIcon,
  SendIcon,
  SettingsGearIcon,
  UserNavIcon,
} from '../icons/NavIcons';
import { devProxyBackendPortLabel } from '../../lib/api';
import { uploadAvatar } from '../../lib/instagram-api';
import { useAuth } from '../../features/auth/AuthContext';
import styles from './AppTopNav.module.css';

export function AppTopNav() {
  const { user, isAuthenticated, logout, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const loginState = { from: location.pathname + location.search };

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const onAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !token) return;
    try {
      await uploadAvatar(token, f);
      await refreshUser();
      setMenuOpen(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const base = raw.trim() || '프로필 사진을 변경하지 못했습니다.';
      const hint =
        /\(404\)|Not Found|찾을 수 없습니다/i.test(base)
          ? `\n\n백엔드(API, 포트 ${devProxyBackendPortLabel()})를 한 번 종료한 뒤 다시 실행해 주세요. (코드에 프로필 사진 업로드가 반영된 프로세스여야 합니다.)`
          : '';
      alert(base + hint);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/" aria-label="홈">
          <MeongstagramLogo variant="word" />
        </Link>
      </div>
      <nav className={styles.nav} aria-label="빠른 이동">
        <NavLink to="/" end className={styles.iconLink} aria-label="홈">
          {({ isActive }) => <HomeIcon size={24} active={isActive} />}
        </NavLink>
        <NavLink to="/direct" className={styles.iconLink} aria-label="메시지">
          {({ isActive }) => <SendIcon size={24} active={isActive} />}
        </NavLink>
        <NavLink to="/create" className={styles.iconLink} aria-label="만들기">
          <PlusSquareIcon size={24} />
        </NavLink>
        <NavLink to="/search" className={styles.iconLink} aria-label="검색">
          {({ isActive }) => <SearchIcon size={24} active={isActive} />}
        </NavLink>
        <NavLink to="/notifications" className={styles.iconLink} aria-label="알림">
          <HeartIcon size={24} />
        </NavLink>
        {isAuthenticated && user ? (
          <div className={styles.profileWrap} ref={wrapRef}>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              className={styles.hiddenFile}
              tabIndex={-1}
              aria-label="프로필 사진 파일 선택"
              onChange={onAvatarFileChange}
            />
            <button
              type="button"
              className={styles.profileTrigger}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="계정 메뉴"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <img src={user.avatarUrl} alt="" className={styles.profileThumb} width={26} height={26} />
            </button>
            {menuOpen ? (
              <div className={styles.profileMenu} role="menu">
                <Link role="menuitem" to={`/${user.username}`} onClick={() => setMenuOpen(false)}>
                  <span className={styles.menuItemIcon} aria-hidden>
                    <UserNavIcon size={20} />
                  </span>
                  프로필
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <span className={styles.menuItemIcon} aria-hidden>
                    <CameraIcon size={20} />
                  </span>
                  프로필 사진 변경
                </button>
                <Link role="menuitem" to="/settings" onClick={() => setMenuOpen(false)}>
                  <span className={styles.menuItemIcon} aria-hidden>
                    <SettingsGearIcon size={20} />
                  </span>
                  설정
                </Link>
                {user.isAdmin && (
                  <Link role="menuitem" to="/admin" onClick={() => setMenuOpen(false)}>
                    <span className={styles.menuItemIcon} aria-hidden>
                      <SettingsGearIcon size={20} />
                    </span>
                    관리자 대시보드
                  </Link>
                )}
                <div className={styles.menuDivider} role="presentation" />
                <button type="button" role="menuitem" className={styles.logoutBtn} onClick={handleLogout}>
                  <span className={styles.menuItemIcon} aria-hidden>
                    <LogOutDoorIcon size={20} />
                  </span>
                  로그아웃
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <NavLink to="/login" state={loginState} className={styles.iconLink} aria-label="프로필">
            <UserNavIcon size={24} />
          </NavLink>
        )}
      </nav>
    </header>
  );
}
