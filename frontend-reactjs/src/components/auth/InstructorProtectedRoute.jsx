import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { INSTRUCTOR_ALLOWED_ROLES, formatRoleLabel } from '../../constants/accessControl.js';
import { useSession } from '../../hooks/useSession.js';
import { useLocale } from '../../hooks/useLocale.js';

function AccessDenied({ expectedRoles }) {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <div className="rounded-3xl border border-primary/20 bg-white/95 p-12 text-center shadow-glow">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
          {t('instructor.guard.restrictedEyebrow')}
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-primary">{t('instructor.guard.restrictedTitle')}</h1>
        <p className="mt-4 text-sm text-slate-600">
          {t('instructor.guard.restrictedBody', { roles: expectedRoles })}
        </p>
        <p className="mt-6 text-sm text-slate-500">{t('instructor.guard.restrictedHelp')}</p>
      </div>
    </div>
  );
}

AccessDenied.propTypes = {
  expectedRoles: PropTypes.string.isRequired
};

export default function InstructorProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, hasRole } = useSession();
  const permittedRoles =
    Array.isArray(allowedRoles) && allowedRoles.length > 0 ? allowedRoles : INSTRUCTOR_ALLOWED_ROLES;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRole(permittedRoles)) {
    const expected = permittedRoles.map((role) => formatRoleLabel(role)).join(' or ');
    return <AccessDenied expectedRoles={expected} />;
  }

  return children;
}

InstructorProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

InstructorProtectedRoute.defaultProps = {
  allowedRoles: INSTRUCTOR_ALLOWED_ROLES
};
