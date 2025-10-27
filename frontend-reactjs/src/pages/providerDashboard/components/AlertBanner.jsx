import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../../../hooks/useLocale.js';

export default function AlertBanner({ alert }) {
  const { t } = useLocale();

  return (
    <div
      className="provider-dashboard__card provider-dashboard__card-muted border border-amber-400/40"
      role="alert"
      aria-live="assertive"
      data-qa={`provider-dashboard-alert-${alert.id}`}
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="mt-1 h-5 w-5 text-amber-300" aria-hidden="true" />
        <p className="text-sm text-[var(--provider-text-primary)]">{alert.message}</p>
      </div>
      {alert.actionHref ? (
        <Link
          to={alert.actionHref}
          className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/10 px-4 py-2 text-xs font-semibold text-amber-200 shadow-sm transition hover:border-amber-200 hover:text-amber-100"
        >
          {alert.actionLabel || t('providerDashboard.alertAction')}
        </Link>
      ) : null}
    </div>
  );
}

AlertBanner.propTypes = {
  alert: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    message: PropTypes.string.isRequired,
    actionHref: PropTypes.string,
    actionLabel: PropTypes.string
  }).isRequired
};
