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
  const { isAuthenticated, user, roles: userRoles, permissions: userPermissions, hasRole, hasPermission, hasAllPermissions: userHasAllPermissions, isLoading } = useAuthStore();
  const location = useLocation();

  console.log('[ProtectedRoute] Checking route:', location.pathname);
  console.log('[ProtectedRoute] isLoading:', isLoading);
  console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated);
  console.log('[ProtectedRoute] User:', user);
  console.log('[ProtectedRoute] User Roles:', userRoles);
  console.log('[ProtectedRoute] User Permissions:', userPermissions);
  console.log('[ProtectedRoute] Required Role (single):', role);
  console.log('[ProtectedRoute] Required Roles (array):', roles);
  console.log('[ProtectedRoute] Required Permission (single):', permission);
  console.log('[ProtectedRoute] Required Permissions (array):', permissions);


  if (isLoading) {
    console.log('[ProtectedRoute] Decision: Loading...');
    return <div>Loading authentication status...</div>;
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Decision: Not authenticated, redirecting to login.');
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
