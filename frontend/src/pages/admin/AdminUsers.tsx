import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { deleteAdminUser, fetchAdminUsers, type AdminUserRow } from '../../services/admin.service';

export function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const u = await fetchAdminUsers(token, query);
      setUsers(u.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원 목록을 불러오지 못했습니다.');
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
      <h2 style={{ margin: '0 0 12px' }}>회원 관리</h2>
      {loading && <p className="ig-muted">불러오는 중…</p>}
      {error && <p style={{ color: 'var(--ig-danger)' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="username/email 검색"
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
              <th align="left">계정</th>
              <th align="left">가입일</th>
              <th align="left">게시물</th>
              <th align="left">상태</th>
              <th align="left">작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--ig-border)' }}>
                <td style={{ padding: '8px 4px' }}>
                  <div>
                    <strong>{u.username}</strong> {u.is_admin ? '(admin)' : ''}
                  </div>
                  <div className="ig-muted" style={{ fontSize: 12 }}>
                    {u.email}
                  </div>
                </td>
                <td>{new Date(u.created_at).toLocaleString()}</td>
                <td>{u.posts_count}</td>
                <td>{u.is_active ? '활성' : '비활성'}</td>
                <td>
                  <button
                    type="button"
                    disabled={u.is_admin}
                    onClick={async () => {
                      if (!token) return;
                      if (!confirm(`${u.username} 계정을 탈퇴 처리(삭제)할까요?`)) return;
                      await deleteAdminUser(token, u.id);
                      await load(searchInput);
                    }}
                  >
                    탈퇴
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
