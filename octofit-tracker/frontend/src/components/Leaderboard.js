import React, { useEffect, useState } from 'react';

// Backend API endpoint for leaderboard
// In GitHub Codespaces, use: https://CODESPACE_NAME-8000.app.github.dev/api/leaderboard/
const CODESPACE_NAME = process.env.REACT_APP_CODESPACE_NAME;
const API_URL = CODESPACE_NAME
  ? `https://${CODESPACE_NAME}-8000.app.github.dev/api/leaderboard/`
  : 'http://localhost:8000/api/leaderboard/';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        return response.json();
      })
      .then(data => {
        setLeaderboard(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger" role="alert">
      Error loading leaderboard: {error}
    </div>
  );

  return (
    <div className="content-container">
      <h1>Leaderboard</h1>
      <p className="text-muted">Top performers at Mergington High School</p>

      {leaderboard.length === 0 ? (
        <div className="alert alert-info">No leaderboard entries yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Email</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                return (
                  <tr key={entry.id} className={rank <= 3 ? 'table-active' : ''}>
                    <td className={getRankClass(rank)}>
                      <span style={{ fontSize: rank <= 3 ? '1.3rem' : '1rem' }}>
                        {getRankBadge(rank)}
                      </span>
                    </td>
                    <td className="fw-semibold">
                      {entry.user ? entry.user.username : 'Unknown'}
                    </td>
                    <td className="text-muted">
                      {entry.user ? entry.user.email : ''}
                    </td>
                    <td>
                      <span className="badge bg-primary fs-6">{entry.score}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
