import PropTypes from 'prop-types';
import Card from '../../components/ui/Card.jsx';

function SummaryCard({ title, value, helper }) {
  return (
    <Card className="rounded-3xl border border-accent/10 bg-white/80 shadow-md">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-primary">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-600">{helper}</p> : null}
    </Card>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string
};

SummaryCard.defaultProps = {
  helper: null
};

export default function MarketplaceSummary({ summary, moderationCount, companyScope }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Tools catalogued"
        value={summary.tools?.count ?? 0}
        helper={`${summary.tools?.available ?? 0} available for deployment`}
      />
      <SummaryCard
        title="Materials tracked"
        value={summary.materials?.count ?? 0}
        helper={`${summary.materials?.available ?? 0} units ready`}
      />
      <SummaryCard
        title="Moderation queue"
        value={moderationCount}
        helper={moderationCount ? 'Listings require review' : 'No pending reviews'}
      />
      <SummaryCard
        title="Company scope"
        value={companyScope ? 'Filtered' : 'All tenants'}
        helper={companyScope || 'Viewing aggregated data'}
      />
    </div>
  );
}

MarketplaceSummary.propTypes = {
  summary: PropTypes.shape({
    tools: PropTypes.shape({
      count: PropTypes.number,
      available: PropTypes.number
    }),
    materials: PropTypes.shape({
      count: PropTypes.number,
      available: PropTypes.number
    })
  }).isRequired,
  moderationCount: PropTypes.number.isRequired,
  companyScope: PropTypes.string
};

MarketplaceSummary.defaultProps = {
  companyScope: ''
};
