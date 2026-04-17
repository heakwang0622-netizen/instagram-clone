/**
 * 개발(기본): 같은 출처로 요청 → Vite가 `/api`, `/media`를 127.0.0.1:8000으로 프록시.
 * 이렇게 하면 Vite가 5177 등 다른 포트를 써도 CORS 프리플라이트가 필요 없습니다.
 * `VITE_API_BASE_URL`을 쓰면 프록시를 건너뜁니다(직접 백엔드 호출).
 */
function getApiBase(): string {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (typeof env === 'string' && env.trim() !== '') {
    return env.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
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
