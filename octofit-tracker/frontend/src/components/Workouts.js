import React, { useEffect, useState } from 'react';

const WORKOUT_THEMES = [
  { accent: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🔥', label: 'HIIT' },
  { accent: '#4f46e5', bg: 'rgba(79,70,229,0.12)', icon: '💪', label: 'Strength' },
  { accent: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: '🏊', label: 'Cardio' },
  { accent: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🧘', label: 'Flexibility' },
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '⚡', label: 'Power' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'Pro'];

function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://CODESPACE_NAME-8000.app.github.dev/api/workouts/')
      .then(response => response.json())
      .then(data => {
        setWorkouts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching workouts:', error);
        setError('Failed to load workouts.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-ring"></div>
        <p>Loading workouts…</p>
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
            <h1>💪 Workouts</h1>
            <p>Curated training plans for every fitness level</p>
          </div>
          <span style={{
            background: 'rgba(239,68,68,0.15)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,0.3)',
            padding: '0.35rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}>
            {workouts.length} plans
          </span>
        </div>

        <div className="row g-4">
          {workouts.map((workout, index) => {
            const theme = WORKOUT_THEMES[index % WORKOUT_THEMES.length];
            const difficulty = DIFFICULTIES[index % DIFFICULTIES.length];

            return (
              <div className="col-md-4" key={workout._id || index}>
                <div className="workout-card">
                  <div className="workout-card-accent" style={{
                    background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}66)`,
                  }} />
                  <div className="workout-card-body">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        background: theme.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        flexShrink: 0,
                      }}>
                        {theme.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: 0 }}>{workout.name}</h5>
                        <div className="d-flex gap-2 mt-1 flex-wrap">
                          <span style={{
                            background: theme.bg,
                            color: theme.accent,
                            border: `1px solid ${theme.accent}44`,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            {theme.label}
                          </span>
                          <span style={{
                            background: 'var(--surface-light)',
                            color: 'var(--text-secondary)',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}>
                            {difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
                      {workout.description || 'A challenging and rewarding workout designed to push your limits and improve overall performance.'}
                    </p>
                    <div style={{
                      marginTop: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        🕐 45–60 min
                      </span>
                      <button style={{
                        background: theme.bg,
                        color: theme.accent,
                        border: `1px solid ${theme.accent}44`,
                        padding: '0.35rem 0.9rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        Start →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💪</div>
            <p>No workout plans yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Workouts;
