import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useFixnadoAds } from './FixnadoAdsProvider.jsx';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Button } from '../../components/ui/index.js';
import SummaryPanel from './components/SummaryPanel.jsx';
import CampaignListPanel from './components/CampaignListPanel.jsx';
import CampaignDetailPanel from './components/CampaignDetailPanel.jsx';
import FeedbackBanner from './components/FeedbackBanner.jsx';

function countActiveCampaigns(campaigns) {
  return campaigns.filter((campaign) => campaign.status === 'active').length;
}

export default function FixnadoAdsWorkspace({ section }) {
  const initialSummary = section?.data?.summary ?? null;
  const initialNetwork = section?.data?.network ?? 'fixnado';
  const {
    data: {
      campaigns,
      campaignsMeta,
      campaignsLoading,
      campaignsError,
      filters,
      activeCampaignId,
      activeCampaign,
      campaignForm,
      creationDraft,
      isCreating,
      campaignDetailLoading,
      campaignDetailError,
      summary,
      fraudSignals,
      flights,
      metrics,
      creatives,
      targetingDraft,
      saving,
      feedback
    },
    actions: {
      refreshCampaigns,
      handleSearchChange,
      handleStatusChange,
      selectCampaign,
      startCreateCampaign,
      cancelCreateCampaign,
      updateCreationDraft,
      updateCampaignField,
      createCampaign,
      updateCampaign,
      addFlight,
      addTargetingRule,
      updateTargetingRule,
      removeTargetingRule,
      saveTargeting,
      recordMetric,
      resolveFraudSignal,
      addCreative,
      updateCreative,
      removeCreative,
      reloadCampaign,
      clearFeedback
    }
  } = useFixnadoAds();

  const headerMeta = useMemo(() => {
    const totalCampaigns = campaignsMeta?.count ?? campaigns.length;
    const activeCount = countActiveCampaigns(campaigns);
    return [
      { label: 'Campaigns tracked', value: String(totalCampaigns || 0) },
      { label: 'Active placements', value: String(activeCount || 0) },
      {
        label: 'Network window',
        value: initialSummary?.window ?? '30-day snapshot',
        caption: initialNetwork
      }
    ];
  }, [campaigns, campaignsMeta?.count, initialNetwork, initialSummary?.window]);

  const creativeTotal = summary?.creatives ?? creatives.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="fixnado-ads-workspace">
      <PageHeader
        eyebrow="Serviceman control centre"
        title="Fixnado Ads manager"
        description="Launch rapid response placements, monitor pacing, and respond to network fraud alerts in one workspace."
        breadcrumbs={[
          { label: 'Serviceman cockpit', to: '/dashboards/serviceman' },
          { label: 'Fixnado Ads manager' }
        ]}
        actions={[
          {
            label: 'Create campaign',
            variant: 'primary',
            onClick: startCreateCampaign
          },
          {
            label: 'Refresh data',
            variant: 'secondary',
            onClick: () => {
              refreshCampaigns();
              if (activeCampaignId) {
                reloadCampaign();
              }
            }
          }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl space-y-10 px-6 pt-12">
        {feedback ? <FeedbackBanner feedback={feedback} onDismiss={clearFeedback} /> : null}

        <SummaryPanel
          summary={initialSummary}
          campaignCount={campaignsMeta?.count ?? campaigns.length}
          activeCampaigns={countActiveCampaigns(campaigns)}
          creativeCount={creativeTotal}
          onRefresh={() => {
            refreshCampaigns();
            if (activeCampaignId) {
              reloadCampaign();
            }
          }}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <CampaignListPanel
            campaigns={campaigns}
            meta={campaignsMeta}
            filters={filters}
            loading={campaignsLoading}
            error={campaignsError}
            activeCampaignId={activeCampaignId}
            isCreating={isCreating}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onSelectCampaign={selectCampaign}
            onCreateCampaign={startCreateCampaign}
            onRefresh={refreshCampaigns}
          />
          <CampaignDetailPanel
            campaign={activeCampaign}
            campaignForm={campaignForm}
            creationDraft={creationDraft}
            summary={summary}
            flights={flights}
            metrics={metrics}
            fraudSignals={fraudSignals}
            creatives={creatives}
            targetingRules={targetingDraft}
            saving={saving}
            isLoading={campaignDetailLoading}
            error={campaignDetailError}
            isCreating={isCreating}
            onUpdateCampaignField={updateCampaignField}
            onUpdateCampaign={updateCampaign}
            onUpdateCreationDraft={updateCreationDraft}
            onCreateCampaign={createCampaign}
            onCancelCreateCampaign={cancelCreateCampaign}
            onAddFlight={addFlight}
            onAddTargetingRule={addTargetingRule}
            onUpdateTargetingRule={updateTargetingRule}
            onRemoveTargetingRule={removeTargetingRule}
            onSaveTargeting={saveTargeting}
            onRecordMetric={recordMetric}
            onResolveFraudSignal={resolveFraudSignal}
            onAddCreative={addCreative}
            onUpdateCreative={updateCreative}
            onRemoveCreative={removeCreative}
            onReloadCampaign={reloadCampaign}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Need the legacy ads dashboard?</p>
          <p className="mt-2">
            Open the standalone Fixnado marketing studio for deeper analytics, bulk creative uploads, and exportable pacing
            reports without leaving the Serviceman cockpit.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button to="/dashboards/analytics/fixnado" variant="secondary">
              Open analytics workspace
            </Button>
            <Button to="/campaigns/fixnado" variant="ghost" target="_blank" rel="noreferrer">
              Launch Fixnado studio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

FixnadoAdsWorkspace.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      summary: PropTypes.object,
      network: PropTypes.string
    })
  })
};

FixnadoAdsWorkspace.defaultProps = {
  section: null
};
