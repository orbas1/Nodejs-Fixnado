import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '../ui/Spinner.jsx';
import { useAdminSession } from '../../providers/AdminSessionProvider.jsx';

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminSession();
  const location = useLocation();
  const bypassAuth =
    import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === '1';

  if (loading && !bypassAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="sr-only">Checking admin access</span>
      </div>
    );
  }

  if (!bypassAuth && !isAuthenticated) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return children;
}

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};
