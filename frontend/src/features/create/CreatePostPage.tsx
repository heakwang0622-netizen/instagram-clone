import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { createPost } from '../../lib/instagram-api';
import { useAuth } from '../auth/AuthContext';
import styles from './CreatePostPage.module.css';

const FILE_INPUT_ID = 'create-post-file-input';

/**
 * input value를 비우기 전에 반드시 File 배열로 복사해야 합니다.
 * reset 직후에는 같은 FileList 참조가 비어 있어(라이브 리스트) 선택이 사라집니다.
 */
function snapshotFiles(list: FileList | null): File[] {
  if (!list?.length) return [];
  return Array.from(list);
}

export function CreatePostPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const applyChosenFiles = useCallback((arr: File[]) => {
    if (!arr.length) {
      setError('선택된 파일이 없습니다. 사진·동영상 파일을 다시 선택해 주세요.');
      return;
    }
    setError(null);
    setPreviewLoadFailed(false);
    setFiles(arr);
    const first = arr[0];
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(first);
    });
    const mime = (first.type || '').toLowerCase();
    const name = first.name || '';
    setPreviewIsVideo(
      mime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(name),
    );
  }, []);

  const onFileChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = snapshotFiles(e.target.files);
    e.target.value = '';
    applyChosenFiles(chosen);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    applyChosenFiles(snapshotFiles(e.dataTransfer.files));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!token) {
      setError('로그인이 필요합니다. 다시 로그인한 뒤 시도해 주세요.');
      return;
    }
    if (files.length === 0) {
      setError('사진 또는 동영상을 먼저 선택해 주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const post = await createPost(token, files, caption, location);
      navigate(`/p/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AppTopNav />
      <div className={styles.page}>
        <div className={styles.card}>
          <form onSubmit={onSubmit}>
            <div
              className={`${styles.drop} ${styles.dropZone}`}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <input
                id={FILE_INPUT_ID}
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.jpg,.jpeg,.jpe,.jfif,.png,.webp,.gif,.heic,.heif,.mp4,.webm,.mov"
                multiple
                className={styles.hiddenFileInput}
                aria-label="게시할 사진 또는 동영상 파일 선택"
                onChange={onFileChosen}
              />
              {previewUrl ? (
                <>
                  {previewIsVideo ? (
                    <video className={styles.previewVideo} src={previewUrl} controls playsInline />
                  ) : previewLoadFailed ? (
                    <div className={styles.previewFallback}>
                      <p style={{ margin: 0, fontWeight: 600 }}>미리보기를 표시할 수 없습니다</p>
                      <p className="ig-muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
                        .jfif 등 일부 형식은 브라우저에서 썸네일을 못 그릴 수 있어요. 그대로 공유하기를 누르면 업로드는 됩니다.
                      </p>
                    </div>
                  ) : (
                    <img
                      className={styles.preview}
                      src={previewUrl}
                      alt="선택한 미디어 미리보기"
                      onError={() => setPreviewLoadFailed(true)}
                    />
                  )}
                  <p className="ig-muted" style={{ fontSize: 13, margin: 0, textAlign: 'center', wordBreak: 'break-all' }}>
                    선택됨: {files.map((f) => f.name).join(', ')}
                  </p>
                  <button type="button" className={`${styles.chooseAnother} ${styles.pickBtn}`} onClick={openFilePicker}>
                    다른 사진·동영상 선택
                  </button>
                  {files.length > 1 && (
                    <p className="ig-muted" style={{ fontSize: 13 }}>
                      {files.length}개 파일이 선택되었습니다. (캐러셀 업로드)
                    </p>
                  )}
                </>
              ) : (
                <>
                  <svg className={styles.iconBig} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M12 8V16M8 12H16" strokeLinecap="round" />
                  </svg>
                  <p style={{ fontSize: 20, fontWeight: 300 }}>사진과 동영상을 여기에 끌어다 놓으세요</p>
                  <button type="button" className={styles.pickBtn} onClick={openFilePicker}>
                    컴퓨터에서 선택
                  </button>
                </>
              )}
            </div>
            <div className={styles.meta}>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="문구 입력..." />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="위치 추가" />
              {error && <p style={{ color: 'var(--ig-danger)', fontSize: 13 }}>{error}</p>}
              <button type="submit" className={styles.shareBtn} disabled={submitting}>
                {submitting ? '올리는 중…' : '공유하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
