import PropTypes from 'prop-types';

const statusToneMap = {
  active: 'success',
  onboarding: 'info',
  prospect: 'info',
  suspended: 'warning',
  archived: 'danger'
};

export function resolveStatusTone(status) {
  if (!status) return 'neutral';
  return statusToneMap[status] ?? 'neutral';
}

function SummaryCard({ title, value, helper }) {
  return (
    <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string
};

SummaryCard.defaultProps = {
  helper: undefined
};

function ProviderSummaryGrid({ summary }) {
  if (!summary) {
    return null;
  }

  const activeProviders = summary.statusBreakdown?.find((item) => item.value === 'active')?.count ?? 0;
  const onboarding = summary.onboardingBreakdown?.reduce(
    (acc, item) => (item.value === 'intake' || item.value === 'documents' || item.value === 'compliance' ? acc + item.count : acc),
    0
  );
  const approvedInsured = summary.insuredBreakdown?.find((item) => item.value === 'approved')?.count ?? 0;
  const complianceLabel = summary.averageComplianceScore ? `${summary.averageComplianceScore.toFixed(1)} score` : 'No data';

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard title="Active providers" value={activeProviders.toLocaleString()} helper="Live and accepting jobs" />
      <SummaryCard
        title="In onboarding"
        value={onboarding.toLocaleString()}
        helper="Providers moving through intake"
      />
      <SummaryCard title="Insured & approved" value={approvedInsured.toLocaleString()} helper="Badge visible" />
      <SummaryCard title="Avg. compliance" value={complianceLabel} helper="Weighted by risk tier" />
    </div>
  );
}

ProviderSummaryGrid.propTypes = {
  summary: PropTypes.shape({
    averageComplianceScore: PropTypes.number,
    statusBreakdown: PropTypes.array,
    onboardingBreakdown: PropTypes.array,
    insuredBreakdown: PropTypes.array
  })
};

ProviderSummaryGrid.defaultProps = {
  summary: null
};

export default ProviderSummaryGrid;
