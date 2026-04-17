import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { AppTopNav } from '../../components/layout/AppTopNav';
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendMessage,
} from '../../lib/instagram-api';
import type { Conversation, Message } from '../../types';
import { useAuth } from '../auth/AuthContext';
import styles from './DirectPage.module.css';

export function DirectPage() {
  const { conversationId } = useParams();
  const { user: me, token } = useAuth();
  const [text, setText] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const meId = me ? Number(me.id) : 0;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchConversations(token);
        if (!cancelled) setConversations(list);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !conversationId || !meId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchMessages(token, conversationId, meId);
        if (!cancelled) setMessages(rows);
        await markConversationRead(token, conversationId);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, conversationId, meId]);

  const active = conversations.find((c) => c.id === conversationId);

  const onSend = async () => {
    const body = text.trim();
    if (!token || !conversationId || !body) return;
    try {
      await sendMessage(token, conversationId, body);
      setText('');
      const rows = await fetchMessages(token, conversationId, meId);
      setMessages(rows);
      const list = await fetchConversations(token);
      setConversations(list);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={styles.page}>
      <AppTopNav />
      <div className={styles.layout}>
        <div className={`${styles.listCol} ${conversationId ? styles.hideOnMobile : ''}`}>
          <div className={styles.listHead}>
            <strong>메시지</strong>
            <span style={{ fontSize: 20, opacity: 0.5 }} aria-hidden>
              ✎
            </span>
          </div>
          {loadingList && <p className="ig-muted" style={{ padding: 12 }}>불러오는 중…</p>}
          {!loadingList &&
            conversations.map((c) => (
              <Link key={c.id} to={`/direct/${c.id}`} className={styles.conv}>
                <Avatar src={c.peer.avatarUrl} alt="" size="md" />
                <div className={styles.convBody}>
                  <div className={styles.convTop}>
                    <strong>{c.peer.username}</strong>
                    <span>{new Date(c.lastAt).toLocaleDateString()}</span>
                  </div>
                  <div className={`${styles.convPreview} ${c.unread ? styles.unread : ''}`}>{c.lastMessage}</div>
                </div>
              </Link>
            ))}
        </div>
        <div className={`${styles.threadCol} ${conversationId ? styles.fullMobile : ''}`}>
          {!active ? (
            <div className={styles.empty}>
              <p style={{ fontSize: 22, fontWeight: 300, color: 'var(--ig-text)' }}>내 메시지</p>
              <p>친구에게 비공개 사진과 메시지를 보내 보세요</p>
            </div>
          ) : (
            <>
              <div className={styles.threadHead}>
                <Link to={`/${active.peer.username}`}>
                  <Avatar src={active.peer.avatarUrl} alt="" size="sm" />
                </Link>
                <Link to={`/${active.peer.username}`}>{active.peer.username}</Link>
              </div>
              <div className={styles.messages}>
                {messages.map((m) => (
                  <div key={m.id} className={`${styles.bubble} ${m.fromMe ? styles.me : styles.them}`}>
                    {m.body}
                  </div>
                ))}
              </div>
              <div className={styles.composer}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 입력..." onKeyDown={(e) => e.key === 'Enter' && onSend()} />
                <button type="button" style={{ color: 'var(--ig-link)', fontWeight: 600 }} onClick={onSend}>
                  보내기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
