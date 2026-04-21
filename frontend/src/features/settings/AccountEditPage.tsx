import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { ChevronLeftIcon } from '../../components/icons/NavIcons';
import { devProxyBackendPortLabel } from '../../lib/api';
import { uploadAvatar } from '../../lib/instagram-api';
import { useAuth } from '../auth/AuthContext';
import styles from './AccountEditPage.module.css';

export function AccountEditPage() {
  const { user, updateProfile, token, refreshUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [website, setWebsite] = useState(user?.website ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const toastHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBio(user?.bio ?? '');
    setWebsite(user?.website ?? '');
    setEmail(user?.email ?? '');
  }, [user?.bio, user?.website, user?.email]);

  useEffect(() => {
    return () => {
      if (toastHideRef.current) window.clearTimeout(toastHideRef.current);
    };
  }, []);

  const onAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !token) return;
    setAvatarBusy(true);
    setError(null);
    try {
      await uploadAvatar(token, f);
      await refreshUser();
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const base = raw.trim() || '프로필 사진을 변경하지 못했습니다.';
      const hint =
        /\(404\)|Not Found|찾을 수 없습니다/i.test(base)
          ? ` 백엔드(API, 포트 ${devProxyBackendPortLabel()})를 한 번 종료한 뒤 다시 실행해 주세요.`
          : '';
      setError(base + hint);
    } finally {
      setAvatarBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ bio, website, email });
      if (toastHideRef.current) window.clearTimeout(toastHideRef.current);
      setSavedToast(true);
      toastHideRef.current = window.setTimeout(() => {
        setSavedToast(false);
        toastHideRef.current = null;
      }, 3200);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <AppTopNav />
      <div className={styles.toolbar}>
        <Link to={`/${user?.username}`} aria-label="뒤로" className={styles.back}>
          <ChevronLeftIcon />
        </Link>
        <h1 className={styles.heading}>프로필 편집</h1>
        <span className={styles.toolbarSpacer} aria-hidden />
      </div>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <div className={styles.avatarRow}>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              className={styles.hiddenFile}
              tabIndex={-1}
              aria-hidden
              onChange={onAvatarFile}
            />
            <Avatar src={user!.avatarUrl} alt="" size="lg" />
            <div className={styles.avatarMeta}>
              <div className={styles.usernameLine}>{user?.username}</div>
              <button
                type="button"
                className={styles.changePhotoLink}
                disabled={avatarBusy}
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarBusy ? '사진 업로드 중…' : '프로필 사진 변경'}
              </button>
            </div>
          </div>
          <form onSubmit={onSubmit}>
            <div className={styles.field}>
              <label htmlFor="bio">소개</label>
              <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="website">웹사이트</label>
              <input
                id="website"
                type="text"
                inputMode="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p style={{ color: 'var(--ig-danger)', fontSize: 14 }}>{error}</p>}
            <button type="submit" className={styles.submit} disabled={saving}>
              {saving ? '저장 중…' : '제출'}
            </button>
          </form>
        </div>
      </div>
      {savedToast ? (
        <div className={styles.toast} role="status" aria-live="polite">
          프로필이 업데이트 되었습니다
        </div>
      ) : null}
    </div>
  );
}
