import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'hr' | 'employee';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const isOnOnboarding = location.pathname.startsWith('/onboarding');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Determine if onboarding is needed:
  // Only admins who have no company OR whose company setup is incomplete should see the wizard.
  // Non-admin users (employees, managers, HR who were invited) should NEVER be redirected to onboarding.
  const userRole = String(user?.role || 'employee').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'super admin';
  const hasCompany = !!user?.companyId;

  // Only redirect to onboarding if:
  // 1. User is an admin AND
  // 2. Has no company at all (brand new registration) AND
  // 3. Not already on the onboarding page
  // If user HAS a companyId but company object isn't loaded yet, do NOT redirect — wait for getMe.
  const needsOnboarding = isAdmin && !hasCompany && !isOnOnboarding;

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requiredRole) {
    const roleRank = { 'admin': 4, 'manager': 3, 'hr': 2, 'employee': 1 };
    
    // Safely normalize the user role in case it comes back as uppercase from the DB or seed scripts
    const normalizedUserRole = userRole === 'super admin' ? 'admin' : userRole;
    
    const requiredRank = roleRank[requiredRole as keyof typeof roleRank] || 1;
    const userRank = roleRank[normalizedUserRole as keyof typeof roleRank] || 1;

    if (userRank < requiredRank) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
