import PropTypes from 'prop-types';

const SummaryCard = ({ title, value, helper }) => (
  <div className="rounded-2xl border border-accent/10 bg-white/70 p-4 shadow-sm">
    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</p>
    <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
    {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
  </div>
);

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string
};

const AuditTimelineSummary = ({
  manualEventCount,
  systemEventCount,
  timeframeLabel,
  rangeDisplay,
  lastUpdatedDisplay,
  timezoneDisplay
}) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <SummaryCard
      title="Manual entries"
      value={manualEventCount}
      helper="Editable checkpoints created by administrators."
    />
    <SummaryCard
      title="System updates"
      value={systemEventCount}
      helper="Sourced from live pipelines and compliance engines."
    />
    <SummaryCard title="Timeframe" value={timeframeLabel} helper={rangeDisplay} />
    <SummaryCard title="Last updated" value={lastUpdatedDisplay} helper={`Timezone: ${timezoneDisplay}`} />
  </div>
);

AuditTimelineSummary.propTypes = {
  manualEventCount: PropTypes.number.isRequired,
  systemEventCount: PropTypes.number.isRequired,
  timeframeLabel: PropTypes.string.isRequired,
  rangeDisplay: PropTypes.string.isRequired,
  lastUpdatedDisplay: PropTypes.string.isRequired,
  timezoneDisplay: PropTypes.string.isRequired
};

export default AuditTimelineSummary;
