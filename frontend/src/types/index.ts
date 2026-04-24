export interface User {
  id: string;
  username: string;
  email?: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
  /** 프로필에 표시할 웹사이트(저장 값 그대로 또는 URL) */
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  /** 다른 사용자 프로필 조회 시, 내가 구독 중인지 */
  isFollowing?: boolean;
  isAdmin?: boolean;
  isPrivate?: boolean;
}

export interface PostMedia {
  id: string;
  url: string;
  /** DB `post_media.media_type` — 이미지/동영상 렌더 구분용 */
  mediaType?: 'image' | 'video';
}

export interface Comment {
  id: string;
  user: Pick<User, 'username' | 'avatarUrl'>;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  user: User;
  media: PostMedia[];
  caption: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  /** 백엔드 `saved_by_me` */
  savedByMe?: boolean;
  createdAt: string;
  location?: string;
}

export interface Conversation {
  id: string;
  peer: User;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface Message {
  id: string;
  fromMe: boolean;
  body: string;
  createdAt: string;
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actor: User;
  postId?: string;
  text?: string;
  createdAt: string;
  read: boolean;
}
