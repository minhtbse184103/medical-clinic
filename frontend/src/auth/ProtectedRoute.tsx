import { Flex, Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './useAuth';
import type { Role } from '../types/api';

interface ProtectedRouteProps {
  /** When set, only these roles may enter. Omit to require any signed-in user. */
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  // Without this guard a refresh on a protected URL would bounce to /login
  // before the stored session has been restored.
  if (initializing) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
