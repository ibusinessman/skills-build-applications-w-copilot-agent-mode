import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink } from 'react-router-dom';
import Activities from './components/Activities';
import Leaderboard from './components/Leaderboard';
import Teams from './components/Teams';
import Users from './components/Users';
import Workouts from './components/Workouts';
import './App.css';

function Home() {
  return (
    <div className="text-center content-container">
      <h1 className="display-4 mb-3">Welcome to OctoFit Tracker</h1>
      <p className="lead text-muted">Fitness tracking for Mergington High School</p>
      <div className="row mt-4 g-4">
        {[
          { to: '/activities', icon: '🏃', title: 'Activities', desc: 'Log and track your workouts' },
          { to: '/leaderboard', icon: '🏆', title: 'Leaderboard', desc: 'See who\'s on top' },
          { to: '/teams', icon: '👥', title: 'Teams', desc: 'Compete with your team' },
          { to: '/workouts', icon: '💪', title: 'Workouts', desc: 'Browse workout plans' },
          { to: '/users', icon: '👤', title: 'Users', desc: 'View all students' },
        ].map(item => (
          <div key={item.to} className="col-md-4">
            <Link to={item.to} className="text-decoration-none">
              <div className="card h-100 text-center p-3">
                <div className="card-body">
                  <div style={{ fontSize: '3rem' }}>{item.icon}</div>
                  <h5 className="card-title mt-2">{item.title}</h5>
                  <p className="card-text text-muted">{item.desc}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark">
          <div className="container">
            <Link className="navbar-brand" to="/">
              🐙 OctoFit Tracker
            </Link>
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
                {[
                  { to: '/activities', label: 'Activities' },
                  { to: '/leaderboard', label: 'Leaderboard' },
                  { to: '/teams', label: 'Teams' },
                  { to: '/workouts', label: 'Workouts' },
                  { to: '/users', label: 'Users' },
                ].map(item => (
                  <li key={item.to} className="nav-item">
                    <NavLink className="nav-link" to={item.to}>{item.label}</NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/users" element={<Users />} />
            <Route path="/workouts" element={<Workouts />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
