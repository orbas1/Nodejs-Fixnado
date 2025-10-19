import PropTypes from 'prop-types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const TONE_CLASS = {
  info: 'border-primary/30 bg-primary/10 text-primary',
  warning: 'border-amber-300 bg-amber-50/90 text-amber-700',
  critical: 'border-rose-300 bg-rose-50/90 text-rose-700'
};

export default function LearnerAlertPanel({ alerts, t }) {
  if (!alerts.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      {alerts.map((alert) => {
        const tone = TONE_CLASS[alert.severity] ?? TONE_CLASS.info;
        return (
          <article
            key={alert.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 shadow-sm ${tone}`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-1 h-5 w-5" aria-hidden="true" />
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
            {alert.actionHref ? (
              <Link
                to={alert.actionHref}
                className="rounded-full border border-current px-4 py-1.5 text-xs font-semibold transition hover:bg-white/20"
              >
                {alert.actionLabel || t('learner.overview.alertDefaultCta')}
              </Link>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

LearnerAlertPanel.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      severity: PropTypes.string,
      actionLabel: PropTypes.string,
      actionHref: PropTypes.string
    })
  ).isRequired,
  t: PropTypes.func.isRequired
};
