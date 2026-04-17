import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InstagramLogo } from '../../components/InstagramLogo';
import { useAuth } from './AuthContext';
import styles from './LoginPage.module.css';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { register: signUp } = useAuth();
  const navigate = useNavigate();

  const canSubmit = Boolean(email.trim() && username.trim() && password.length >= 6);

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await signUp(email, username, password, fullName);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '가입에 실패했습니다.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <InstagramLogo />
          </div>
          <p className="ig-muted" style={{ marginBottom: 16 }}>
            친구들의 사진과 동영상을 보려면 가입하세요.
          </p>
          <form onSubmit={onSubmit}>
            <div className={styles.field}>
              <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className={styles.field}>
              <input type="text" placeholder="성명" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <input type="text" placeholder="사용자 이름" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className={styles.field}>
              <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {password.length > 0 && password.length < 6 ? (
              <p style={{ color: 'var(--ig-error, #ed4956)', fontSize: 13, margin: '0 0 8px', textAlign: 'left' }}>
                비밀번호를 6자 이상으로 설정해주세요
              </p>
            ) : null}
            <p className="ig-muted" style={{ fontSize: 11, marginTop: 8, textAlign: 'left' }}>
              저희 서비스를 이용하는 사람이 회원님의 연락처 정보를 인스타그램에 업로드했을 수도 있습니다. 더 알아보기
            </p>
            {error ? (
              <p className="ig-muted" style={{ color: 'var(--ig-error, #ed4956)', fontSize: 13, marginBottom: 8 }}>
                {error}
              </p>
            ) : null}
            <button type="submit" className={styles.submit} disabled={!canSubmit}>
              가입
            </button>
          </form>
        </div>
        <div className={styles.signup}>
          계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
}
