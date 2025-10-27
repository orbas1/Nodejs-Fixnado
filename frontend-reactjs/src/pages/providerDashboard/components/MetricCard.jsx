import PropTypes from 'prop-types';
import StatusPill from '../../../components/ui/StatusPill.jsx';

export default function MetricCard({ icon: Icon, label, value, caption, tone, toneLabel, 'data-qa': dataQa }) {
  return (
    <article
      className="provider-dashboard__card"
      data-qa={dataQa}
    >
      <header className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--provider-border)] bg-[var(--provider-accent-soft)] text-[var(--provider-accent)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="provider-dashboard__card-label">{label}</p>
          <p className="provider-dashboard__card-title text-2xl">{value}</p>
        </div>
      </header>
      {caption ? (
        <p className="provider-dashboard__card-meta" data-qa={`${dataQa}-caption`}>
          {caption}
        </p>
      ) : null}
      {tone ? (
        <div>
          <StatusPill tone={tone}>{toneLabel}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

MetricCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
  caption: PropTypes.node,
  tone: PropTypes.string,
  toneLabel: PropTypes.string,
  'data-qa': PropTypes.string
};

MetricCard.defaultProps = {
  caption: null,
  tone: undefined,
  toneLabel: undefined,
  'data-qa': undefined
};
