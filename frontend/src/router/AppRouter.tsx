import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useRedux';
import { getMe } from '../store/slices/authSlice';

// Layout & Protected Route
import PageLayout from '../components/layout/PageLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Dashboard Pages
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import UserDashboard from '../pages/dashboard/UserDashboard';

// Admin Pages
import UsersPage from '../pages/admin/UsersPage';
import ActivityLogsPage from '../pages/admin/ActivityLogsPage';

// Projects and Tasks Pages
import ProjectsPage from '../pages/projects/ProjectsPage';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage';
import TasksPage from '../pages/tasks/TasksPage';
import ProfilePage from '../pages/ProfilePage';

// Dashboard Router depends on user role
import { useAppSelector } from '../hooks/useRedux';

const DashboardRedirect: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  if (!user) return <Navigate to="/auth/login" />;
  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Attempt to resume session checking the refresh token implicitly via our axios setup or getMe
    dispatch(getMe());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/auth/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/auth/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected Routes inside Page Layout */}
      <Route
        element={
          <ProtectedRoute>
            <PageLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardRedirect />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        
        {/* Admin only routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute requiredRole="admin">
              <ActivityLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
