import { useCallback, useEffect, useRef, useState } from 'react';

import { Link } from 'react-router-dom';

import { Avatar } from '../../components/Avatar';

import { AppTopNav } from '../../components/layout/AppTopNav';

import { devProxyBackendPortLabel } from '../../lib/api';
import { fetchExplorePage, fetchFeedPage, fetchSuggestedUsers, followUser } from '../../lib/instagram-api';

import { useRequireLogin } from '../../hooks/useRequireLogin';

import type { Post, User } from '../../types';

import { useAuth } from '../auth/AuthContext';

import { PostCard } from './PostCard';

import { StoriesRow } from './StoriesRow';

import styles from './FeedPage.module.css';



export function FeedPage() {

  const { user, isAuthenticated, token } = useAuth();

  const requireLogin = useRequireLogin();

  const [feedPosts, setFeedPosts] = useState<Post[]>([]);

  const [suggestions, setSuggestions] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const remix = (items: Post[]) => [...items].sort(() => Math.random() - 0.5);



  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
    try {
      setLoadingMore(true);
      // 1) 기본: cursor 기반 다음 페이지
      // 2) 끝에 도달하면 explore를 계속 섞어 붙여서 무한 피드처럼 유지
      const page =
        hasMore && cursor
          ? isAuthenticated && token
            ? await fetchFeedPage(token, { cursor, limit: 20 })
            : await fetchExplorePage(null, { cursor, limit: 20 })
          : await fetchExplorePage(token ?? null, { limit: 20 });
      setFeedPosts((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
      if (!page.nextCursor) {
        setFeedPosts((prev) => [...prev, ...remix(page.items)]);
      }
    } catch {
      /* 추가 페이지 실패는 기존 목록 유지 */
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, isAuthenticated, loading, loadingMore, token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!isAuthenticated || !token) {
          const page = await fetchExplorePage(null, { limit: 20 });
          if (!cancelled) {
            setFeedPosts(page.items);
            setSuggestions([]);
            setCursor(page.nextCursor);
            setHasMore(Boolean(page.nextCursor));
          }
        } else {
          const feedResult = await fetchFeedPage(token, { limit: 20 });
          let sug: User[] = [];
          try {
            sug = await fetchSuggestedUsers(token);
          } catch {
            /* 추천만 실패해도 피드는 유지 */
          }
          if (!cancelled) {
            setFeedPosts(feedResult.items);
            setSuggestions(sug);
            setCursor(feedResult.nextCursor);
            setHasMore(Boolean(feedResult.nextCursor));
          }
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : '';
          const isNetwork =
            msg === 'Failed to fetch' ||
            msg.includes('NetworkError') ||
            msg.includes('네트워크');
          setError(
            isNetwork
              ? `API 서버(포트 ${devProxyBackendPortLabel()})에 연결할 수 없습니다. 터미널에서 npm run free:port 후 npm run dev를 다시 실행해 주세요. (백엔드 로그에 WinError 10048이면 포트가 다른 프로세스에 잡힌 상태입니다.)`
              : msg || '피드를 불러올 수 없습니다.',
          );
          setFeedPosts([]);
          setSuggestions([]);
          setCursor(null);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: '280px 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [loadMore]);



  const onFollowSuggested = (u: User) => {
    requireLogin(async () => {
      if (!token || u.isFollowing) return;
      try {
        await followUser(token, Number(u.id));
        const fresh = await fetchSuggestedUsers(token);
        setSuggestions(fresh);
      } catch {
        /* toast 생략 */
      }
    });
  };



  const posts = feedPosts;



  return (

    <div className={styles.page}>

      <AppTopNav />

      <div className={styles.inner}>

        <div className={styles.grid}>

          <div className={styles.feedCol}>

            <StoriesRow />

            {loading && <p className="ig-muted">불러오는 중…</p>}

            {error && !loading && (

              <p className="ig-muted" style={{ padding: 16 }}>

                {error}

              </p>

            )}

            {!loading &&

              posts.map((post, i) => (

                <PostCard
                  key={`${post.id}-${i}`}
                  post={post}
                  onDeleted={(id) => setFeedPosts((prev) => prev.filter((p) => p.id !== id))}
                />

              ))}
            {!loading && posts.length > 0 && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />}
            {loadingMore && <p className="ig-muted">더 불러오는 중…</p>}

            {!loading && !error && posts.length === 0 && (

              <p className="ig-muted" style={{ padding: 24 }}>

                표시할 게시물이 없습니다. 팔로우하거나 탐색에서 게시물을 찾아 보세요.

              </p>

            )}

          </div>

          <aside className={styles.sideCol} aria-label="추천">

            {isAuthenticated && user ? (

              <div className={styles.profileRow}>

                <Link to={`/${user.username}`}>

                  <Avatar src={user.avatarUrl} alt="" size="md" />

                  <div className={styles.profileMeta}>

                    <strong>{user.username}</strong>

                    <span>{user.fullName}</span>

                  </div>

                </Link>

              </div>

            ) : (

              <div className={styles.profileRow}>

                <Link to="/login" state={{ from: '/' }} className={styles.suggestLeft}>

                  <Avatar src="https://picsum.photos/seed/guest/150/150" alt="" size="md" />

                  <div className={styles.profileMeta}>

                    <strong style={{ color: 'var(--ig-link)' }}>로그인</strong>

                    <span>가입하면 친구 사진을 볼 수 있어요</span>

                  </div>

                </Link>

              </div>

            )}

            <div className={styles.suggestCard}>

              <div className={styles.suggestTitle}>

                <span>회원님을 위한 추천</span>

                <Link to="/explore">모두 보기</Link>

              </div>

              {suggestions.length > 0 ? (
                suggestions.map((u) => (
                  <div key={u.id} className={styles.suggestRow}>
                    <Link to={`/${u.username}`} className={styles.suggestLeft}>
                      <Avatar src={u.avatarUrl} alt="" size="sm" />
                      <div className={styles.suggestMeta}>
                        <strong>{u.username}</strong>
                        <span>{u.fullName}</span>
                      </div>
                    </Link>
                    {u.isFollowing ? (
                      <span className={styles.followingBadge}>팔로우 중</span>
                    ) : (
                      <button type="button" className={styles.followBtn} onClick={() => onFollowSuggested(u)}>
                        팔로우
                      </button>
                    )}
                  </div>
                ))
              ) : isAuthenticated ? (
                <p className="ig-muted" style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  지금은 추천할 다른 계정이 없습니다. <Link to="/search">검색</Link>이나 <Link to="/explore">탐색</Link>을
                  이용해 보세요.
                </p>
              ) : (
                <p className="ig-muted" style={{ fontSize: 13, margin: 0 }}>
                  로그인하면 팔로우하지 않은 계정을 추천해 드려요.
                </p>
              )}

            </div>

          </aside>

        </div>

        <footer className={styles.siteFooter}>

          <p className="ig-muted">

            소개 · 도움말 · 홍보 센터 · 개발자 API · 채용 정보

            <br />

            © 2026 인스타그램 클론 데모

          </p>

        </footer>

      </div>

    </div>

  );

}

