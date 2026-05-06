import React, { useEffect, useState } from 'react';

const ACTIVITY_ICONS = {
  running: '🏃', run: '🏃', jogging: '🏃',
  swimming: '🏊', swim: '🏊',
  cycling: '🚴', bike: '🚴', biking: '🚴',
  yoga: '🧘', stretching: '🧘',
  weightlifting: '🏋️', weights: '🏋️', lifting: '🏋️',
  basketball: '🏀', soccer: '⚽', football: '🏈',
  hiking: '🥾', walk: '🚶', walking: '🚶',
};

function getActivityIcon(type) {
  if (!type) return '⚡';
  const key = type.toLowerCase();
  for (const [k, v] of Object.entries(ACTIVITY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return '⚡';
}

function getAvatarColor(name) {
  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

function Activities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://CODESPACE_NAME-8000.app.github.dev/api/activities/')
      .then(response => response.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching activities:', error);
        setError('Failed to load activities.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-ring"></div>
        <p>Loading activities…</p>
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
            <h1>⚡ Activities</h1>
            <p>All logged fitness activities across the school</p>
          </div>
          <span style={{
            background: 'rgba(245,158,11,0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245,158,11,0.3)',
            padding: '0.35rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}>
            {activities.length} entries
          </span>
        </div>

        <div className="dark-card">
          <div className="table-responsive">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Athlete</th>
                  <th>Activity</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => {
                  const username = typeof activity.user === 'object'
                    ? (activity.user?.username || activity.user?.name || '')
                    : (activity.user || '');
                  const icon = getActivityIcon(activity.activity_type);
                  const avatarColor = getAvatarColor(username);
                  const initial = username ? username[0].toUpperCase() : '?';

                  return (
                    <tr key={activity._id || index}>
                      <td style={{ color: 'var(--text-secondary)', width: 50 }}>{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar" style={{ background: avatarColor + '22', color: avatarColor }}>
                            {initial}
                          </div>
                          <span style={{ fontWeight: 600 }}>{username || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="activity-type-pill">
                          {icon} {activity.activity_type || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="duration-pill">
                          🕐 {activity.duration || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
            <p>No activities logged yet. Start moving!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Activities;
