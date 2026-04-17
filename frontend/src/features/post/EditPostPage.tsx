import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { fetchPost, patchPost } from '../../lib/instagram-api';
import { useAuth } from '../auth/AuthContext';
import styles from './EditPostPage.module.css';

export function EditPostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId || !token || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setForbidden(false);
      try {
        const p = await fetchPost(postId, token);
        if (cancelled) return;
        if (user.id !== p.user.id) {
          setForbidden(true);
          return;
        }
        setCaption(p.caption || '');
        setLocation(p.location || '');
      } catch {
        if (!cancelled) setForbidden(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, token, user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!postId || !token || saving) return;
    setSaving(true);
    setError(null);
    try {
      await patchPost(token, postId, {
        caption: caption.trim() || null,
        location: location.trim() || null,
      });
      navigate(`/p/${postId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!postId) {
    return (
      <div>
        <AppTopNav />
        <p style={{ padding: 24 }}>잘못된 주소입니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <AppTopNav />
        <p className="ig-muted" style={{ padding: 24 }}>
          불러오는 중…
        </p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div>
        <AppTopNav />
        <div style={{ padding: 24, textAlign: 'center' }}>
          <p>이 게시물을 수정할 수 없습니다.</p>
          <Link to="/">홈으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppTopNav />
      <div className={styles.page}>
        <h1 className={styles.title}>게시물 수정</h1>
        <p className="ig-muted" style={{ marginBottom: 16 }}>
          사진·동영상은 바꿀 수 없고, 문구와 위치만 수정할 수 있어요.
        </p>
        <form className={styles.card} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor="edit-caption">
            문구
          </label>
          <textarea
            id="edit-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
            maxLength={5000}
            placeholder="문구 입력..."
          />
          <label className={styles.label} htmlFor="edit-location">
            위치
          </label>
          <input
            id="edit-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={255}
            placeholder="위치 추가"
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={() => navigate(-1)}>
              취소
            </button>
            <button type="submit" className={styles.save} disabled={saving}>
              {saving ? '저장 중…' : '완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
