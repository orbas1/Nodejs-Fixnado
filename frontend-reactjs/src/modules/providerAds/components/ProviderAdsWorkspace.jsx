import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../../components/ui/Spinner.jsx';
import AdsOverview from './AdsOverview.jsx';
import CampaignList from './CampaignList.jsx';
import CreativeLibrary from './CreativeLibrary.jsx';
import AudienceSegmentsPanel from './AudienceSegmentsPanel.jsx';
import PlacementsPanel from './PlacementsPanel.jsx';
import InvoicesPanel from './InvoicesPanel.jsx';
import FraudSignalsPanel from './FraudSignalsPanel.jsx';
import CampaignEditorModal from './CampaignEditorModal.jsx';
import CreativeEditorModal from './CreativeEditorModal.jsx';
import FlightEditorModal from './FlightEditorModal.jsx';
import MetricsRecorderModal from './MetricsRecorderModal.jsx';
import TargetingRulesModal from './TargetingRulesModal.jsx';
import useProviderAdsWorkspace from '../hooks/useProviderAdsWorkspace.js';

export default function ProviderAdsWorkspace({ companyId, initialData }) {
  const { data, loading, error, mutating, actions } = useProviderAdsWorkspace({ companyId, initialData });
  const workspace = data || initialData || {};

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [flightState, setFlightState] = useState({ open: false, campaign: null });
  const [targetingState, setTargetingState] = useState({ open: false, campaign: null });
  const [metricsState, setMetricsState] = useState({ open: false, campaign: null });
  const [creativeState, setCreativeState] = useState({ open: false, campaign: null, creative: null });

  const campaigns = workspace.campaigns || [];
  const creatives = workspace.creatives || [];
  const audienceSegments = workspace.audienceSegments || [];
  const placements = workspace.placements || [];
  const invoices = workspace.invoices || [];
  const fraudSignals = workspace.fraudSignals || [];
  const overview = workspace.overview || null;

  const busiest = mutating || loading;

  const companyLabel = workspace.company?.name || 'Gigvora provider';
  const totalCampaigns = campaigns.length;

  const headline = useMemo(() => {
    if (!totalCampaigns) {
      return `Launch your first Gigvora campaign for ${companyLabel}`;
    }
    return `${totalCampaigns} Gigvora campaign${totalCampaigns === 1 ? '' : 's'} in flight`;
  }, [companyLabel, totalCampaigns]);

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignModalOpen(true);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignModalOpen(true);
  };

  const handleSubmitCampaign = async (payload) => {
    if (editingCampaign) {
      await actions.updateCampaign(editingCampaign.id, payload);
    } else {
      await actions.createCampaign(payload);
    }
  };

  const handleAddFlight = (campaign) => {
    setFlightState({ open: true, campaign });
  };

  const handleAddCreative = (campaign, creative = null) => {
    setCreativeState({ open: true, campaign, creative });
  };

  const handleManageTargeting = (campaign) => {
    setTargetingState({ open: true, campaign });
  };

  const handleRecordMetrics = (campaign) => {
    setMetricsState({ open: true, campaign });
  };

  const handleSubmitCreative = async (payload) => {
    if (!creativeState.campaign) {
      return;
    }
    if (creativeState.creative) {
      await actions.updateCreative(creativeState.campaign.id, creativeState.creative.id, payload);
    } else {
      await actions.createCreative(creativeState.campaign.id, payload);
    }
  };

  return (
    <div className="space-y-10" data-qa="provider-ads-workspace">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-primary">Gigvora ads workspace</h2>
        <p className="mt-1 text-sm text-slate-600">{headline}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5" role="alert">
          <p className="text-sm font-semibold text-rose-600">Unable to load campaign workspace.</p>
          <p className="mt-1 text-xs text-rose-500">{error.message}</p>
        </div>
      ) : null}

      {overview ? (
        <AdsOverview
          overview={overview}
          onCreateCampaign={handleCreateCampaign}
          onRefresh={actions.refresh}
          mutating={busiest}
        />
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-primary">Campaigns</h3>
          <p className="text-xs text-slate-500">Manage pacing, flights, targeting, and creative operations.</p>
        </div>
        <CampaignList
          campaigns={campaigns}
          onEditCampaign={handleEditCampaign}
          onAddFlight={handleAddFlight}
          onManageTargeting={handleManageTargeting}
          onRecordMetrics={handleRecordMetrics}
          onAddCreative={(campaign) => handleAddCreative(campaign, null)}
          busy={busiest}
        />
      </section>

      <CreativeLibrary
        campaigns={campaigns}
        creatives={creatives}
        onCreateCreative={(campaign) => handleAddCreative(campaign, null)}
        onEditCreative={(creative) => {
          const campaign = campaigns.find((item) => item.id === creative.campaignId) || null;
          handleAddCreative(campaign, creative);
        }}
        onDeleteCreative={(campaignId, creativeId) =>
          campaignId ? actions.deleteCreative(campaignId, creativeId) : Promise.resolve()
        }
        busy={busiest}
      />

      <AudienceSegmentsPanel
        campaigns={campaigns}
        segments={audienceSegments}
        onSaveSegments={(campaignId, segmentsPayload) => actions.saveAudienceSegments(campaignId, segmentsPayload)}
        busy={busiest}
      />

      <PlacementsPanel
        campaigns={campaigns}
        placements={placements}
        onSavePlacements={(campaignId, placementPayload) => actions.savePlacements(campaignId, placementPayload)}
        busy={busiest}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InvoicesPanel invoices={invoices} />
        <FraudSignalsPanel signals={fraudSignals} />
      </div>

      <CampaignEditorModal
        open={campaignModalOpen}
        onClose={() => {
          setCampaignModalOpen(false);
          setEditingCampaign(null);
        }}
        campaign={editingCampaign}
        onSubmit={handleSubmitCampaign}
      />

      <FlightEditorModal
        open={flightState.open}
        onClose={() => setFlightState({ open: false, campaign: null })}
        campaign={flightState.campaign}
        onSubmit={(payload) =>
          flightState.campaign ? actions.createFlight(flightState.campaign.id, payload) : Promise.resolve()
        }
      />

      <TargetingRulesModal
        open={targetingState.open}
        onClose={() => setTargetingState({ open: false, campaign: null })}
        campaign={targetingState.campaign}
        onSubmit={(rules) =>
          targetingState.campaign ? actions.saveTargeting(targetingState.campaign.id, rules) : Promise.resolve()
        }
      />

      <MetricsRecorderModal
        open={metricsState.open}
        onClose={() => setMetricsState({ open: false, campaign: null })}
        campaign={metricsState.campaign}
        onSubmit={(payload) =>
          metricsState.campaign ? actions.recordMetrics(metricsState.campaign.id, payload) : Promise.resolve()
        }
      />

      <CreativeEditorModal
        open={creativeState.open}
        onClose={() => setCreativeState({ open: false, campaign: null, creative: null })}
        campaign={creativeState.campaign}
        creative={creativeState.creative}
        onSubmit={handleSubmitCreative}
      />
    </div>
  );
}

ProviderAdsWorkspace.propTypes = {
  companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.object
};

ProviderAdsWorkspace.defaultProps = {
  companyId: null,
  initialData: null
};
