/**
 * 개발(기본): 같은 출처로 요청 → Vite가 `/api`, `/media`를 백엔드(기본 127.0.0.1:18765)로 프록시.
 * 포트는 `frontend/.env.development` 의 VITE_DEV_PROXY_API_PORT 와 vite.config 동기화.
 * `VITE_API_BASE_URL`을 쓰면 프록시를 건너뜁니다(직접 백엔드 호출).
 */

/** 오류 메시지용: 개발 시 프록시가 붙는 백엔드 포트 문자열 */
export function devProxyBackendPortLabel(): string {
  if (!import.meta.env.DEV) return '8000';
  return String(import.meta.env.VITE_DEV_PROXY_API_PORT ?? '18765');
}

function getApiBase(): string {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (typeof env === 'string' && env.trim() !== '') {
    return env.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
  /* 프로덕션 빌드 기본; 로컬 프리뷰는 VITE_API_BASE_URL 로 덮어쓰기 */
  return 'http://127.0.0.1:8000';
}

const base = getApiBase();

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(apiUrl('/api/v1/health'));
  if (!res.ok) throw new Error('API에 연결할 수 없습니다.');
  return res.json();
}
