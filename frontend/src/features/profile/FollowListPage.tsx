import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { ChevronLeftIcon } from '../../components/icons/NavIcons';
import { fetchFollowers, fetchFollowing, fetchProfile, followUser } from '../../lib/instagram-api';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import type { User } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './FollowListPage.module.css';

export function FollowListPage({ variant }: { variant: 'followers' | 'following' }) {
  const requireLogin = useRequireLogin();
  const { username } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [list, setList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [prof, rows] = await Promise.all([
          fetchProfile(username, token ?? null),
          variant === 'followers' ? fetchFollowers(username) : fetchFollowing(username),
        ]);
        if (!cancelled) {
          setUser(prof);
          setList(rows);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, variant, token]);

  if (!username) {
    return <p style={{ padding: 24 }}>잘못된 주소입니다.</p>;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.head}>
          <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="뒤로">
            <ChevronLeftIcon />
          </button>
          <h1>{variant === 'followers' ? '팔로워' : '팔로잉'}</h1>
          <span style={{ width: 28 }} />
        </header>
        <p style={{ padding: 24 }}>불러오는 중…</p>
      </div>
    );
  }

  if (!user) {
    return <p style={{ padding: 24 }}>사용자를 찾을 수 없습니다.</p>;
  }

  const onFollow = (u: User) => {
    requireLogin(async () => {
      if (!token) return;
      try {
        await followUser(token, Number(u.id));
        setList((prev) => prev.filter((x) => x.id !== u.id));
      } catch {
        /* ignore */
      }
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeftIcon />
        </button>
        <h1>{variant === 'followers' ? '팔로워' : '팔로잉'}</h1>
        <span style={{ width: 28 }} />
      </header>
      <ul className={styles.list}>
        {list.map((u) => (
          <li key={u.id} className={styles.row}>
            <Link to={`/${u.username}`}>
              <Avatar src={u.avatarUrl} alt="" size="sm" />
              <div className={styles.meta}>
                <strong>{u.username}</strong>
                <span>{u.fullName}</span>
              </div>
            </Link>
            {variant === 'followers' && (
              <button type="button" className={styles.followBtn} onClick={() => onFollow(u)}>
                구독
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
