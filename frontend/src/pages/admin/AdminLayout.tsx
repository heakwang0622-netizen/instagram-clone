import { useEffect, useState, type CSSProperties } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { useAuth } from '../../features/auth/AuthContext';

const navBtn = (active: boolean): CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--ig-border)',
  background: active ? 'var(--ig-link)' : 'var(--ig-surface)',
  color: active ? '#fff' : 'var(--ig-text)',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
});

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, token, logout, refreshUser } = useAuth();
  const [gate, setGate] = useState<'checking' | 'done'>('checking');
  const [allowAdmin, setAllowAdmin] = useState(false);

  useEffect(() => {
    if (!token) {
      setGate('done');
      setAllowAdmin(false);
      return;
    }
    let cancelled = false;
    void refreshUser().then((fresh) => {
      if (cancelled) return;
      setAllowAdmin(Boolean(fresh?.isAdmin));
      setGate('done');
    });
    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  if (gate === 'checking') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ig-bg)' }}>
        <AppTopNav />
        <div style={{ maxWidth: 960, margin: '24px auto', padding: 16 }} className="ig-muted">
          권한 확인 중…
        </div>
      </div>
    );
  }

  if (!allowAdmin || !token) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ig-bg)' }}>
        <AppTopNav />
        <div style={{ maxWidth: 960, margin: '24px auto', padding: 16 }}>
          <h1 style={{ marginTop: 0 }}>관리자 페이지</h1>
          <p>접근 권한이 없습니다.</p>
          {user && (
            <p className="ig-muted">
              현재 <strong>@{user.username}</strong> 로그인 상태입니다. 일반 계정이면 로그아웃 후 관리자 계정으로
              다시 로그인해 주세요.
            </p>
          )}
          <p className="ig-muted">
            관리자 계정: <strong>admin</strong> / 비밀번호: <strong>pass123</strong> (로그인 ID는{' '}
            <strong>admin</strong> 또는 이메일 필드에 동일하게 입력)
          </p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true, state: { from: '/admin' } });
            }}
          >
            관리자 계정으로 로그인 하러가기
          </button>
          <p style={{ marginTop: 12 }}>
            <Link to="/">이전 화면으로 돌아가기</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ig-bg)' }}>
      <AppTopNav />
      <div style={{ maxWidth: 1100, margin: '24px auto', padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>관리자</h1>
        <nav
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 20,
            padding: 12,
            border: '1px solid var(--ig-border)',
            borderRadius: 10,
            background: 'var(--ig-surface)',
          }}
        >
          <NavLink to="/admin" end style={({ isActive }) => navBtn(isActive)}>
            대시보드
          </NavLink>
          <NavLink to="/admin/users" style={({ isActive }) => navBtn(isActive)}>
            회원 관리
          </NavLink>
          <NavLink to="/admin/posts" style={({ isActive }) => navBtn(isActive)}>
            게시물 관리
          </NavLink>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
