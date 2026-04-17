import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { InstagramLogo } from '../../components/InstagramLogo';
import { useAuth } from './AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const from = state?.from ?? '/';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(loggedInUser.isAdmin ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.phones} aria-hidden />
      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <InstagramLogo />
          </div>
          {error && <div className={styles.notice}>{error}</div>}
          <form onSubmit={onSubmit}>
            <div className={styles.field}>
              <input
                type="text"
                placeholder="전화번호, 사용자 이름 또는 이메일"
                autoComplete="username"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className={styles.field}>
              <input
                type="password"
                placeholder="비밀번호"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
            <button type="submit" className={styles.submit} disabled={!email.trim() || !password || pending}>
              {pending ? '로그인 중…' : '로그인'}
            </button>
          </form>
          <div>
            <Link to="#" className={styles.forgot} onClick={(e) => e.preventDefault()}>
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>
        <div className={styles.signup}>
          계정이 없으신가요? <Link to="/register">가입하기</Link>
        </div>
        <p className={styles.meta}>
          <strong>테스트 계정</strong>
          <br />
          아이디(이메일): test@gmail.com
          <br />
          비밀번호: 12345
          <br />
          <strong>관리자 계정</strong>
          <br />
          아이디: admin
          <br />
          비밀번호: pass123
          <br />
          <span className="ig-muted" style={{ fontSize: 12 }}>
            (백엔드 서버가 실행 중이어야 로그인됩니다. API가 없으면 오류가 날 수 있습니다.)
          </span>
        </p>
      </div>
    </div>
  );
}
