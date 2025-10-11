import PropTypes from 'prop-types';
import Card from '../ui/Card.jsx';
import StatusPill from '../ui/StatusPill.jsx';

export default function TelemetrySummaryCard({ label, value, caption, delta, deltaTone, status, qa }) {
  return (
    <Card
      padding="lg"
      className="border border-slate-100 bg-white/90 shadow-sm shadow-primary/5"
      data-qa={qa}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-primary md:text-4xl">{value}</p>
      {delta ? (
        <p
          className={`mt-2 text-sm font-semibold ${
            deltaTone === 'negative'
              ? 'text-rose-600'
              : deltaTone === 'warning'
              ? 'text-amber-600'
              : 'text-emerald-600'
          }`}
        >
          {delta}
        </p>
      ) : null}
      {caption ? <p className="mt-3 text-sm text-slate-600">{caption}</p> : null}
      {status ? (
        <div className="mt-4">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </div>
      ) : null}
    </Card>
  );
}

TelemetrySummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  caption: PropTypes.node,
  delta: PropTypes.string,
  deltaTone: PropTypes.oneOf(['positive', 'negative', 'warning']),
  status: PropTypes.shape({
    label: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['neutral', 'success', 'warning', 'danger', 'info'])
  }),
  qa: PropTypes.string
};

TelemetrySummaryCard.defaultProps = {
  caption: undefined,
  delta: undefined,
  deltaTone: 'positive',
  status: undefined,
  qa: undefined
};
