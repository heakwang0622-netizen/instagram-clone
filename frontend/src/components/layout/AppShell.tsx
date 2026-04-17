import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../features/auth/AuthContext';
import styles from './AppShell.module.css';

export function AppShell() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated && user?.isAdmin && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.sidebarSlot}>
        <Sidebar />
      </div>
      <div className={styles.main}>
        <div className={styles.mainInner}>
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
