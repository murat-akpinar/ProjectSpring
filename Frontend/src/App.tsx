import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import './App.css';

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <CalendarPage />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <DashboardPage />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/projects"
        element={
          isAuthenticated ? (
            <ProjectsPage />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/projects/:id"
        element={
          isAuthenticated ? (
            <ProjectDetailPage />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};

export default App;

