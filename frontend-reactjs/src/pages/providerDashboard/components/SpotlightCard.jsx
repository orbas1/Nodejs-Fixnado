import PropTypes from 'prop-types';
import StatusPill from '../../../components/ui/StatusPill.jsx';

export default function SpotlightCard({ icon: Icon, eyebrow, title, meta, description, tone, toneLabel }) {
  return (
    <article className="provider-dashboard__card">
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--provider-border)] bg-[var(--provider-accent-soft)] text-[var(--provider-accent)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="provider-dashboard__card-label">{eyebrow}</p>
          <h3 className="provider-dashboard__card-title text-xl">{title}</h3>
        </div>
      </header>
      {meta ? (
        <p className="provider-dashboard__card-meta font-medium" data-qa="provider-dashboard-spotlight-meta">
          {meta}
        </p>
      ) : null}
      {description ? <p className="provider-dashboard__card-meta">{description}</p> : null}
      {tone ? (
        <div>
          <StatusPill tone={tone}>{toneLabel}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

SpotlightCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  meta: PropTypes.string,
  description: PropTypes.string,
  tone: PropTypes.string,
  toneLabel: PropTypes.string
};

SpotlightCard.defaultProps = {
  meta: null,
  description: null,
  tone: undefined,
  toneLabel: null
};
