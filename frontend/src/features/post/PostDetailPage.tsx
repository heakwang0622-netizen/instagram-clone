import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { PostOptionsMenu } from '../../components/PostOptionsMenu';
import { BookmarkIcon, ChevronLeftIcon, CommentIcon, HeartIcon } from '../../components/icons/NavIcons';
import {
  deleteComment,
  deletePost,
  fetchComments,
  fetchPost,
  likePost,
  postComment,
  savePost,
  unlikePost,
  unsavePost,
} from '../../lib/instagram-api';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import type { Comment, Post } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './PostDetailPage.module.css';

export function PostDetailPage() {
  const requireLogin = useRequireLogin();
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user: me, token } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [saved, setSaved] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const [p, c] = await Promise.all([
          fetchPost(postId, token ?? null),
          fetchComments(postId),
        ]);
        if (cancelled) return;
        setPost(p);
        setLiked(p.likedByMe);
        setLikes(p.likesCount);
        setSaved(Boolean(p.savedByMe));
        setComments(c);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, token]);

  if (!postId) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>잘못된 주소입니다.</p>
        <Link to="/">홈으로</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>불러오는 중…</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>게시물을 찾을 수 없습니다.</p>
        <Link to="/">홈으로</Link>
      </div>
    );
  }

  const media = post.media[mediaIndex];
  const hasMany = post.media.length > 1;
  const isPostOwner = Boolean(me && me.id === post.user.id);

  const handleDeletePost = async () => {
    if (!token || !isPostOwner) return;
    if (!confirm('이 게시물을 삭제할까요?')) return;
    try {
      await deletePost(token, post.id);
      navigate(`/${post.user.username}`, { replace: true });
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const toggleLike = () => {
    requireLogin(async () => {
      if (!token) return;
      const next = !liked;
      const prevL = liked;
      const prevN = likes;
      setLiked(next);
      setLikes((n) => (next ? n + 1 : n - 1));
      try {
        if (next) await likePost(token, post.id);
        else await unlikePost(token, post.id);
      } catch {
        setLiked(prevL);
        setLikes(prevN);
      }
    });
  };

  const toggleSave = () => {
    requireLogin(async () => {
      if (!token) return;
      const next = !saved;
      const prev = saved;
      setSaved(next);
      try {
        if (next) await savePost(token, post.id);
        else await unsavePost(token, post.id);
      } catch {
        setSaved(prev);
      }
    });
  };

  const submitComment = (e: FormEvent) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    requireLogin(async () => {
      if (!token) return;
      try {
        const c = await postComment(token, post.id, text);
        setComments((prev) => [...prev, c]);
        setComment('');
        setPost((p) => (p ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      } catch {
        /* ignore */
      }
    });
  };

  const removeComment = (c: Comment) => {
    requireLogin(async () => {
      if (!token || me?.username !== c.user.username) return;
      try {
        await deleteComment(token, c.id);
        setComments((prev) => prev.filter((x) => x.id !== c.id));
        setPost((p) => (p ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
      } catch {
        /* ignore */
      }
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeftIcon />
        </button>
        <strong>게시물</strong>
      </div>
      <div className={styles.mediaCol}>
        {media?.mediaType === 'video' ? (
          <video src={media.url} controls className={styles.mediaVideo} playsInline />
        ) : (
          <img src={media?.url} alt="" />
        )}
        {hasMany && (
          <>
            {mediaIndex > 0 && (
              <button type="button" className={styles.mediaNav} style={{ left: 8 }} onClick={() => setMediaIndex((i) => i - 1)} aria-label="이전">
                ‹
              </button>
            )}
            {mediaIndex < post.media.length - 1 && (
              <button type="button" className={styles.mediaNav} style={{ right: 8 }} onClick={() => setMediaIndex((i) => i + 1)} aria-label="다음">
                ›
              </button>
            )}
          </>
        )}
      </div>
      <div className={styles.side}>
        <div className={styles.sideHead}>
          <Link to={`/${post.user.username}`} className={styles.sideHeadLeft}>
            <Avatar src={post.user.avatarUrl} alt="" size="sm" />
            {post.user.username}
          </Link>
          <PostOptionsMenu
            isOwner={isPostOwner}
            onEdit={() => navigate(`/p/${post.id}/edit`)}
            onDelete={handleDeletePost}
          />
        </div>
        <div className={styles.comments}>
          <div className={styles.comment}>
            <Avatar src={post.user.avatarUrl} alt="" size="sm" />
            <div className={styles.commentTextCol}>
              <Link to={`/${post.user.username}`}>{post.user.username}</Link>{' '}
              <span className={styles.preserveLines}>{post.caption}</span>
            </div>
          </div>
          {comments.map((c) => (
            <div key={c.id} className={styles.comment}>
              <Avatar src={c.user.avatarUrl} alt="" size="sm" />
              <div className={styles.commentTextCol}>
                <Link to={`/${c.user.username}`}>{c.user.username}</Link>{' '}
                <span className={styles.preserveLines}>{c.text}</span>
                {me?.username === c.user.username && (
                  <button type="button" className={styles.delCmt} onClick={() => removeComment(c)}>
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={toggleLike} aria-label="멍멍">
            <HeartIcon size={26} filled={liked} />
          </button>
          <span aria-hidden>
            <CommentIcon size={26} />
          </span>
          <button type="button" onClick={toggleSave} aria-label={saved ? '저장 취소' : '저장'}>
            <BookmarkIcon size={26} filled={saved} />
          </button>
        </div>
        <div className={styles.likes}>멍멍 {likes.toLocaleString()}개</div>
        <div className={styles.time}>{new Date(post.createdAt).toLocaleString()}</div>
        <form className={styles.composer} onSubmit={submitComment}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="댓글 달기..."
            aria-label="댓글 입력"
          />
          <button type="submit" className={styles.postBtn}>
            게시
          </button>
        </form>
      </div>
    </div>
  );
}
