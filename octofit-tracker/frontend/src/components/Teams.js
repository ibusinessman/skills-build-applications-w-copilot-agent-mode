import React, { useEffect, useState } from 'react';

const TEAM_COLORS = [
  { accent: '#06b6d4', bg: 'rgba(6,182,212,0.15)', icon: '🏊' },
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '🏆' },
  { accent: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: '⚡' },
  { accent: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🎯' },
];

function getAvatarColor(name) {
  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://CODESPACE_NAME-8000.app.github.dev/api/teams/')
      .then(response => response.json())
      .then(data => {
        setTeams(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching teams:', error);
        setError('Failed to load teams.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-ring"></div>
        <p>Loading teams…</p>
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
            <h1>👥 Teams</h1>
            <p>Squads competing for the top spot on the leaderboard</p>
          </div>
          <span style={{
            background: 'rgba(6,182,212,0.15)',
            color: '#22d3ee',
            border: '1px solid rgba(6,182,212,0.3)',
            padding: '0.35rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}>
            {teams.length} teams
          </span>
        </div>

        <div className="row g-4">
          {teams.map((team, index) => {
            const theme = TEAM_COLORS[index % TEAM_COLORS.length];
            const members = team.members || [];

            return (
              <div className="col-md-6" key={team._id || index}>
                <div className="team-card">
                  <div className="team-card-header" style={{ borderLeft: `3px solid ${theme.accent}` }}>
                    <div className="team-icon" style={{ background: theme.bg }}>
                      <span>{theme.icon}</span>
                    </div>
                    <div>
                      <h5>{team.name}</h5>
                      <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="ms-auto">
                      <span style={{
                        background: theme.bg,
                        color: theme.accent,
                        border: `1px solid ${theme.accent}44`,
                        padding: '0.2rem 0.7rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}>
                        Active
                      </span>
                    </div>
                  </div>

                  <ul className="team-members-list">
                    {members.length === 0 && (
                      <li className="team-member-item" style={{ color: 'var(--text-secondary)' }}>
                        No members yet
                      </li>
                    )}
                    {members.map((member, mIndex) => {
                      const name = typeof member === 'object' ? (member.username || member.name || 'Unknown') : member;
                      const color = getAvatarColor(name);
                      const initial = name ? name[0].toUpperCase() : '?';

                      return (
                        <li className="team-member-item" key={mIndex}>
                          <div className="avatar" style={{ background: color + '22', color: color }}>
                            {initial}
                          </div>
                          <span style={{ fontWeight: 500 }}>{name}</span>
                          <span className="ms-auto" style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                          }}>
                            Member
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p>No teams created yet. Form your squad!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Teams;
