import { adminApi, apiUrl } from './api';

export type AdminUserRow = {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
  is_admin: boolean;
  posts_count: number;
};

export type AdminPostRow = {
  id: number;
  author: { id: number; username: string; full_name: string | null; avatar_url: string | null };
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
};

export type AdminStats = {
  users_total: number;
  users_today: number;
  posts_total: number;
  posts_today: number;
  comments_total: number;
  likes_total: number;
};

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function throwIfNotOk(res: Response) {
  if (res.ok) return;
  let msg = `요청 실패 (${res.status})`;
  try {
    const j = (await res.json()) as { detail?: string };
    if (j.detail) msg = j.detail;
  } catch {
    /* ignore */
  }
  throw new Error(msg);
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(apiUrl(adminApi.stats()), { headers: authHeaders(token) });
  await throwIfNotOk(res);
  return (await res.json()) as AdminStats;
}

export async function fetchAdminUsers(
  token: string,
  q = '',
): Promise<{ items: AdminUserRow[]; total: number }> {
  const res = await fetch(apiUrl(adminApi.users(q)), { headers: authHeaders(token) });
  await throwIfNotOk(res);
  return (await res.json()) as { items: AdminUserRow[]; total: number };
}

export async function deleteAdminUser(token: string, userId: number): Promise<void> {
  const res = await fetch(apiUrl(adminApi.user(userId)), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await throwIfNotOk(res);
}

export async function fetchAdminPosts(
  token: string,
  q = '',
): Promise<{ items: AdminPostRow[]; total: number }> {
  const res = await fetch(apiUrl(adminApi.posts(q)), { headers: authHeaders(token) });
  await throwIfNotOk(res);
  return (await res.json()) as { items: AdminPostRow[]; total: number };
}

export async function deleteAdminPost(token: string, postId: number): Promise<void> {
  const res = await fetch(apiUrl(adminApi.post(postId)), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await throwIfNotOk(res);
}
