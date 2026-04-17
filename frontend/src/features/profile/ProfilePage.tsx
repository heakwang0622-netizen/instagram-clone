import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { MobileHeader } from '../../components/layout/MobileHeader';
import {
  fetchProfile,
  fetchUserPosts,
  followUser,
  getOrCreateConversation,
  unfollowUser,
} from '../../lib/instagram-api';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import type { Post, User } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const { username } = useParams();
  const { user: me, token } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isMe = Boolean(me && username === me.username);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, list] = await Promise.all([
          fetchProfile(username, token ?? null),
          fetchUserPosts(username, token ?? null),
        ]);
        if (!cancelled) {
          setProfileUser(p);
          setPosts(list);
        }
      } catch {
        if (!cancelled) {
          setProfileUser(null);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, token]);

  if (!username) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>잘못된 주소입니다.</p>
        <Link to="/">홈으로</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <MobileHeader />
        <p style={{ padding: 24 }}>불러오는 중…</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>사용자를 찾을 수 없습니다.</p>
        <Link to="/">홈으로</Link>
      </div>
    );
  }

  const following = profileUser.isFollowing === true;

  const toggleFollow = () => {
    requireLogin(async () => {
      if (!token) return;
      const id = Number(profileUser.id);
      try {
        if (following) {
          await unfollowUser(token, id);
          setProfileUser((u) =>
            u
              ? {
                  ...u,
                  isFollowing: false,
                  followersCount: Math.max(0, u.followersCount - 1),
                }
              : u,
          );
        } else {
          await followUser(token, id);
          setProfileUser((u) =>
            u
              ? {
                  ...u,
                  isFollowing: true,
                  followersCount: u.followersCount + 1,
                }
              : u,
          );
        }
      } catch {
        /* ignore */
      }
    });
  };

  const openDm = () => {
    requireLogin(async () => {
      if (!token) return;
      try {
        const convId = await getOrCreateConversation(token, Number(profileUser.id));
        navigate(`/direct/${convId}`);
      } catch {
        /* ignore */
      }
    });
  };

  return (
    <div className={styles.page}>
      <MobileHeader />
      <header className={styles.header}>
        <div className={styles.avatarCol}>
          <Avatar src={profileUser.avatarUrl} alt="" size="xl" />
        </div>
        <div className={styles.info}>
          <div className={styles.row1}>
            <h1 className={styles.username}>{profileUser.username}</h1>
            <div className={styles.actions}>
              {isMe ? (
                <>
                  <Link to="/accounts/edit" className={styles.btn}>
                    프로필 편집
                  </Link>
                  <Link to="/settings" className={styles.btn}>
                    설정
                  </Link>
                </>
              ) : (
                <>
                  <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={toggleFollow}>
                    {following ? '팔로잉' : '팔로우'}
                  </button>
                  <button type="button" className={styles.btn} onClick={openDm}>
                    메시지
                  </button>
                </>
              )}
            </div>
          </div>
          <div className={styles.stats}>
            <span>
              <strong>{posts.length}</strong> 게시물
            </span>
            <Link to={`/${username}/followers`}>
              <strong>{profileUser.followersCount.toLocaleString()}</strong> 팔로워
            </Link>
            <Link to={`/${username}/following`}>
              <strong>{profileUser.followingCount.toLocaleString()}</strong> 팔로잉
            </Link>
          </div>
          <div className={styles.bio}>
            <strong>{profileUser.fullName}</strong>
            {profileUser.bio && <span>{profileUser.bio}</span>}
            {profileUser.website?.trim() && (
              <a
                className={styles.website}
                href={
                  /^https?:\/\//i.test(profileUser.website.trim())
                    ? profileUser.website.trim()
                    : `https://${profileUser.website.trim()}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {profileUser.website.trim()}
              </a>
            )}
          </div>
        </div>
      </header>
      <div className={styles.tabs}>
        <Link to={`/${username}`} className={`${styles.tab} ${styles.active}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          게시물
        </Link>
        {isMe ? (
          <Link to="/saved" className={styles.tab}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            저장됨
          </Link>
        ) : (
          <span className={styles.tab}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            저장됨
          </span>
        )}
      </div>
      <div className={styles.grid}>
        {posts.map((p) => (
          <Link key={p.id} to={`/p/${p.id}`}>
            <img src={p.media[0].url} alt="" loading="lazy" />
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="ig-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
            게시물 없음
          </p>
        )}
      </div>
    </div>
  );
}
