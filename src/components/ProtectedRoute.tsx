import React from "react";
import { useAuth } from "../Auth";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Checks whether any user is logged in.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  return user ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ path: location.pathname }} />
  );
}

/**
 * Checks whether a user with one of the specified roles is logged in.
 *
 * @param requiredRoles the list of acceptable roles
 * @returns
 */
function ProtectedRouteWithRoles(
  { children }: { children: React.ReactNode },
  requiredRoles: string[]
) {
  const { user, userRole } = useAuth();
  const location = useLocation();

  return user && userRole && requiredRoles.includes(userRole) ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ path: location.pathname }} />
  );
}

export { ProtectedRoute, ProtectedRouteWithRoles };
