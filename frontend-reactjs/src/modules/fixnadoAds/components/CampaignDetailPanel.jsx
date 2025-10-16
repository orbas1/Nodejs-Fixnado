import PropTypes from 'prop-types';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button, Card, Spinner } from '../../../components/ui/index.js';
import CampaignForm from './CampaignForm.jsx';
import CampaignCreationPanel from './CampaignCreationPanel.jsx';
import CampaignPerformanceSummary from './CampaignPerformanceSummary.jsx';
import FlightsPanel from './FlightsPanel.jsx';
import TargetingPanel from './TargetingPanel.jsx';
import MetricsPanel from './MetricsPanel.jsx';
import FraudSignalsPanel from './FraudSignalsPanel.jsx';
import CreativesPanel from './CreativesPanel.jsx';

export default function CampaignDetailPanel({
  campaign,
  campaignForm,
  creationDraft,
  summary,
  flights,
  metrics,
  fraudSignals,
  creatives,
  targetingRules,
  saving,
  isLoading,
  error,
  isCreating,
  onUpdateCampaignField,
  onUpdateCampaign,
  onUpdateCreationDraft,
  onCreateCampaign,
  onCancelCreateCampaign,
  onAddFlight,
  onAddTargetingRule,
  onUpdateTargetingRule,
  onRemoveTargetingRule,
  onSaveTargeting,
  onRecordMetric,
  onResolveFraudSignal,
  onAddCreative,
  onUpdateCreative,
  onRemoveCreative,
  onReloadCampaign
}) {
  const currency = campaignForm?.currency ?? campaign?.currency ?? 'GBP';

  if (isCreating) {
    return (
      <CampaignCreationPanel
        draft={creationDraft}
        saving={saving.campaign}
        onChange={onUpdateCreationDraft}
        onSubmit={onCreateCampaign}
        onCancel={onCancelCreateCampaign}
      />
    );
  }

  if (!campaign && isLoading) {
    return (
      <Card padding="lg" className="flex h-full min-h-[420px] items-center justify-center border border-slate-200 bg-white/70">
        <Spinner />
      </Card>
    );
  }

  if (!campaign) {
    return (
      <Card padding="lg" className="border border-slate-200 bg-white/70 text-sm text-slate-600">
        <p className="font-semibold text-primary">Select a campaign to view details.</p>
        <p className="mt-2">
          Pick a Fixnado campaign from the list or create a new one. Once selected, detailed pacing, targeting, and
          creative controls will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      ) : null}

      <Card padding="lg" className="border border-slate-200 bg-white/80 shadow-sm">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Campaign overview</p>
            <h2 className="text-2xl font-semibold text-primary">{campaign.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{campaign.objective}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowPathIcon}
              onClick={onReloadCampaign}
              disabled={isLoading}
            >
              Reload
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowTopRightOnSquareIcon}
              to={`/fixnado/campaigns/${campaign.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Open full view
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <Spinner size="1rem" /> Syncing latest data…
          </div>
        ) : null}

        <CampaignForm
          form={campaignForm}
          onChange={onUpdateCampaignField}
          onSubmit={onUpdateCampaign}
          saving={saving.campaign}
        />
      </Card>

      <CampaignPerformanceSummary summary={summary} currency={currency} />
      <FlightsPanel flights={flights} currency={currency} onAddFlight={onAddFlight} saving={saving.flight} />
      <TargetingPanel
        targetingRules={targetingRules}
        onAddRule={onAddTargetingRule}
        onUpdateRule={onUpdateTargetingRule}
        onRemoveRule={onRemoveTargetingRule}
        onSave={onSaveTargeting}
        saving={saving.targeting}
      />
      <MetricsPanel metrics={metrics} flights={flights} currency={currency} onRecordMetric={onRecordMetric} saving={saving.metric} />
      <FraudSignalsPanel signals={fraudSignals} onResolveSignal={onResolveFraudSignal} saving={saving.resolveSignal} />
      <CreativesPanel
        creatives={creatives}
        onAddCreative={onAddCreative}
        onUpdateCreative={onUpdateCreative}
        onRemoveCreative={onRemoveCreative}
        saving={saving.creative}
      />
    </div>
  );
}

CampaignDetailPanel.propTypes = {
  campaign: PropTypes.object,
  campaignForm: PropTypes.object,
  creationDraft: PropTypes.object,
  summary: PropTypes.object,
  flights: PropTypes.array,
  metrics: PropTypes.array,
  fraudSignals: PropTypes.array,
  creatives: PropTypes.array,
  targetingRules: PropTypes.array,
  saving: PropTypes.shape({
    campaign: PropTypes.bool,
    flight: PropTypes.bool,
    targeting: PropTypes.bool,
    metric: PropTypes.bool,
    creative: PropTypes.bool,
    resolveSignal: PropTypes.bool
  }).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  isCreating: PropTypes.bool,
  onUpdateCampaignField: PropTypes.func.isRequired,
  onUpdateCampaign: PropTypes.func.isRequired,
  onUpdateCreationDraft: PropTypes.func.isRequired,
  onCreateCampaign: PropTypes.func.isRequired,
  onCancelCreateCampaign: PropTypes.func.isRequired,
  onAddFlight: PropTypes.func.isRequired,
  onAddTargetingRule: PropTypes.func.isRequired,
  onUpdateTargetingRule: PropTypes.func.isRequired,
  onRemoveTargetingRule: PropTypes.func.isRequired,
  onSaveTargeting: PropTypes.func.isRequired,
  onRecordMetric: PropTypes.func.isRequired,
  onResolveFraudSignal: PropTypes.func.isRequired,
  onAddCreative: PropTypes.func.isRequired,
  onUpdateCreative: PropTypes.func.isRequired,
  onRemoveCreative: PropTypes.func.isRequired,
  onReloadCampaign: PropTypes.func.isRequired
};

CampaignDetailPanel.defaultProps = {
  campaign: null,
  campaignForm: null,
  creationDraft: null,
  summary: null,
  flights: [],
  metrics: [],
  fraudSignals: [],
  creatives: [],
  targetingRules: [],
  isLoading: false,
  error: null,
  isCreating: false
};
