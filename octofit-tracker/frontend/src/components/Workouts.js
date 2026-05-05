import React, { useEffect, useState } from 'react';

// Backend API endpoint for workouts
// In GitHub Codespaces, use: https://CODESPACE_NAME-8000.app.github.dev/api/workouts/
const CODESPACE_NAME = process.env.REACT_APP_CODESPACE_NAME;
const API_URL = CODESPACE_NAME
  ? `https://${CODESPACE_NAME}-8000.app.github.dev/api/workouts/`
  : 'http://localhost:8000/api/workouts/';

function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch workouts');
        return response.json();
      })
      .then(data => {
        setWorkouts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const workoutIcons = {
    'Cycling Training': '🚴',
    'Crossfit': '🏋️',
    'Running Training': '🏃',
    'Strength Training': '💪',
    'Swimming Training': '🏊',
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
      Error loading workouts: {error}
    </div>
  );

  return (
    <div className="content-container">
      <h1>Workouts</h1>
      <p className="text-muted">Personalized workout plans for Mergington High School students</p>

      {workouts.length === 0 ? (
        <div className="alert alert-info">No workout plans available yet.</div>
      ) : (
        <div className="row g-4">
          {workouts.map(workout => (
            <div key={workout.id} className="col-md-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">
                    {workoutIcons[workout.name] || '🏅'} {workout.name}
                  </h5>
                </div>
                <div className="card-body">
                  <p className="card-text">{workout.description}</p>
                  <button className="btn btn-primary btn-sm mt-2">
                    Start Workout
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {workouts.length > 0 && (
        <div className="mt-4">
          <h2>All Workout Plans</h2>
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Workout Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map((workout, index) => (
                  <tr key={workout.id}>
                    <td>{index + 1}</td>
                    <td className="fw-semibold">
                      {workoutIcons[workout.name] || '🏅'} {workout.name}
                    </td>
                    <td className="text-muted">{workout.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workouts;
