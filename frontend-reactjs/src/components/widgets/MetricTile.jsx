import PropTypes from 'prop-types';
import clsx from 'clsx';
import StatusPill from '../ui/StatusPill.jsx';
import './widgets.css';

export default function MetricTile({
  label,
  value,
  delta,
  deltaTone,
  caption,
  status
}) {
  return (
    <article className="fx-metric-tile" data-testid="metric-tile">
      <p className="fx-metric-tile__label">{label}</p>
      <p className="fx-metric-tile__value">{value}</p>
      {delta ? (
        <p
          className={clsx('fx-metric-tile__delta', {
            'text-emerald-600': deltaTone === 'positive',
            'text-amber-600': deltaTone === 'warning',
            'text-rose-600': deltaTone === 'negative'
          })}
        >
          {delta}
        </p>
      ) : null}
      {caption ? <p className="text-sm text-slate-600">{caption}</p> : null}
      {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
    </article>
  );
}

MetricTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  delta: PropTypes.string,
  deltaTone: PropTypes.oneOf(['positive', 'negative', 'warning']),
  caption: PropTypes.string,
  status: PropTypes.shape({
    label: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['neutral', 'success', 'warning', 'danger', 'info'])
  })
};

MetricTile.defaultProps = {
  delta: undefined,
  deltaTone: 'positive',
  caption: undefined,
  status: undefined
};
