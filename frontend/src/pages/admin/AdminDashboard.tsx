import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { fetchAdminStats, type AdminStats } from '../../services/admin.service';

export function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchAdminStats(token);
        if (!cancelled) setStats(s);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '통계를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const cards = useMemo(
    () => [
      { label: '전체 회원', value: stats?.users_total ?? 0 },
      { label: '오늘 가입', value: stats?.users_today ?? 0 },
      { label: '전체 게시물', value: stats?.posts_total ?? 0 },
      { label: '오늘 게시물', value: stats?.posts_today ?? 0 },
      { label: '전체 댓글', value: stats?.comments_total ?? 0 },
      { label: '전체 멍멍', value: stats?.likes_total ?? 0 },
    ],
    [stats],
  );

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>대시보드</h2>
      {loading && <p className="ig-muted">불러오는 중…</p>}
      {error && <p style={{ color: 'var(--ig-danger)' }}>{error}</p>}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
          gap: 12,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              border: '1px solid var(--ig-border)',
              borderRadius: 10,
              padding: 12,
              background: 'var(--ig-surface)',
            }}
          >
            <div className="ig-muted" style={{ fontSize: 12 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
