import React, { useEffect, useState } from 'react';

// Backend API endpoint for activities
// In GitHub Codespaces, use: https://CODESPACE_NAME-8000.app.github.dev/api/activities/
const CODESPACE_NAME = process.env.REACT_APP_CODESPACE_NAME;
const API_URL = CODESPACE_NAME
  ? `https://${CODESPACE_NAME}-8000.app.github.dev/api/activities/`
  : 'http://localhost:8000/api/activities/';

function Activities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch activities');
        return response.json();
      })
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const parts = duration.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    }
    return duration;
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
      Error loading activities: {error}
    </div>
  );

  return (
    <div className="content-container">
      <h1>Activities</h1>
      <p className="text-muted">Track your fitness activities at Mergington High School</p>

      {activities.length === 0 ? (
        <div className="alert alert-info">No activities recorded yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Activity Type</th>
                <th>Duration</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => (
                <tr key={activity.id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="fw-semibold">
                      {activity.user ? activity.user.username : 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-primary">{activity.activity_type}</span>
                  </td>
                  <td>{formatDuration(activity.duration)}</td>
                  <td>
                    {activity.date
                      ? new Date(activity.date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Activities;
