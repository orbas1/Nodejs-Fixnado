import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { SERVICEMAN_ALLOWED_ROLES, formatRoleLabel } from '../../constants/accessControl.js';
import { useSession } from '../../hooks/useSession.js';

function AccessDenied({ roleLabel }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <div className="rounded-3xl border border-primary/20 bg-white/95 p-10 text-center shadow-glow">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Access restricted</p>
        <h1 className="mt-4 text-2xl font-semibold text-primary">Serviceman workspace requires crew access</h1>
        <p className="mt-4 text-sm text-slate-600">
          This area is reserved for crew leads and operations administrators. You are currently signed in as
          {roleLabel ? ` ${roleLabel}` : ' a different role'}. If you need access please contact your Fixnado administrator.
        </p>
      </div>
    </div>
  );
}

AccessDenied.propTypes = {
  roleLabel: PropTypes.string
};

AccessDenied.defaultProps = {
  roleLabel: null
};

export default function ServicemanProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, hasRole, role } = useSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRole(SERVICEMAN_ALLOWED_ROLES)) {
    return <AccessDenied roleLabel={formatRoleLabel(role)} />;
  }

  return children;
}

ServicemanProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};
