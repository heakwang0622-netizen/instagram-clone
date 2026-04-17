import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { deleteAdminPost, fetchAdminPosts, type AdminPostRow } from '../../services/admin.service';

export function AdminPosts() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<AdminPostRow[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchAdminPosts(token, query);
      setPosts(p.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '게시물 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load('');
  }, [token, load]);

  return (
    <section
      style={{
        border: '1px solid var(--ig-border)',
        borderRadius: 10,
        background: 'var(--ig-surface)',
        padding: 12,
      }}
    >
      <h2 style={{ margin: '0 0 12px' }}>게시물 관리</h2>
      {loading && <p className="ig-muted">불러오는 중…</p>}
      {error && <p style={{ color: 'var(--ig-danger)' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="caption/username 검색"
          style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--ig-border)', borderRadius: 8 }}
        />
        <button type="button" onClick={() => void load(searchInput)}>
          검색
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">작성자</th>
              <th align="left">내용</th>
              <th align="left">작성일</th>
              <th align="left">반응</th>
              <th align="left">작업</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--ig-border)' }}>
                <td>{p.author.username}</td>
                <td>{p.caption || '-'}</td>
                <td>{new Date(p.created_at).toLocaleString()}</td>
                <td>
                  좋아요 {p.likes_count} · 댓글 {p.comments_count}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!token) return;
                      if (!confirm('이 게시물을 삭제할까요?')) return;
                      await deleteAdminPost(token, p.id);
                      await load(searchInput);
                    }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
