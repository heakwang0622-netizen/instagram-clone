import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { searchUsers } from '../../lib/instagram-api';
import type { User } from '../../types';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      (async () => {
        setLoading(true);
        try {
          const rows = await searchUsers(q);
          if (!cancelled) setResults(rows);
        } catch {
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className={styles.page}>
      <AppTopNav />
      <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 0 }}>검색</h1>
      <input
        className={styles.input}
        type="search"
        placeholder="사용자 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="사용자 검색"
      />
      {loading && <p className="ig-muted">검색 중…</p>}
      <ul className={styles.list}>
        {results.map((u) => (
          <li key={u.id} className={styles.row}>
            <Link to={`/${u.username}`}>
              <Avatar src={u.avatarUrl} alt="" size="md" />
              <div className={styles.meta}>
                <strong>{u.username}</strong>
                <span>{u.fullName}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
