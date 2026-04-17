import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { fetchExplore } from '../../lib/instagram-api';
import { useAuth } from '../auth/AuthContext';
import type { Post } from '../../types';
import styles from './ExplorePage.module.css';

export function ExplorePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchExplore(token ?? null);
        if (!cancelled) setPosts(items);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '탐색을 불러올 수 없습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const gridPosts = posts.length ? posts.concat(posts) : [];

  return (
    <div className={styles.page}>
      <AppTopNav />
      <div className={styles.header}>
        <h1 className={styles.title}>탐색</h1>
        <button type="button" className={styles.searchBar} onClick={() => navigate('/search')} aria-label="검색 페이지로">
          검색
        </button>
      </div>
      {loading && <p className="ig-muted" style={{ padding: 16 }}>불러오는 중…</p>}
      {error && <p className="ig-muted" style={{ padding: 16 }}>{error}</p>}
      <div className={styles.grid}>
        {!loading &&
          gridPosts.map((post, i) => (
            <Link key={`${post.id}-${i}`} to={`/p/${post.id}`} className={styles.cell}>
              <img src={post.media[0]?.url} alt="" loading="lazy" />
              <div className={styles.overlay}>
                <span>좋아요 {post.likesCount}</span>
                <span>댓글 {post.commentsCount}</span>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
