import { Link, useNavigate } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import {
  ChevronLeftIcon,
  EditPencilIcon,
  HelpCircleIcon,
  InfoCircleIcon,
  LockClosedIcon,
  LogOutDoorIcon,
} from '../../components/icons/NavIcons';
import { useAuth } from '../auth/AuthContext';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <AppTopNav />
      <div className={styles.toolbar}>
        <Link to={user ? `/${user.username}` : '/'} className={styles.back} aria-label="뒤로">
          <ChevronLeftIcon />
        </Link>
        <h1 className={styles.title}>설정</h1>
        <span className={styles.toolbarSpacer} aria-hidden />
      </div>
      <div className={styles.inner}>
        <aside className={styles.aside} aria-label="설정 메뉴">
          <section className={styles.group}>
            <h2 className={styles.groupTitle}>계정 정보</h2>
            <nav className={styles.nav}>
              <Link to="/accounts/edit" className={styles.linkRow}>
                <span className={styles.linkIcon} aria-hidden>
                  <EditPencilIcon size={22} />
                </span>
                <span className={styles.linkText}>프로필 편집</span>
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </Link>
              <Link to="/settings/password" className={styles.linkRow}>
                <span className={styles.linkIcon} aria-hidden>
                  <LockClosedIcon size={22} />
                </span>
                <span className={styles.linkText}>비밀번호 변경</span>
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </Link>
            </nav>
          </section>
          <section className={styles.group}>
            <h2 className={styles.groupTitle}>정보</h2>
            <nav className={styles.nav}>
              <Link to="/settings/help" className={styles.linkRow}>
                <span className={styles.linkIcon} aria-hidden>
                  <HelpCircleIcon size={22} />
                </span>
                <span className={styles.linkText}>도움말</span>
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </Link>
              <Link to="/settings/about" className={styles.linkRow}>
                <span className={styles.linkIcon} aria-hidden>
                  <InfoCircleIcon size={22} />
                </span>
                <span className={styles.linkText}>정보</span>
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </Link>
              <button type="button" className={`${styles.linkRow} ${styles.logoutRow}`} onClick={handleLogout}>
                <span className={styles.linkIcon} aria-hidden>
                  <LogOutDoorIcon size={22} />
                </span>
                <span className={styles.linkText}>로그아웃</span>
              </button>
            </nav>
          </section>
          {user?.isAdmin && (
            <section className={styles.group}>
              <h2 className={styles.groupTitle}>관리자</h2>
              <nav className={styles.nav}>
                <Link to="/admin" className={styles.linkRow}>
                  <span className={styles.linkIcon} aria-hidden>
                    <InfoCircleIcon size={22} />
                  </span>
                  <span className={styles.linkText}>관리자 페이지</span>
                  <span className={styles.chevron} aria-hidden>
                    ›
                  </span>
                </Link>
              </nav>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
