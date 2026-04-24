import type { Conversation, Post, User, AppNotification, Message } from '../types';

const av = (seed: string) => `https://picsum.photos/seed/${seed}/150/150`;
const img = (seed: string, w = 1080, h = 1350) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const currentMockUser: User = {
  id: 'me',
  username: 'you',
  fullName: '내 계정',
  avatarUrl: av('meavatar'),
  bio: '멍스타그램 데모 ✨',
  postsCount: 12,
  followersCount: 128,
  followingCount: 89,
};

export const mockUsers: User[] = [
  currentMockUser,
  {
    id: '1',
    username: 'travel_diaries',
    fullName: '여행 일기',
    avatarUrl: av('u1'),
    bio: '세계 곳곳 🌍',
    postsCount: 45,
    followersCount: 12000,
    followingCount: 320,
  },
  {
    id: '2',
    username: 'film_tone',
    fullName: '필름 톤',
    avatarUrl: av('u2'),
    postsCount: 88,
    followersCount: 5600,
    followingCount: 401,
  },
  {
    id: '3',
    username: 'cafe_hunter',
    fullName: '카페 헌터',
    avatarUrl: av('u3'),
    postsCount: 200,
    followersCount: 890,
    followingCount: 210,
  },
  {
    id: '4',
    username: 'minimal.home',
    fullName: '미니멀 홈',
    avatarUrl: av('u4'),
    postsCount: 34,
    followersCount: 4500,
    followingCount: 120,
  },
];

function userByUsername(name: string): User {
  return mockUsers.find((u) => u.username === name) ?? mockUsers[1];
}

export function getUserByUsername(name: string): User | undefined {
  return mockUsers.find((u) => u.username === name);
}

export const mockPosts: Post[] = [
  {
    id: 'p1',
    user: mockUsers[1],
    media: [{ id: 'm1', url: img('post1') }],
    caption: '오늘의 석양 #여행 #노을',
    likesCount: 1240,
    commentsCount: 42,
    likedByMe: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    location: '제주',
  },
  {
    id: 'p2',
    user: mockUsers[2],
    media: [
      { id: 'm2a', url: img('post2a') },
      { id: 'm2b', url: img('post2b') },
    ],
    caption: '필름 느낌으로 한 컷 📷',
    likesCount: 892,
    commentsCount: 18,
    likedByMe: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'p3',
    user: mockUsers[3],
    media: [{ id: 'm3', url: img('post3') }],
    caption: '브런치 맛집 발견 ☕',
    likesCount: 210,
    commentsCount: 7,
    likedByMe: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'p4',
    user: mockUsers[4],
    media: [{ id: 'm4', url: img('post4') }],
    caption: '거실 인테리어 리프레시 🪴',
    likesCount: 3401,
    commentsCount: 56,
    likedByMe: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export function getPost(id: string): Post | undefined {
  return mockPosts.find((p) => p.id === id);
}

export function getProfilePosts(username: string): Post[] {
  const u = userByUsername(username);
  return mockPosts.filter((p) => p.user.username === u.username);
}

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    peer: mockUsers[1],
    lastMessage: '다음에 또 가자!',
    lastAt: new Date(Date.now() - 600000).toISOString(),
    unread: 1,
  },
  {
    id: 'c2',
    peer: mockUsers[2],
    lastMessage: '필터 정보 좀 알려줘',
    lastAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    unread: 0,
  },
  {
    id: 'c3',
    peer: mockUsers[3],
    lastMessage: '고마워 🙏',
    lastAt: new Date(Date.now() - 86400000).toISOString(),
    unread: 0,
  },
];

export const mockMessagesByConversation: Record<string, Message[]> = {
  c1: [
    { id: '1', fromMe: false, body: '사진 잘 봤어!', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: '2', fromMe: true, body: '고마워 😊', createdAt: new Date(Date.now() - 7000000).toISOString() },
    { id: '3', fromMe: false, body: '다음에 또 가자!', createdAt: new Date(Date.now() - 600000).toISOString() },
  ],
  c2: [
    { id: '1', fromMe: true, body: '이번에 올린 사진 필름 뭐 썼어?', createdAt: new Date(Date.now() - 4000000).toISOString() },
    { id: '2', fromMe: false, body: '필터 정보 좀 알려줘', createdAt: new Date(Date.now() - 3600000 * 8).toISOString() },
  ],
  c3: [{ id: '1', fromMe: true, body: '장소 공유해줘서 고마워', createdAt: new Date(Date.now() - 90000000).toISOString() }, { id: '2', fromMe: false, body: '고마워 🙏', createdAt: new Date(Date.now() - 86400000).toISOString() }],
};

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'like',
    actor: mockUsers[1],
    postId: 'p1',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'follow',
    actor: mockUsers[2],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: 'n3',
    type: 'comment',
    actor: mockUsers[3],
    postId: 'p2',
    text: '멋지다!',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    read: true,
  },
];

export function getMockFollowers(username: string): User[] {
  void username;
  return mockUsers.filter((u) => u.id !== 'me');
}

export function getMockFollowing(username: string): User[] {
  void username;
  return mockUsers.slice(1, 4);
}

/** 데모: 저장됨 그리드에 표시할 게시물 id */
export const mockSavedPostIds: string[] = ['p1', 'p2', 'p3', 'p4'];

export function getSavedPosts(): Post[] {
  const set = new Set(mockSavedPostIds);
  return mockPosts.filter((p) => set.has(p.id));
}

export type BookmarkCollection = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  itemCount: number;
};

export const mockBookmarkCollections: BookmarkCollection[] = [
  {
    id: 'col1',
    title: '여행 아이디어',
    subtitle: '저장한 게시물 · 12개',
    coverUrl: img('bmcol1'),
    itemCount: 12,
  },
  {
    id: 'col2',
    title: '홈 인테리어',
    subtitle: '저장한 게시물 · 8개',
    coverUrl: img('bmcol2'),
    itemCount: 8,
  },
  {
    id: 'col3',
    title: '카페 기록',
    subtitle: '저장한 게시물 · 5개',
    coverUrl: img('bmcol3'),
    itemCount: 5,
  },
];
