import React, { useEffect, useState } from 'react';

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

  if (loading) return <div className="text-center mt-4"><div className="spinner-border text-info" role="status"></div></div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="container mt-4">
      <h1 className="text-primary mb-4">Teams</h1>
      <div className="row">
        {teams.map((team, index) => (
          <div className="col-md-6 mb-4" key={team._id || index}>
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">{team.name}</h5>
              </div>
              <div className="card-body">
                <h6 className="card-subtitle mb-2 text-muted">Members:</h6>
                <ul className="list-group list-group-flush">
                  {team.members && team.members.map((member, mIndex) => (
                    <li className="list-group-item" key={mIndex}>
                      {typeof member === 'object' ? member.username : member}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Teams;
