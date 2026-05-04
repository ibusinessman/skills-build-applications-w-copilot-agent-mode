import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Activities from './components/Activities';
import Leaderboard from './components/Leaderboard';
import Teams from './components/Teams';
import Users from './components/Users';
import Workouts from './components/Workouts';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container-fluid">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <div className="container-fluid">
            <Link className="navbar-brand fw-bold" to="/">OctoFit Tracker</Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/activities">Activities</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/leaderboard">Leaderboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/teams">Teams</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/users">Users</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/workouts">Workouts</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="mt-4">
          <Routes>
            <Route path="/activities" element={<Activities />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/users" element={<Users />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route
              path="/"
              element={
                <div className="text-center py-5">
                  <h1 className="display-4 text-primary">Welcome to OctoFit Tracker</h1>
                  <p className="lead text-muted">
                    Fitness tracking app for Mergington High School
                  </p>
                  <div className="row mt-4 justify-content-center">
                    <div className="col-md-2 mb-3">
                      <Link to="/activities" className="btn btn-primary w-100">Activities</Link>
                    </div>
                    <div className="col-md-2 mb-3">
                      <Link to="/leaderboard" className="btn btn-success w-100">Leaderboard</Link>
                    </div>
                    <div className="col-md-2 mb-3">
                      <Link to="/teams" className="btn btn-info w-100">Teams</Link>
                    </div>
                    <div className="col-md-2 mb-3">
                      <Link to="/users" className="btn btn-warning w-100">Users</Link>
                    </div>
                    <div className="col-md-2 mb-3">
                      <Link to="/workouts" className="btn btn-danger w-100">Workouts</Link>
                    </div>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
