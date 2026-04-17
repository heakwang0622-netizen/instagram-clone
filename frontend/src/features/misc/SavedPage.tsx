import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { fetchSavedPosts } from '../../lib/instagram-api';
import type { Post } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './SavedPage.module.css';

type Tab = 'posts' | 'reels' | 'places';

export function SavedPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('posts');
  const [saved, setSaved] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const posts = await fetchSavedPosts(token);
        if (!cancelled) setSaved(posts);
      } catch {
        if (!cancelled) setSaved([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className={styles.page}>
      <AppTopNav />
      <div className={styles.inner}>
        <div className={styles.head}>
          <h1 className={styles.title}>저장됨</h1>
          <ul className={styles.tabs} role="tablist">
            <li role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'posts'}
                className={`${styles.tab} ${tab === 'posts' ? styles.tabActive : ''}`}
                onClick={() => setTab('posts')}
              >
                게시물
              </button>
            </li>
            <li role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={false}
                aria-disabled
                className={`${styles.tab} ${styles.tabDisabled}`}
                title="준비 중"
              >
                릴스
              </button>
            </li>
            <li role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={false}
                aria-disabled
                className={`${styles.tab} ${styles.tabDisabled}`}
                title="준비 중"
              >
                장소
              </button>
            </li>
          </ul>
        </div>
        <p className={styles.hint}>저장한 게시물은 서버에 연동되어 표시됩니다.</p>
        {loading && <p className="ig-muted">불러오는 중…</p>}
        <div className={styles.grid}>
          {!loading &&
            saved.map((post) => (
              <Link key={post.id} to={`/p/${post.id}`} className={styles.cell}>
                <img src={post.media[0].url} alt="" />
                {post.media.length > 1 ? (
                  <span className={styles.multiBadge} aria-label={`사진 ${post.media.length}장`}>
                    {post.media.length}
                  </span>
                ) : null}
                <span className={styles.cellOverlay} aria-hidden />
              </Link>
            ))}
        </div>
        {!loading && saved.length === 0 && (
          <p className="ig-muted" style={{ textAlign: 'center', padding: 48 }}>
            저장된 게시물이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
