import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink } from 'react-router-dom';
import Activities from './components/Activities';
import Leaderboard from './components/Leaderboard';
import Teams from './components/Teams';
import Users from './components/Users';
import Workouts from './components/Workouts';
import './App.css';

const NAV_ITEMS = [
  { to: '/activities', label: 'Activities' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/teams', label: 'Teams' },
  { to: '/users', label: 'Members' },
  { to: '/workouts', label: 'Workouts' },
];

const FEATURES = [
  {
    icon: '⚡',
    color: 'rgba(245,158,11,0.15)',
    iconColor: '#fbbf24',
    title: 'Activity Tracking',
    desc: 'Log runs, swims, lifts, and more. Every rep, every mile — captured and visualized.',
  },
  {
    icon: '🏆',
    color: 'rgba(16,185,129,0.15)',
    iconColor: '#34d399',
    title: 'Live Leaderboard',
    desc: 'Real-time rankings keep students motivated and competing at their personal best.',
  },
  {
    icon: '👥',
    color: 'rgba(6,182,212,0.15)',
    iconColor: '#22d3ee',
    title: 'Team Challenges',
    desc: 'Build squads, race to the top, and foster a culture of collective achievement.',
  },
  {
    icon: '💪',
    color: 'rgba(79,70,229,0.15)',
    iconColor: '#818cf8',
    title: 'Smart Workouts',
    desc: 'Curated workout plans tailored to fitness levels — from beginner to varsity athlete.',
  },
  {
    icon: '📊',
    color: 'rgba(239,68,68,0.15)',
    iconColor: '#f87171',
    title: 'Progress Analytics',
    desc: 'Visual dashboards show trends, PRs, and performance across weeks and months.',
  },
  {
    icon: '🎯',
    color: 'rgba(168,85,247,0.15)',
    iconColor: '#c084fc',
    title: 'Goal Setting',
    desc: "Set daily and weekly targets. Get nudged when you're close — celebrate when you hit them.",
  },
];

const NAV_CARDS = [
  { to: '/activities', icon: '⚡', bg: 'rgba(245,158,11,0.15)', title: 'Activities', desc: 'View logged workouts and recent activity' },
  { to: '/leaderboard', icon: '🏆', bg: 'rgba(16,185,129,0.15)', title: 'Leaderboard', desc: 'See top performers and live rankings' },
  { to: '/teams', icon: '👥', bg: 'rgba(6,182,212,0.15)', title: 'Teams', desc: 'Browse squads and team membership' },
  { to: '/users', icon: '👤', bg: 'rgba(79,70,229,0.15)', title: 'Members', desc: 'Explore all registered athletes' },
  { to: '/workouts', icon: '💪', bg: 'rgba(239,68,68,0.15)', title: 'Workouts', desc: 'Discover workout plans and routines' },
];

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg octofit-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          🐙 OctoFit Tracker
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span style={{ fontSize: '1.3rem' }}>☰</span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto gap-1">
            {NAV_ITEMS.map(({ to, label }) => (
              <li className="nav-item" key={to}>
                <NavLink
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  to={to}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="ms-3">
            <Link to="/users" className="btn btn-sm" style={{
              background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '0.45rem 1.1rem',
              border: 'none',
            }}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="hero-section text-center">
      <div className="container position-relative">
        <div className="hero-badge">🚀 Fitness Platform for Schools</div>
        <h1 className="hero-title">
          Track. Compete.<br />
          <span className="gradient-text">Get Stronger Together.</span>
        </h1>
        <p className="hero-subtitle">
          OctoFit Tracker brings school-wide fitness programs to life with real-time activity
          logging, team competitions, leaderboards, and smart workout plans — all in one place.
        </p>
        <div>
          <Link to="/leaderboard" className="hero-cta-primary">
            View Leaderboard →
          </Link>
          <Link to="/activities" className="hero-cta-secondary">
            Browse Activities
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { number: '5+', label: 'Athletes' },
    { number: '2', label: 'Teams' },
    { number: '5+', label: 'Activities Logged' },
    { number: '5', label: 'Workout Plans' },
  ];

  return (
    <div className="stats-bar">
      <div className="container">
        <div className="row justify-content-center">
          {stats.map(({ number, label }) => (
            <div className="col-6 col-md-3" key={label}>
              <div className="stat-item">
                <span className="stat-number">{number}</span>
                <span className="stat-label">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="features-section">
      <div className="container">
        <div className="text-center mb-2">
          <span className="section-label">Platform Features</span>
        </div>
        <h2 className="section-title text-center">Everything your school needs</h2>
        <p className="section-subtitle text-center">
          A complete fitness SaaS built for educators, coaches, and student athletes.
        </p>
        <div className="row g-4">
          {FEATURES.map(({ icon, color, iconColor, title, desc }) => (
            <div className="col-md-4" key={title}>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: color }}>
                  <span style={{ color: iconColor }}>{icon}</span>
                </div>
                <h5>{title}</h5>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NavCardsSection() {
  return (
    <section className="nav-cards-section">
      <div className="container">
        <div className="text-center mb-2">
          <span className="section-label">Explore the App</span>
        </div>
        <h2 className="section-title text-center">Jump right in</h2>
        <p className="section-subtitle text-center">
          Navigate to any section of the platform from here.
        </p>
        <div className="row g-3">
          {NAV_CARDS.map(({ to, icon, bg, title, desc }) => (
            <div className="col-6 col-md-4 col-lg" key={to}>
              <Link to={to} className="nav-card">
                <div className="nav-card-icon" style={{ background: bg }}>
                  {icon}
                </div>
                <h6>{title}</h6>
                <p>{desc}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <NavCardsSection />
    </>
  );
}

function Footer() {
  return (
    <footer className="octofit-footer">
      <div className="container">
        <p className="mb-1">🐙 <strong>OctoFit Tracker</strong> — Fitness Platform for Mergington High School</p>
        <p className="mb-0" style={{ fontSize: '0.78rem', opacity: 0.6 }}>
          Built with Django REST Framework · React 18 · Bootstrap 5
        </p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/users" element={<Users />} />
            <Route path="/workouts" element={<Workouts />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
