import { useEffect, useRef, useState } from 'react';
import { MoreHorizontalIcon } from './icons/NavIcons';
import styles from './PostOptionsMenu.module.css';

type Props = {
  /** 내 게시물일 때만 메뉴 표시 */
  isOwner: boolean;
  /** 문구·위치 수정 화면으로 */
  onEdit?: () => void;
  /** 삭제 확인·API 호출은 부모에서 처리 */
  onDelete: () => void | Promise<void>;
  /** 메뉴 버튼 aria-label */
  'aria-label'?: string;
};

export function PostOptionsMenu({
  isOwner,
  onEdit,
  onDelete,
  'aria-label': ariaLabel = '게시물 옵션',
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!isOwner) return null;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontalIcon size={22} />
      </button>
      {open ? (
        <div className={styles.dropdown} role="menu">
          {onEdit ? (
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              수정하기
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={`${styles.item} ${styles.danger} ${onEdit ? styles.itemBorder : ''}`}
            onClick={() => {
              setOpen(false);
              void onDelete();
            }}
          >
            삭제하기
          </button>
        </div>
      ) : null}
    </div>
  );
}
