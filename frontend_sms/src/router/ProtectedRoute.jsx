import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute component.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The child components to render if authenticated and authorized.
 * @param {string} [props.role] - The specific role required to access this route.
 * @param {string} [props.permission] - The specific permission required to access this route.
 * @param {string[]} [props.roles] - An array of roles, any of which can access this route.
 * @param {string[]} [props.permissions] - An array of permissions, any of which can access this route.
 * @param {boolean} [props.requireAllPermissions=false] - If true, user must have all permissions in `props.permissions`. Otherwise, user needs at least one.
 */
const ProtectedRoute = ({
  children,
  role, // specific single role
  permission, // specific single permission
  roles, // array of allowed roles (any of these)
  permissions, // array of allowed permissions
  requireAllPermissions = false, // if true, all permissions in the array are required
}) => {
  const { isAuthenticated, hasRole, hasPermission, hasAllPermissions: userHasAllPermissions, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    // Optional: Show a loading spinner or a blank page while auth state is loading
    // For now, returning null or a simple loading text.
    // Consider a global loading indicator handled by App or main layout.
    return <div>Loading authentication status...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access check
  let authorizedByRole = true;
  if (role) { // Check for a single specific role
    authorizedByRole = hasRole(role);
  } else if (roles && roles.length > 0) { // Check if user has any of the roles in the array
    authorizedByRole = roles.some(r => hasRole(r));
  }

  // Permission-based access check
  let authorizedByPermission = true;
  if (permission) { // Check for a single specific permission
    authorizedByPermission = hasPermission(permission);
  } else if (permissions && permissions.length > 0) { // Check for permissions array
    if (requireAllPermissions) {
      authorizedByPermission = userHasAllPermissions(permissions);
    } else {
      authorizedByPermission = permissions.some(p => hasPermission(p));
    }
  }

  if (!authorizedByRole || !authorizedByPermission) {
    // Redirect to an unauthorized page or the dashboard/home page
    // You might want to create a specific '/unauthorized' page
    return <Navigate to="/unauthorized" replace />;
    // Or simply: return <Navigate to="/dashboard" replace />; // if redirecting to a safe default
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  role: PropTypes.string,
  permission: PropTypes.string,
  roles: PropTypes.arrayOf(PropTypes.string),
  permissions: PropTypes.arrayOf(PropTypes.string),
  requireAllPermissions: PropTypes.bool,
};

export default ProtectedRoute;
