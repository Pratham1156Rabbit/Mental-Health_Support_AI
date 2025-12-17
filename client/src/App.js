import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MoodTracker from './components/MoodTracker';
import Journal from './components/Journal';
import Resources from './components/Resources';
import HomeWiki from './pages/HomeWiki';
import MentalHealthInfo from './pages/MentalHealthInfo';
import Report from './pages/Report';
import ChatHome from './pages/ChatHome';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">💙</span>
          Mental Health AI
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Rabbit Chat</Link>
          <Link to="/mental-health" className="nav-link">Mental Health Info</Link>
          {isAuthenticated ? (
            <>
              <Link to="/home" className="nav-link">Wiki Home</Link>
              <Link to="/mood" className="nav-link">Mood Tracker</Link>
              <Link to="/journal" className="nav-link">Journal</Link>
              <Link to="/resources" className="nav-link">Resources</Link>
              <Link to="/report" className="nav-user-btn" title="View your full report">
                Hello, {user?.name || user?.username || user?.email}
              </Link>
              <button onClick={handleLogout} className="nav-link logout-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/home" className="nav-link">Wiki Home</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ChatHome />} />
              <Route path="/home" element={<HomeWiki />} />
              <Route path="/mental-health" element={<MentalHealthInfo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                }
              />
              <Route path="/chat" element={<Navigate to="/" replace />} />
              <Route
                path="/mood"
                element={
                  <ProtectedRoute>
                    <MoodTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedRoute>
                    <Journal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources"
                element={
                  <ProtectedRoute>
                    <Resources />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

