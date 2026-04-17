export { apiUrl, fetchHealth } from '../lib/api';

/** 관리자 API 경로 (프론트에서 `apiUrl(adminApi.stats())` 형태로 사용) */
export const adminApi = {
  stats: () => '/api/v1/admin/stats' as const,
  users: (q = '') =>
    `/api/v1/admin/users?${new URLSearchParams({ q, limit: '100', offset: '0' }).toString()}` as const,
  user: (id: number) => `/api/v1/admin/users/${id}` as const,
  posts: (q = '') =>
    `/api/v1/admin/posts?${new URLSearchParams({ q, limit: '100', offset: '0' }).toString()}` as const,
  post: (id: number) => `/api/v1/admin/posts/${id}` as const,
};
