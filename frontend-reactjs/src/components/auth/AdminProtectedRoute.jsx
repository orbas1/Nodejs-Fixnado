import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '../ui/Spinner.jsx';
import { useAdminSession } from '../../providers/AdminSessionProvider.jsx';

const bypassAdminAuth =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_DISABLE_ADMIN_AUTH === 'true';

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="sr-only">Checking admin access</span>
      </div>
    );
  }

  if (!isAuthenticated && !bypassAdminAuth) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return children;
}

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};
