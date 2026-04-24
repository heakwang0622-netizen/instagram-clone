import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { ChevronLeftIcon } from '../../components/icons/NavIcons';
import { devProxyBackendPortLabel } from '../../lib/api';
import { patchPassword } from '../../lib/instagram-api';
import { useAuth } from '../auth/AuthContext';
import styles from './SettingsSubPages.module.css';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <AppTopNav />
      <div className={styles.toolbar}>
        <Link to="/settings" className={styles.back} aria-label="설정으로">
          <ChevronLeftIcon />
        </Link>
        <h1 className={styles.heading}>{title}</h1>
        <span className={styles.spacer} aria-hidden />
      </div>
      <div className={styles.main}>{children}</div>
    </div>
  );
}

export function PasswordSettingsPage() {
  const { token } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setDone(false);
    if (next !== confirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await patchPassword(token, current, next);
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (/현재 비밀번호|올바르지 않습니다/.test(msg)) {
        setError('현재 비밀번호가 올바르지 않습니다');
      } else {
        setError(msg || '변경에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell title="비밀번호 변경">
      <div className={styles.card}>
        {done && <p className={styles.text}>비밀번호가 변경되었습니다</p>}
        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.field}>
            현재 비밀번호
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </label>
          <label className={styles.field}>
            새 비밀번호
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </label>
          <label className={styles.field}>
            새 비밀번호 확인
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </label>
          {error && <p className={styles.text} style={{ color: 'var(--ig-danger)' }}>{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? '처리 중…' : '변경'}
          </button>
        </form>
        <p className={styles.meta}>PATCH /api/v1/users/me/password</p>
      </div>
    </Shell>
  );
}

export function HelpSettingsPage() {
  return (
    <Shell title="도움말">
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>앱 사용법</h2>
        <ul className={styles.bulletList}>
          <li>홈에서 피드를 확인하고 멍멍, 댓글, 저장으로 상호작용할 수 있습니다.</li>
          <li>검색에서 사용자 이름으로 계정을 찾고 프로필을 방문할 수 있습니다.</li>
          <li>탐색/릴스에서 추천 게시물을 확인하고 새로운 계정을 발견할 수 있습니다.</li>
          <li>메시지에서 대화를 시작하고 상대방과 1:1 DM을 주고받을 수 있습니다.</li>
          <li>설정에서 프로필 편집, 비밀번호 변경, 계정 관련 정보를 관리할 수 있습니다.</li>
        </ul>
        <h2 className={styles.sectionTitle}>문제 해결</h2>
        <ul className={styles.bulletList}>
          <li>
            로그인이 안 되면 이메일/비밀번호를 다시 확인하고, 백엔드(포트 {devProxyBackendPortLabel()}) 실행 상태를
            확인해 주세요.
          </li>
          <li>이미지 업로드 실패 시 파일 형식(JPEG/PNG/WebP/GIF)과 용량을 확인해 주세요.</li>
          <li>화면이 비정상적으로 보이면 브라우저 새로고침 후 다시 시도해 주세요.</li>
          <li>변경사항이 반영되지 않으면 로그아웃 후 재로그인하여 세션을 갱신해 주세요.</li>
        </ul>
        <p className={styles.meta}>고객 지원: support@example.com · 운영시간 09:00~18:00 (평일)</p>
      </div>
    </Shell>
  );
}

export function AboutSettingsPage() {
  const { logout } = useAuth();
  return (
    <Shell title="정보">
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>서비스 소개</h2>
        <p className={styles.text}>
          본 서비스는 사진/동영상 공유와 소셜 네트워킹 기능을 제공하는 데모 애플리케이션입니다. 피드, 검색,
          탐색, 메시지, 알림, 설정 기능을 통해 실제 서비스와 유사한 경험을 제공합니다.
        </p>

        <h2 className={styles.sectionTitle}>개인정보 처리 방침</h2>
        <ul className={styles.bulletList}>
          <li>서비스 제공을 위해 이메일, 사용자 이름, 프로필 정보 등의 최소한의 정보를 수집합니다.</li>
          <li>수집된 정보는 로그인, 계정 관리, 콘텐츠 노출 등 핵심 기능 제공 목적에 한해 사용합니다.</li>
          <li>법령에 따른 보관 의무가 없는 경우, 이용자 요청 시 관련 데이터를 삭제할 수 있습니다.</li>
          <li>개인정보 관련 문의는 privacy@example.com 으로 접수할 수 있습니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>이용 약관</h2>
        <ul className={styles.bulletList}>
          <li>이용자는 관련 법령과 본 약관을 준수해야 하며, 타인의 권리를 침해하는 행위를 해서는 안 됩니다.</li>
          <li>불법/유해 콘텐츠 업로드, 서비스 운영을 방해하는 행위는 제한될 수 있습니다.</li>
          <li>서비스는 기능 개선 및 안정성을 위해 사전 고지 후 변경될 수 있습니다.</li>
          <li>약관 위반 시 계정 제한 또는 삭제 조치가 적용될 수 있습니다.</li>
        </ul>

        <h2 className={styles.sectionTitle}>문의 및 고지</h2>
        <p className={styles.text}>
          서비스 문의: help@example.com
          <br />
          사업자 정보: Example Corp.
          <br />
          버전: 0.1.0 (2026)
        </p>

        <button type="button" className={styles.logoutBtn} onClick={logout}>
          로그아웃
        </button>
      </div>
    </Shell>
  );
}
