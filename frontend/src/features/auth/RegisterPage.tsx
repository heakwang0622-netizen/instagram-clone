import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MeongstagramLogo } from '../../components/MeongstagramLogo';
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
      setError(err instanceof Error ? err.message : '??? ??????.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <MeongstagramLogo />
          </div>
          <p className="ig-muted" style={{ marginBottom: 16 }}>
            ??? ??? ??? ????? ?????.
          </p>
          <form onSubmit={onSubmit}>
            <div className={styles.field}>
              <input type="email" placeholder="???" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className={styles.field}>
              <input type="text" placeholder="??" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <input type="text" placeholder="??? ??" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className={styles.field}>
              <input type="password" placeholder="????" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {password.length > 0 && password.length < 6 ? (
              <p style={{ color: 'var(--ig-error, #ed4956)', fontSize: 13, margin: '0 0 8px', textAlign: 'left' }}>
                ????? 6? ???? ??? ???.
              </p>
            ) : null}
            <p className="ig-muted" style={{ fontSize: 11, marginTop: 8, textAlign: 'left' }}>
              ?? ???? ???? ??? ???? ??? ??? ?????? ????? ?? ????. ? ????
            </p>
            {error ? (
              <p className="ig-muted" style={{ color: 'var(--ig-error, #ed4956)', fontSize: 13, marginBottom: 8 }}>
                {error}
              </p>
            ) : null}
            <button type="submit" className={styles.submit} disabled={!canSubmit}>
              ??
            </button>
          </form>
        </div>
        <div className={styles.signup}>
          ??? ?????? <Link to="/login">???</Link>
        </div>
      </div>
    </div>
  );
}
