import React, { useEffect, useState } from 'react';

const RANK_MEDALS = {
  1: { icon: '🥇', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  2: { icon: '🥈', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  3: { icon: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.15)' },
};

function getAvatarColor(name) {
  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://CODESPACE_NAME-8000.app.github.dev/api/leaderboard/')
      .then(response => response.json())
      .then(data => {
        setLeaderboard(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-ring"></div>
        <p>Loading leaderboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="dark-alert">{error}</div>
        </div>
      </div>
    );
  }

  const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
  const topScore = sorted.length > 0 ? sorted[0].score : 0;

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h1>🏆 Leaderboard</h1>
            <p>Live rankings — updated after every activity</p>
          </div>
          <span style={{
            background: 'rgba(16,185,129,0.15)',
            color: '#34d399',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '0.35rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}>
            {sorted.length} athletes
          </span>
        </div>

        <div className="dark-card">
          <div className="table-responsive">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Athlete</th>
                  <th>Score</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, index) => {
                  const rank = index + 1;
                  const medal = RANK_MEDALS[rank];
                  const username = entry.user?.username || entry.user || '—';
                  const avatarColor = getAvatarColor(username);
                  const initial = username !== '—' ? username[0].toUpperCase() : '?';
                  const pct = topScore > 0 ? Math.round((entry.score / topScore) * 100) : 0;

                  return (
                    <tr key={entry._id || index}>
                      <td style={{ width: 70 }}>
                        {medal ? (
                          <div className="rank-badge" style={{ background: medal.bg, color: medal.color }}>
                            {medal.icon}
                          </div>
                        ) : (
                          <div className="rank-badge" style={{ background: 'var(--surface-light)', color: 'var(--text-secondary)' }}>
                            {rank}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar" style={{ background: avatarColor + '22', color: avatarColor }}>
                            {initial}
                          </div>
                          <span style={{ fontWeight: rank <= 3 ? 700 : 500 }}>{username}</span>
                        </div>
                      </td>
                      <td>
                        <span className="score-pill">
                          {entry.score} pts
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{
                          height: 6,
                          background: 'var(--surface-light)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: medal
                              ? `linear-gradient(90deg, ${medal.color}, ${medal.color}88)`
                              : 'linear-gradient(90deg, #4f46e5, #818cf8)',
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {pct}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <p>No rankings yet. Complete activities to appear here!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
