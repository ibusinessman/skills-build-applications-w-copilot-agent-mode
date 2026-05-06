import React, { useEffect, useState } from 'react';

function getAvatarColor(name) {
  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'Pro'];

function getFitnessLevel(index) {
  return FITNESS_LEVELS[index % FITNESS_LEVELS.length];
}

function getLevelColor(level) {
  const map = {
    Beginner: { color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
    Intermediate: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
    Advanced: { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
    Elite: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
    Pro: { color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  };
  return map[level] || map.Beginner;
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://CODESPACE_NAME-8000.app.github.dev/api/users/')
      .then(response => response.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        setError('Failed to load users.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-ring"></div>
        <p>Loading members…</p>
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

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h1>👤 Members</h1>
            <p>All registered athletes at Mergington High School</p>
          </div>
          <span style={{
            background: 'rgba(79,70,229,0.15)',
            color: '#818cf8',
            border: '1px solid rgba(79,70,229,0.3)',
            padding: '0.35rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}>
            {users.length} members
          </span>
        </div>

        <div className="dark-card">
          <div className="table-responsive">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Athlete</th>
                  <th>Email</th>
                  <th>Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const avatarColor = getAvatarColor(user.username);
                  const initial = user.username ? user.username[0].toUpperCase() : '?';
                  const level = getFitnessLevel(index);
                  const levelStyle = getLevelColor(level);

                  return (
                    <tr key={user._id || index}>
                      <td style={{ color: 'var(--text-secondary)', width: 50 }}>{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar" style={{ background: avatarColor + '22', color: avatarColor }}>
                            {initial}
                          </div>
                          <span style={{ fontWeight: 600 }}>{user.username || '—'}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>
                        {user.email || '—'}
                      </td>
                      <td>
                        <span style={{
                          background: levelStyle.bg,
                          color: levelStyle.color,
                          border: `1px solid ${levelStyle.color}44`,
                          padding: '0.2rem 0.7rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}>
                          {level}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#34d399',
                            boxShadow: '0 0 6px #34d399',
                          }} />
                          <span style={{ fontSize: '0.85rem', color: '#34d399' }}>Active</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {users.length === 0 && (
          <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
            <p>No members registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;
