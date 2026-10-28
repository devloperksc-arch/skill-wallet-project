import { useAuth } from '../context/AuthContext.jsx';

/**
 * RoleRoute: Unrestricted access per user request so switching or editing
 * from employee to hr never shows "Access Denied" or Forbidden.
 */
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return null;
  // Security gate removed: all authenticated users can access all pages
  return children;
}
