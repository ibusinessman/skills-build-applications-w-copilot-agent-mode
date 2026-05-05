import React, { useEffect, useState } from 'react';

// Backend API endpoint for teams
// In GitHub Codespaces, use: https://CODESPACE_NAME-8000.app.github.dev/api/teams/
const CODESPACE_NAME = process.env.REACT_APP_CODESPACE_NAME;
const API_URL = CODESPACE_NAME
  ? `https://${CODESPACE_NAME}-8000.app.github.dev/api/teams/`
  : 'http://localhost:8000/api/teams/';

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch teams');
        return response.json();
      })
      .then(data => {
        setTeams(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger" role="alert">
      Error loading teams: {error}
    </div>
  );

  return (
    <div className="content-container">
      <h1>Teams</h1>
      <p className="text-muted">Compete together at Mergington High School</p>

      {teams.length === 0 ? (
        <div className="alert alert-info">No teams created yet.</div>
      ) : (
        <div className="row g-4">
          {teams.map(team => (
            <div key={team.id} className="col-md-6">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">👥 {team.name}</h5>
                </div>
                <div className="card-body">
                  <h6 className="text-muted mb-3">
                    Members ({team.members ? team.members.length : 0})
                  </h6>
                  {team.members && team.members.length > 0 ? (
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.members.map(member => (
                          <tr key={member.id}>
                            <td className="fw-semibold">{member.username}</td>
                            <td className="text-muted">{member.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted">No members yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Teams;
