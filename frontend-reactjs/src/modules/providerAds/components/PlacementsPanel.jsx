import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import Select from '../../../components/ui/Select.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import PlacementModal from './PlacementModal.jsx';

function toKey(value) {
  return value != null ? String(value) : '';
}

function normaliseForDiff(placements) {
  return placements.map((placement) => ({
    channel: placement.channel || '',
    format: placement.format || '',
    status: placement.status || '',
    flightId: placement.flightId ? String(placement.flightId) : '',
    bidAmount: placement.bidAmount ?? null,
    bidCurrency: placement.bidCurrency || '',
    cpm: placement.cpm ?? null,
    inventorySource: placement.inventorySource || '',
    metadata: placement.metadata || {}
  }));
}

export default function PlacementsPanel({ campaigns, placements, onSavePlacements, busy }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => toKey(campaigns?.[0]?.id));
  const [draftPlacements, setDraftPlacements] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (!campaigns.length) {
      setSelectedCampaignId('');
      setDraftPlacements([]);
      return;
    }

    const exists = campaigns.some((campaign) => toKey(campaign.id) === selectedCampaignId);
    if (!exists) {
      setSelectedCampaignId(toKey(campaigns[0].id));
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => toKey(campaign.id) === selectedCampaignId) || null,
    [campaigns, selectedCampaignId]
  );

  const campaignPlacements = useMemo(
    () =>
      placements
        .filter((placement) => toKey(placement.campaignId) === selectedCampaignId)
        .map((placement) => ({
          id: placement.id || null,
          channel: placement.channel,
          format: placement.format,
          status: placement.status,
          flightId: placement.flightId || '',
          flightName: placement.flightName || null,
          bidAmount: placement.bidAmount ?? null,
          bidCurrency: placement.bidCurrency || 'GBP',
          cpm: placement.cpm ?? null,
          inventorySource: placement.inventorySource || '',
          metadata: placement.metadata || {},
          updatedAt: placement.updatedAt || null
        })),
    [placements, selectedCampaignId]
  );

  useEffect(() => {
    setDraftPlacements(campaignPlacements);
    setEditingIndex(null);
  }, [campaignPlacements]);

  const draftSignature = useMemo(() => JSON.stringify(normaliseForDiff(draftPlacements)), [draftPlacements]);
  const originalSignature = useMemo(() => JSON.stringify(normaliseForDiff(campaignPlacements)), [campaignPlacements]);
  const isDirty = draftSignature !== originalSignature;

  const handleOpenCreate = () => {
    setEditingIndex(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (index) => {
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleRemove = (index) => {
    setDraftPlacements((current) => current.filter((_, idx) => idx !== index));
  };

  const handlePlacementSubmit = (payload) => {
    setDraftPlacements((current) => {
      if (editingIndex != null) {
        const next = [...current];
        const existing = next[editingIndex];
        next[editingIndex] = { ...existing, ...payload };
        return next;
      }
      return current.concat({ id: `temp-${Date.now()}`, ...payload });
    });
    setEditingIndex(null);
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!selectedCampaign) return;
    const payload = draftPlacements.map((placement) => {
      const sanitised = { ...placement };
      delete sanitised.id;
      delete sanitised.flightName;
      delete sanitised.updatedAt;
      delete sanitised.campaignId;
      delete sanitised.campaignName;
      return sanitised;
    });
    await onSavePlacements(selectedCampaign.id, payload);
  };

  const handleReset = () => {
    setDraftPlacements(campaignPlacements);
    setEditingIndex(null);
  };

  const campaignOptions = campaigns.map((campaign) => ({ value: toKey(campaign.id), label: campaign.name }));

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Placements</h3>
          <p className="text-sm text-slate-600">Configure where Gigvora distributes your creatives and how bids are managed.</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Select
            label="Campaign"
            name="placements-campaign"
            value={selectedCampaignId}
            onChange={(event) => setSelectedCampaignId(event.target.value)}
            options={campaignOptions}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleOpenCreate} disabled={!selectedCampaign || busy}>
              Add placement
            </Button>
            <Button size="sm" variant="secondary" onClick={handleSave} disabled={!isDirty || busy}>
              Save changes
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset} disabled={!isDirty || busy}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Channel
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Format
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bid
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                CPM
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Flight
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Updated
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {draftPlacements.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-sm text-slate-500" colSpan={7}>
                  No placements configured. Add placements to push creatives into high-performing surfaces.
                </td>
              </tr>
            ) : (
              draftPlacements.map((placement, index) => {
                const tone =
                  placement.status === 'active' ? 'success' : placement.status === 'paused' ? 'warning' : 'info';
                const bidLabel = placement.bidAmount != null
                  ? `${placement.bidCurrency || 'GBP'} ${placement.bidAmount.toFixed(2)}`
                  : '—';
                const cpmLabel = placement.cpm != null ? `${placement.bidCurrency || 'GBP'} ${placement.cpm.toFixed(2)}` : '—';
                const updatedLabel = placement.updatedAt
                  ? new Date(placement.updatedAt).toLocaleString()
                  : 'Not synced';

                return (
                  <tr key={placement.id || `placement-${index}`} className="hover:bg-secondary/60">
                    <td className="px-4 py-3 text-sm text-slate-700">{placement.channel}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{placement.format}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{bidLabel}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{cpmLabel}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {placement.flightName || (placement.flightId ? `Flight ${placement.flightId}` : 'Campaign level')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{updatedLabel}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={tone}>{placement.status}</StatusPill>
                        <Button size="xs" variant="ghost" onClick={() => handleOpenEdit(index)} disabled={busy}>
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          tone="danger"
                          onClick={() => handleRemove(index)}
                          disabled={busy}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PlacementModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingIndex(null);
        }}
        placement={editingIndex != null ? draftPlacements[editingIndex] : null}
        campaign={selectedCampaign}
        onSubmit={handlePlacementSubmit}
      />
    </section>
  );
}

PlacementsPanel.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      flights: PropTypes.array
    })
  ).isRequired,
  placements: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSavePlacements: PropTypes.func.isRequired,
  busy: PropTypes.bool
};

PlacementsPanel.defaultProps = {
  busy: false
};
