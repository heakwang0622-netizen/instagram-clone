import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { PostOptionsMenu } from '../../components/PostOptionsMenu';
import { CommentIcon, HeartIcon } from '../../components/icons/NavIcons';
import { deletePost, likePost, unlikePost } from '../../lib/instagram-api';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import type { Post } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './PostCard.module.css';

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}분`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간`;
  return `${Math.floor(diff / 86400)}일`;
}

type Props = {
  post: Post;
  /** 삭제 후 피드에서 제거 */
  onDeleted?: (postId: string) => void;
};

export function PostCard({ post, onDeleted }: Props) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const requireLogin = useRequireLogin();
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post.likesCount);
  const media = post.media;
  const hasMany = media.length > 1;

  const toggleLike = () => {
    requireLogin(async () => {
      if (!token) return;
      const nextLiked = !liked;
      const prevLiked = liked;
      const prevLikes = likes;
      setLiked(nextLiked);
      setLikes((n) => (nextLiked ? n + 1 : n - 1));
      try {
        if (nextLiked) await likePost(token, post.id);
        else await unlikePost(token, post.id);
      } catch {
        setLiked(prevLiked);
        setLikes(prevLikes);
      }
    });
  };

  const isOwner = Boolean(user && user.id === post.user.id);

  const handleDeletePost = async () => {
    if (!token || !isOwner) return;
    if (!confirm('이 게시물을 삭제할까요?')) return;
    try {
      await deletePost(token, post.id);
      onDeleted?.(post.id);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <Link to={`/${post.user.username}`} className={styles.headLeft}>
          <Avatar src={post.user.avatarUrl} alt="" size="sm" />
          <span>{post.user.username}</span>
          {post.location && (
            <>
              <span className={styles.time}>·</span>
              <span className={styles.time}>{post.location}</span>
            </>
          )}
        </Link>
        <PostOptionsMenu
          isOwner={isOwner}
          onEdit={() => navigate(`/p/${post.id}/edit`)}
          onDelete={handleDeletePost}
        />
      </div>

      <div className={styles.mediaWrap}>
        <img
          src={media[index]?.url}
          alt={post.caption || '게시물 이미지'}
          className={styles.media}
          loading="lazy"
          onDoubleClick={() => toggleLike()}
        />
        {hasMany && (
          <>
            {index > 0 && (
              <button type="button" className={`${styles.navBtn} ${styles.prev}`} onClick={() => setIndex((i) => i - 1)} aria-label="이전 이미지">
                ‹
              </button>
            )}
            {index < media.length - 1 && (
              <button type="button" className={`${styles.navBtn} ${styles.next}`} onClick={() => setIndex((i) => i + 1)} aria-label="다음 이미지">
                ›
              </button>
            )}
            <div className={styles.dots}>
              {media.map((m, i) => (
                <span key={m.id} className={`${styles.dot} ${i === index ? styles.active : ''}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={toggleLike} aria-label={liked ? '좋아요 취소' : '좋아요'}>
          <HeartIcon size={26} filled={liked} />
        </button>
        <Link to={`/p/${post.id}`} aria-label="댓글 보기">
          <CommentIcon size={26} />
        </Link>
      </div>

      <div className={styles.likes}>좋아요 {likes.toLocaleString()}개</div>
      <div className={styles.caption}>
        <Link to={`/${post.user.username}`}>{post.user.username}</Link>{' '}
        {post.caption}
      </div>
      {post.commentsCount > 0 && (
        <Link to={`/p/${post.id}`} className={styles.viewComments}>
          댓글 {post.commentsCount}개 모두 보기
        </Link>
      )}
      <div className={styles.timeRow}>{formatTime(post.createdAt)} 전</div>
    </article>
  );
}
