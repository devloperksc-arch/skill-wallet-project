import { useAuth } from '../context/AuthContext.jsx';
import Forbidden from '../pages/Forbidden.jsx';

export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Forbidden />;
  return children;
}
