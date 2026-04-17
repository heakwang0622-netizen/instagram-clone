import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { fetchNotifications, markNotificationRead } from '../../lib/instagram-api';
import type { AppNotification } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './NotificationsPage.module.css';

function label(n: AppNotification) {
  switch (n.type) {
    case 'like':
      return '님이 회원님의 게시물을 좋아합니다.';
    case 'follow':
      return '님이 회원님을 팔로우하기 시작했습니다.';
    case 'comment':
      return '님이 댓글을 남겼습니다.';
    case 'mention':
      return '님이 회원님을 언급했습니다.';
    default:
      return '알림';
  }
}

export function NotificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchNotifications(token);
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onRowClick = async (n: AppNotification) => {
    if (!token || n.read) return;
    try {
      await markNotificationRead(token, n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <AppTopNav />
      <div className={styles.page}>
        <header className={styles.head}>알림</header>
        {loading && <p className="ig-muted" style={{ padding: 16 }}>불러오는 중…</p>}
        {!loading &&
          items.map((n) => (
            <Link
              key={n.id}
              to={n.postId ? `/p/${n.postId}` : `/${n.actor.username}`}
              className={`${styles.row} ${n.read ? '' : styles.unread}`}
              onClick={() => onRowClick(n)}
            >
              <Avatar src={n.actor.avatarUrl} alt="" size="md" />
              <div className={styles.body}>
                <span>
                  <strong>{n.actor.username}</strong>
                  {label(n)}
                </span>
                <div className={styles.time}>{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {n.postId && (
                <img src={`https://picsum.photos/seed/post${n.postId}/88/88`} alt="" className={styles.thumb} />
              )}
            </Link>
          ))}
        {!loading && items.length === 0 && (
          <p className="ig-muted" style={{ padding: 24 }}>
            알림이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
