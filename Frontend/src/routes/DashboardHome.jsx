import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Dashboard from '../pages/Dashboard';

export default function DashboardHome() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (user?.role === 'mechanic') {
    return <Navigate to="/dashboard/mechanic" replace />;
  }

  return <Dashboard />;
}
