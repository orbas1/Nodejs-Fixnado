import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import Select from '../../../components/ui/Select.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import AudienceSegmentModal from './AudienceSegmentModal.jsx';

function toKey(value) {
  return value != null ? String(value) : '';
}

function normaliseForDiff(segments) {
  return segments.map((segment) => ({
    name: segment.name || '',
    segmentType: segment.segmentType || '',
    status: segment.status || '',
    sizeEstimate: segment.sizeEstimate ?? null,
    engagementRate: segment.engagementRate ?? null,
    syncedAt: segment.syncedAt || null,
    metadata: segment.metadata || {}
  }));
}

export default function AudienceSegmentsPanel({ campaigns, segments, onSaveSegments, busy }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => toKey(campaigns?.[0]?.id));
  const [draftSegments, setDraftSegments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (!campaigns.length) {
      setSelectedCampaignId('');
      setDraftSegments([]);
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

  const campaignSegments = useMemo(
    () =>
      segments
        .filter((segment) => toKey(segment.campaignId) === selectedCampaignId)
        .map((segment) => ({
          id: segment.id || null,
          name: segment.name,
          segmentType: segment.segmentType,
          status: segment.status,
          sizeEstimate: segment.sizeEstimate ?? null,
          engagementRate: segment.engagementRate ?? null,
          syncedAt: segment.syncedAt || null,
          metadata: segment.metadata || {}
        })),
    [segments, selectedCampaignId]
  );

  useEffect(() => {
    setDraftSegments(campaignSegments);
    setEditingIndex(null);
  }, [campaignSegments]);

  const draftSignature = useMemo(() => JSON.stringify(normaliseForDiff(draftSegments)), [draftSegments]);
  const originalSignature = useMemo(() => JSON.stringify(normaliseForDiff(campaignSegments)), [campaignSegments]);
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
    setDraftSegments((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSegmentSubmit = (payload) => {
    setDraftSegments((current) => {
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
    const payload = draftSegments.map((segment) => {
      const sanitised = { ...segment };
      delete sanitised.id;
      delete sanitised.campaignId;
      delete sanitised.campaignName;
      return sanitised;
    });
    await onSaveSegments(selectedCampaign.id, payload);
  };

  const handleReset = () => {
    setDraftSegments(campaignSegments);
    setEditingIndex(null);
  };

  const campaignOptions = campaigns.map((campaign) => ({ value: toKey(campaign.id), label: campaign.name }));

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Audience segments</h3>
          <p className="text-sm text-slate-600">Define the audiences that can see your Gigvora placements.</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Select
            label="Campaign"
            name="segments-campaign"
            value={selectedCampaignId}
            onChange={(event) => setSelectedCampaignId(event.target.value)}
            options={campaignOptions}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleOpenCreate} disabled={!selectedCampaign || busy}>
              Add segment
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
                Segment
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Size
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Engagement
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last synced
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {draftSegments.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-sm text-slate-500" colSpan={6}>
                  No audience segments configured. Add at least one to start targeting high-intent buyers.
                </td>
              </tr>
            ) : (
              draftSegments.map((segment, index) => {
                const syncedLabel = segment.syncedAt
                  ? new Date(segment.syncedAt).toLocaleString()
                  : 'Not synced';
                const engagementLabel =
                  segment.engagementRate != null ? `${(segment.engagementRate * 100).toFixed(1)}%` : '—';
                const sizeLabel = segment.sizeEstimate != null ? segment.sizeEstimate.toLocaleString() : '—';

                const tone =
                  segment.status === 'active' ? 'success' : segment.status === 'paused' ? 'warning' : 'info';

                return (
                  <tr key={segment.id || `segment-${index}`} className="hover:bg-secondary/60">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-primary">{segment.name}</span>
                        <span className="text-xs text-slate-500">{selectedCampaign?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{segment.segmentType}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{sizeLabel}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{engagementLabel}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{syncedLabel}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={tone}>{segment.status}</StatusPill>
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

      <AudienceSegmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingIndex(null);
        }}
        segment={editingIndex != null ? draftSegments[editingIndex] : null}
        onSubmit={handleSegmentSubmit}
      />
    </section>
  );
}

AudienceSegmentsPanel.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  segments: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSaveSegments: PropTypes.func.isRequired,
  busy: PropTypes.bool
};

AudienceSegmentsPanel.defaultProps = {
  busy: false
};
