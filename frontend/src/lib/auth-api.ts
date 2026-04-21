import { apiUrl, devProxyBackendPortLabel } from './api';
import type { User } from '../types';

const LOGIN_TIMEOUT_MS = 20_000;

export type ApiUser = {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website?: string | null;
  is_admin?: boolean;
};

export type ApiUserProfile = ApiUser & {
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following?: boolean | null;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: ApiUser;
};

export function mapApiUserToUser(u: ApiUser | ApiUserProfile): User {
  const avatar =
    u.avatar_url?.trim() || `https://picsum.photos/seed/u${u.id}/150/150`;
  const counts =
    'posts_count' in u
      ? {
          postsCount: u.posts_count,
          followersCount: u.followers_count,
          followingCount: u.following_count,
        }
      : { postsCount: 0, followersCount: 0, followingCount: 0 };
  const isFollowing =
    'is_following' in u && u.is_following != null ? u.is_following : undefined;
  return {
    id: String(u.id),
    username: u.username,
    email: u.email,
    fullName: u.full_name?.trim() || u.username,
    avatarUrl: avatar,
    bio: u.bio ?? undefined,
    website: u.website?.trim() || undefined,
    ...counts,
    isFollowing,
    isAdmin: u.is_admin ?? false,
  };
}

function parseLoginError(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first && typeof first === 'object' && 'msg' in first) {
      return String((first as { msg: string }).msg);
    }
  }
  return '로그인에 실패했습니다.';
}

function isLoginResponse(data: unknown): data is LoginResponse {
  if (!data || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.access_token === 'string' &&
    o.user !== null &&
    typeof o.user === 'object' &&
    typeof (o.user as ApiUser).id === 'number' &&
    typeof (o.user as ApiUser).username === 'string'
  );
}

export async function loginWithApi(email: string, password: string): Promise<LoginResponse> {
  const apiPort = devProxyBackendPortLabel();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(apiUrl('/api/v1/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(
        `서버 응답이 없습니다. 터미널에서 백엔드(포트 ${apiPort})가 실행 중인지 확인한 뒤 다시 시도해 주세요.`,
      );
    }
    const devHint =
      import.meta.env.DEV &&
      (e instanceof TypeError || (e instanceof DOMException && e.name === 'NetworkError'))
        ? ` Vite 터미널에 \`ECONNREFUSED 127.0.0.1:${apiPort}\` 또는 백엔드에 \`10048\`이 보이면, 포트 ${apiPort}를 쓰는 다른 프로그램을 끈 뒤 \`npm run dev\`를 다시 실행하세요.`
        : '';
    throw new Error(
      `브라우저가 API(프록시 → 127.0.0.1:${apiPort})에 연결하지 못했습니다.${devHint} 터미널에 "Uvicorn running on http://127.0.0.1:${apiPort}" 문구가 나온 뒤 다시 로그인해 주세요.`,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        `API 서버(포트 ${apiPort})에 연결할 수 없습니다. 터미널에 Uvicorn이 떠 있는지 확인한 뒤 다시 시도해 주세요.`,
      );
    }
    const detail = (data as { detail?: unknown }).detail;
    throw new Error(parseLoginError(detail));
  }

  if (!isLoginResponse(data)) {
    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }

  return data;
}

export async function registerWithApi(
  email: string,
  username: string,
  password: string,
  fullName: string,
): Promise<LoginResponse> {
  const apiPort = devProxyBackendPortLabel();
  const res = await fetch(apiUrl('/api/v1/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      username: username.trim().replace(/^@/, ''),
      password,
      full_name: fullName.trim() || null,
    }),
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        `API 서버(포트 ${apiPort})에 연결할 수 없습니다. 터미널에 Uvicorn이 떠 있는지 확인한 뒤 다시 시도해 주세요.`,
      );
    }
    const detail = (data as { detail?: unknown }).detail;
    throw new Error(parseLoginError(detail));
  }
  if (!isLoginResponse(data)) {
    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }
  return data;
}

export async function fetchCurrentUser(accessToken: string): Promise<User> {
  const res = await fetch(apiUrl('/api/v1/users/me'), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('프로필을 불러올 수 없습니다.');
  }
  const p = (await res.json()) as ApiUserProfile;
  return mapApiUserToUser(p);
}
