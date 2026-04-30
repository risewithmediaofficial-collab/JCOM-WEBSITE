import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ChairmanDashboard from './pages/ChairmanDashboard';
import ConnectionsPage from './pages/ConnectionsPage';
import CRMDashboard from './pages/CRMDashboard';
import MeetingsPage from './pages/MeetingsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SearchBusinessDetailPage from './pages/SearchBusinessDetailPage';
import ProfilePage from './pages/ProfilePage';
import DealsPage from './pages/DealsPage';

function App() {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token'),
    user: (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })(),
    isAuthenticated: !!localStorage.getItem('token')
  });

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ token, user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  const roleRedirect = (user) => {
    if (!user) return '/login';
    if (user.role === 'Super Admin') return '/super-admin';
    if (user.role === 'Chairman') return '/chairman';
    return '/dashboard';
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/search/:userId" element={<SearchBusinessDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Auto-redirect from /dashboard based on role */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          {/* Super Admin */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['Super Admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          {/* Chairman */}
          <Route path="/chairman" element={
            <ProtectedRoute allowedRoles={['Chairman', 'Super Admin']}>
              <ChairmanDashboard />
            </ProtectedRoute>
          } />

          {/* Member+ Routes */}
          <Route path="/connections" element={
            <ProtectedRoute>
              <ConnectionsPage />
            </ProtectedRoute>
          } />

          <Route path="/crm" element={
            <ProtectedRoute>
              <CRMDashboard />
            </ProtectedRoute>
          } />

          <Route path="/meetings" element={
            <ProtectedRoute>
              <MeetingsPage />
            </ProtectedRoute>
          } />

          <Route path="/deals" element={
            <ProtectedRoute>
              <DealsPage />
            </ProtectedRoute>
          } />

          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
