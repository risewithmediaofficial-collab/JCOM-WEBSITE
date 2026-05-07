import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    const dashMap = {
      'Super Admin': '/super-admin',
      'Chairman': '/chairman'
    };
    return <Navigate to={dashMap[user?.role] || '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
