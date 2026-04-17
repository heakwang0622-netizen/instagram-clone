import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { fetchSuggestedUsers } from '../../lib/instagram-api';
import type { User } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './StoriesRow.module.css';

export function StoriesRow() {
  const { user, token, isAuthenticated } = useAuth();
  const [stories, setStories] = useState<User[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      setStories([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sug = await fetchSuggestedUsers(token);
        const merged = [user, ...sug.filter((u) => u.id !== user.id).slice(0, 8)];
        if (!cancelled) setStories(merged);
      } catch {
        if (!cancelled) setStories([user]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={styles.row} role="list">
      {stories.map((u) => (
        <Link key={u.id} to={`/${u.username}`} className={styles.item} role="listitem">
          <Avatar src={u.avatarUrl} alt="" size="lg" border />
          <span>{u.username}</span>
        </Link>
      ))}
    </div>
  );
}
