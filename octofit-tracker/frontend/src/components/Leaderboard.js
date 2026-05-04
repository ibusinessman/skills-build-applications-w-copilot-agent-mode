import React, { useEffect, useState } from 'react';

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

  if (loading) return <div className="text-center mt-4"><div className="spinner-border text-success" role="status"></div></div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="container mt-4">
      <h1 className="text-primary mb-4">Leaderboard</h1>
      <div className="table-responsive">
        <table className="table table-striped table-hover table-bordered">
          <thead className="table-success">
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard
              .sort((a, b) => b.score - a.score)
              .map((entry, index) => (
                <tr key={entry._id || index}>
                  <td>{index + 1}</td>
                  <td>{entry.user && entry.user.username ? entry.user.username : entry.user}</td>
                  <td><span className="badge bg-success">{entry.score}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;
