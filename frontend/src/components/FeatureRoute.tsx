import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';

interface FeatureRouteProps {
  children: React.ReactNode;
  /** The feature key to check (e.g. 'teamChat', 'calendar', 'timeTracking') */
  featureKey: string;
  /** Where to redirect if the feature is disabled. Defaults to '/' */
  redirectTo?: string;
}

/**
 * Wraps a route element to enforce feature-flag checks.
 * If the feature is explicitly disabled (set to false in company.features),
 * the user is redirected to a safe page instead.
 *
 * Features that are not set at all default to ENABLED (true).
 */
const FeatureRoute: React.FC<FeatureRouteProps> = ({ children, featureKey, redirectTo = '/' }) => {
  const { user } = useAppSelector((state) => state.auth);
  const companyFeatures = (user as any)?.company?.features as Record<string, boolean> | undefined;

  // If the feature is explicitly false, redirect
  if (companyFeatures && companyFeatures[featureKey] === false) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default FeatureRoute;
