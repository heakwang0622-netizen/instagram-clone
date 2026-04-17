import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { CommentIcon, HeartIcon, ShareIcon } from '../../components/icons/NavIcons';
import { fetchExplore, likePost, unlikePost } from '../../lib/instagram-api';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import type { Post } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './ReelsPage.module.css';

export function ReelsPage() {
  const requireLogin = useRequireLogin();
  const { token } = useAuth();
  const [reels, setReels] = useState<Post[]>([]);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  const reel = reels[index];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchExplore(token ?? null, 'video');
        if (!cancelled) {
          setReels(items);
          if (items[0]) {
            setLiked(items[0].likedByMe);
            setLikes(items[0].likesCount);
          }
        }
      } catch {
        if (!cancelled) setReels([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!reel) return;
    setLiked(reel.likedByMe);
    setLikes(reel.likesCount);
  }, [reel]);

  const toggleLike = () => {
    requireLogin(async () => {
      if (!token || !reel) return;
      const next = !liked;
      const prevL = liked;
      const prevN = likes;
      setLiked(next);
      setLikes((n) => (next ? n + 1 : n - 1));
      try {
        if (next) await likePost(token, reel.id);
        else await unlikePost(token, reel.id);
      } catch {
        setLiked(prevL);
        setLikes(prevN);
      }
    });
  };

  if (!reel) {
    return (
      <div className={styles.page}>
        <div className={styles.navSlot}>
          <AppTopNav />
        </div>
        <p style={{ padding: 24 }}>표시할 릴스(동영상 게시물)가 없습니다.</p>
      </div>
    );
  }

  const vid = reel.media.find((m) => m.mediaType === 'video') ?? reel.media[0];

  return (
    <div className={styles.page}>
      <div className={styles.navSlot}>
        <AppTopNav />
      </div>
      <div className={styles.reel}>
        {vid?.mediaType === 'video' ? (
          <video className={styles.reelMedia} src={vid.url} controls playsInline loop />
        ) : (
          <img className={styles.reelMedia} src={vid?.url} alt="" />
        )}
        <div className={styles.sideActions}>
          <button type="button" onClick={toggleLike}>
            <HeartIcon size={28} filled={liked} />
            <span>좋아요 {likes.toLocaleString()}</span>
          </button>
          <Link to={`/p/${reel.id}`}>
            <CommentIcon size={28} />
            <span>댓글 {reel.commentsCount}</span>
          </Link>
          <button type="button">
            <ShareIcon size={28} />
            <span>공유</span>
          </button>
        </div>
        <div className={styles.bottomMeta}>
          <Link to={`/${reel.user.username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            <strong>@{reel.user.username}</strong>
          </Link>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.95, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
            {reel.caption}
          </p>
        </div>
        {reels.length > 1 && (
          <div className={styles.reelNav}>
            <button type="button" disabled={index <= 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
              이전
            </button>
            <button type="button" disabled={index >= reels.length - 1} onClick={() => setIndex((i) => Math.min(reels.length - 1, i + 1))}>
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
