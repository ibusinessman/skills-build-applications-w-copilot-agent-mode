import React, { useEffect, useState } from 'react';

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

  if (loading) return <div className="text-center mt-4"><div className="spinner-border text-danger" role="status"></div></div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="container mt-4">
      <h1 className="text-primary mb-4">Workouts</h1>
      <div className="row">
        {workouts.map((workout, index) => (
          <div className="col-md-4 mb-4" key={workout._id || index}>
            <div className="card shadow-sm h-100">
              <div className="card-header bg-danger text-white">
                <h5 className="card-title mb-0">{workout.name}</h5>
              </div>
              <div className="card-body">
                <p className="card-text">{workout.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Workouts;
