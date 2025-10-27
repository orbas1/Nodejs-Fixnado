import PropTypes from 'prop-types';
import { useLocale } from '../../../hooks/useLocale.js';

export default function ServiceHealthCard({ metric }) {
  const { format } = useLocale();

  let valueLabel;
  switch (metric.format) {
    case 'percent':
    case 'percentage':
      valueLabel = format.percentage(metric.value ?? 0, { maximumFractionDigits: 0 });
      break;
    case 'currency':
      valueLabel = format.currency(metric.value ?? 0);
      break;
    default:
      valueLabel = format.number(metric.value ?? 0);
  }

  return (
    <article className="provider-dashboard__card" data-qa={`provider-dashboard-service-metric-${metric.id}`}>
      <div className="space-y-3">
        <p className="provider-dashboard__card-label">{metric.label}</p>
        <p className="provider-dashboard__card-title text-2xl">{valueLabel}</p>
      </div>
      {metric.caption ? <p className="provider-dashboard__card-meta">{metric.caption}</p> : null}
      {metric.target != null ? (
        <p className="provider-dashboard__card-label text-[var(--provider-text-muted)]">
          Target • {format.number(metric.target)}
        </p>
      ) : null}
    </article>
  );
}

ServiceHealthCard.propTypes = {
  metric: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    caption: PropTypes.string,
    format: PropTypes.string,
    target: PropTypes.number
  }).isRequired
};
