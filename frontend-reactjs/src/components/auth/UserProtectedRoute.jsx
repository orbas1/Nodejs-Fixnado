import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { LEARNER_ALLOWED_ROLES, formatRoleLabel } from '../../constants/accessControl.js';
import { useSession } from '../../hooks/useSession.js';
import { useLocale } from '../../hooks/useLocale.js';

function RestrictedNotice({ expectedRoles }) {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <div className="space-y-4 rounded-3xl border border-primary/20 bg-white/95 p-12 text-center shadow-glow">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
          {t('learner.guard.restrictedEyebrow')}
        </p>
        <h1 className="text-2xl font-semibold text-primary">{t('learner.guard.restrictedTitle')}</h1>
        <p className="text-sm text-slate-600">
          {t('learner.guard.restrictedBody', { roles: expectedRoles })}
        </p>
        <p className="text-sm text-slate-500">{t('learner.guard.restrictedHelp')}</p>
      </div>
    </div>
  );
}

RestrictedNotice.propTypes = {
  expectedRoles: PropTypes.string.isRequired
};

export default function UserProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, hasRole } = useSession();
  const permittedRoles =
    Array.isArray(allowedRoles) && allowedRoles.length > 0 ? allowedRoles : LEARNER_ALLOWED_ROLES;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRole(permittedRoles)) {
    const expected = permittedRoles.map((role) => formatRoleLabel(role)).join(' or ');
    return <RestrictedNotice expectedRoles={expected} />;
  }

  return children;
}

UserProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

UserProtectedRoute.defaultProps = {
  allowedRoles: LEARNER_ALLOWED_ROLES
};
