/**
 * FastAPI 백엔드(/api/v1) 통합 클라이언트
 */
import { apiUrl } from './api';
import { mapApiUserToUser, type ApiUser, type ApiUserProfile } from './auth-api';
import type { AppNotification, Comment, Conversation, Message, Post, User } from '../types';

/** API UserSummary / 추천(SuggestedUserOut) → User */
export function userFromSummary(u: {
  id: number;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_following?: boolean;
}): User {
  return {
    id: String(u.id),
    username: u.username,
    fullName: u.full_name?.trim() || u.username,
    avatarUrl: u.avatar_url?.trim() || `https://picsum.photos/seed/u${u.id}/150/150`,
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    isFollowing: u.is_following ?? false,
  };
}

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function detailMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown };
    const d = j.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0] && typeof d[0] === 'object' && 'msg' in d[0]) {
      return String((d[0] as { msg: string }).msg);
    }
  } catch {
    /* ignore */
  }
  return `요청 실패 (${res.status})`;
}

// --- Post / media (from posts-api, merged) ---
export type ApiPostUser = {
  id: number;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type ApiPostMedia = {
  id: number;
  url: string;
  media_type: string;
  sort_order: number;
};

export type ApiPost = {
  id: number;
  user: ApiPostUser;
  media: ApiPostMedia[];
  caption: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  created_at: string;
};

function mediaUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const p = url.startsWith('/') ? url : `/${url}`;
  return apiUrl(p);
}

function mapPostUser(u: ApiPostUser): User {
  return {
    id: String(u.id),
    username: u.username,
    fullName: u.full_name?.trim() || u.username,
    avatarUrl: u.avatar_url?.trim() || `https://picsum.photos/seed/u${u.id}/150/150`,
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  };
}

export function mapApiPostToPost(p: ApiPost): Post {
  return {
    id: String(p.id),
    user: mapPostUser(p.user),
    media: p.media.map((m) => ({
      id: String(m.id),
      url: mediaUrl(m.url),
      mediaType: m.media_type === 'video' ? 'video' : 'image',
    })),
    caption: p.caption ?? '',
    likesCount: p.likes_count,
    commentsCount: p.comments_count,
    likedByMe: p.liked_by_me,
    createdAt: p.created_at,
    location: p.location ?? undefined,
    savedByMe: p.saved_by_me,
  };
}

type ApiPostList = { items: ApiPost[]; next_cursor: string | null };

export async function fetchFeedPage(
  token: string,
  opts?: { cursor?: string | null; limit?: number },
): Promise<{ items: Post[]; nextCursor: string | null }> {
  const q = new URLSearchParams();
  if (opts?.cursor) q.set('cursor', opts.cursor);
  if (opts?.limit) q.set('limit', String(opts.limit));
  const qs = q.toString();
  const res = await fetch(apiUrl(`/api/v1/posts/feed${qs ? `?${qs}` : ''}`), {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  const data = (await res.json()) as ApiPostList;
  return { items: data.items.map(mapApiPostToPost), nextCursor: data.next_cursor };
}

export async function fetchFeed(token: string): Promise<Post[]> {
  const data = await fetchFeedPage(token);
  return data.items;
}

export async function fetchExplorePage(
  token: string | null,
  opts?: { cursor?: string | null; limit?: number; mediaType?: 'image' | 'video' },
): Promise<{ items: Post[]; nextCursor: string | null }> {
  const q = new URLSearchParams();
  if (opts?.mediaType) q.set('media_type', opts.mediaType);
  if (opts?.cursor) q.set('cursor', opts.cursor);
  if (opts?.limit) q.set('limit', String(opts.limit));
  const qs = q.toString();
  const res = await fetch(apiUrl(`/api/v1/posts/explore${qs ? `?${qs}` : ''}`), {
    headers: token ? authHeaders(token) : undefined,
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  const data = (await res.json()) as ApiPostList;
  return { items: data.items.map(mapApiPostToPost), nextCursor: data.next_cursor };
}

export async function fetchExplore(token: string | null, mediaType?: 'image' | 'video'): Promise<Post[]> {
  const data = await fetchExplorePage(token, { mediaType });
  return data.items;
}

export async function fetchPost(postId: string, token: string | null): Promise<Post> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}`), {
    headers: token ? authHeaders(token) : undefined,
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  return mapApiPostToPost((await res.json()) as ApiPost);
}

export async function fetchUserPosts(username: string, token: string | null): Promise<Post[]> {
  const res = await fetch(apiUrl(`/api/v1/users/${encodeURIComponent(username)}/posts`), {
    headers: token ? authHeaders(token) : undefined,
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  const data = (await res.json()) as { items: ApiPost[] };
  return data.items.map(mapApiPostToPost);
}

export async function fetchSavedPosts(token: string): Promise<Post[]> {
  const res = await fetch(apiUrl('/api/v1/users/me/saved'), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await detailMessage(res));
  const data = (await res.json()) as { items: ApiPost[] };
  return data.items.map(mapApiPostToPost);
}

export async function createPost(
  token: string,
  files: File[],
  caption: string,
  location: string,
): Promise<Post> {
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  fd.append('caption', caption);
  if (location.trim()) fd.append('location', location.trim());
  const res = await fetch(apiUrl('/api/v1/posts'), {
    method: 'POST',
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  return mapApiPostToPost((await res.json()) as ApiPost);
}

export async function fetchSuggestedUsers(token: string): Promise<User[]> {
  const res = await fetch(apiUrl('/api/v1/users/suggested?limit=8'), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await detailMessage(res));
  const rows = (await res.json()) as Parameters<typeof userFromSummary>[0][];
  return rows.map(userFromSummary);
}

export async function searchUsers(q: string): Promise<User[]> {
  const res = await fetch(apiUrl(`/api/v1/search/users?q=${encodeURIComponent(q)}`));
  if (!res.ok) throw new Error(await detailMessage(res));
  const rows = (await res.json()) as Parameters<typeof userFromSummary>[0][];
  return rows.map(userFromSummary);
}

export async function fetchProfile(username: string, token: string | null): Promise<User> {
  const res = await fetch(apiUrl(`/api/v1/users/${encodeURIComponent(username)}`), {
    headers: token ? authHeaders(token) : undefined,
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  return mapApiUserToUser((await res.json()) as ApiUserProfile);
}

export async function fetchFollowers(username: string): Promise<User[]> {
  const res = await fetch(apiUrl(`/api/v1/users/${encodeURIComponent(username)}/followers`));
  if (!res.ok) throw new Error(await detailMessage(res));
  const rows = (await res.json()) as Parameters<typeof userFromSummary>[0][];
  return rows.map(userFromSummary);
}

export async function fetchFollowing(username: string): Promise<User[]> {
  const res = await fetch(apiUrl(`/api/v1/users/${encodeURIComponent(username)}/following`));
  if (!res.ok) throw new Error(await detailMessage(res));
  const rows = (await res.json()) as Parameters<typeof userFromSummary>[0][];
  return rows.map(userFromSummary);
}

export async function followUser(token: string, userId: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/users/${userId}/follow`), {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function unfollowUser(token: string, userId: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/users/${userId}/follow`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function likePost(token: string, postId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}/like`), {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function unlikePost(token: string, postId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}/like`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function deletePost(token: string, postId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function patchPost(
  token: string,
  postId: string,
  body: { caption?: string | null; location?: string | null },
): Promise<Post> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}`), {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  return mapApiPostToPost((await res.json()) as ApiPost);
}

type ApiComment = {
  id: number;
  user: { id: number; username: string; full_name: string | null; avatar_url: string | null };
  text: string;
  created_at: string;
};

function mapComment(c: ApiComment): Comment {
  return {
    id: String(c.id),
    user: {
      username: c.user.username,
      avatarUrl: c.user.avatar_url?.trim() || `https://picsum.photos/seed/u${c.user.id}/150/150`,
    },
    text: c.text,
    createdAt: c.created_at,
  };
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}/comments`));
  if (!res.ok) throw new Error(await detailMessage(res));
  const rows = (await res.json()) as ApiComment[];
  return rows.map(mapComment);
}

export async function postComment(token: string, postId: string, text: string): Promise<Comment> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}/comments`), {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  return mapComment((await res.json()) as ApiComment);
}

export async function deleteComment(token: string, commentId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/comments/${commentId}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function savePost(token: string, postId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}/save`), {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function unsavePost(token: string, postId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/posts/${postId}/save`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function patchProfile(
  token: string,
  body: {
    full_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    website?: string | null;
    email?: string | null;
  },
): Promise<User> {
  const res = await fetch(apiUrl('/api/v1/users/me'), {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  return mapApiUserToUser((await res.json()) as ApiUserProfile);
}

export async function uploadAvatar(token: string, file: File): Promise<User> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(apiUrl('/api/v1/users/me/avatar'), {
    method: 'POST',
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  return mapApiUserToUser((await res.json()) as ApiUser);
}

export async function patchPassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(apiUrl('/api/v1/users/me/password'), {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

// --- DM ---
type ApiConv = {
  id: number;
  peer: { id: number; username: string; full_name: string | null; avatar_url: string | null };
  last_message: string | null;
  last_at: string | null;
  unread: number;
};

export async function fetchConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(apiUrl('/api/v1/conversations'), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await detailMessage(res));
  const rows = (await res.json()) as ApiConv[];
  return rows.map((c) => ({
    id: String(c.id),
    peer: userFromSummary(c.peer),
    lastMessage: c.last_message ?? '',
    lastAt: c.last_at ?? new Date().toISOString(),
    unread: c.unread,
  }));
}

type ApiMsg = {
  id: number;
  sender_id: number;
  body: string;
  created_at: string;
  read_at: string | null;
};

export async function fetchMessages(token: string, conversationId: string, meId: number): Promise<Message[]> {
  const res = await fetch(apiUrl(`/api/v1/conversations/${conversationId}/messages`), {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  const rows = (await res.json()) as ApiMsg[];
  return rows.map((m) => ({
    id: String(m.id),
    fromMe: m.sender_id === meId,
    body: m.body,
    createdAt: m.created_at,
  }));
}

export async function sendMessage(token: string, conversationId: string, body: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/conversations/${conversationId}/messages`), {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function markConversationRead(token: string, conversationId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/conversations/${conversationId}/read`), {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function getOrCreateConversation(token: string, peerUserId: number): Promise<number> {
  const res = await fetch(apiUrl('/api/v1/conversations'), {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: peerUserId }),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
  const data = (await res.json()) as { id: number };
  return data.id;
}

// --- Notifications ---
type ApiNotif = {
  id: number;
  type: string;
  actor: { id: number; username: string; full_name: string | null; avatar_url: string | null } | null;
  post_id: number | null;
  comment_id: number | null;
  is_read: boolean;
  created_at: string;
};

export async function fetchNotifications(token: string): Promise<AppNotification[]> {
  const res = await fetch(apiUrl('/api/v1/notifications'), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await detailMessage(res));
  const data = (await res.json()) as { items: ApiNotif[] };
  return data.items.map((n) => {
    const actor = n.actor
      ? userFromSummary(n.actor)
      : ({
          id: '0',
          username: 'unknown',
          fullName: '',
          avatarUrl: 'https://picsum.photos/seed/0/150/150',
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
        } as User);
    return {
      id: String(n.id),
      type: n.type as AppNotification['type'],
      actor,
      postId: n.post_id != null ? String(n.post_id) : undefined,
      text: undefined,
      createdAt: n.created_at,
      read: n.is_read,
    };
  });
}

export async function markNotificationRead(token: string, id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/notifications/${id}/read`), {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  const res = await fetch(apiUrl('/api/v1/notifications/read-all'), {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await detailMessage(res));
}
