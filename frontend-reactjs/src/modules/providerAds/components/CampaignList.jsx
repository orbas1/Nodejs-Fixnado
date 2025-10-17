import PropTypes from 'prop-types';
import { useMemo } from 'react';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

const currencyFormatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

function CampaignRow({ campaign, onEdit, onAddFlight, onManageTargeting, onRecordMetrics, onAddCreative, disabled }) {
  const spend = campaign.spend != null ? currencyFormatter.format(campaign.spend) : '—';
  const revenue = campaign.revenue != null ? currencyFormatter.format(campaign.revenue) : '—';
  const roas = campaign.roas != null ? `${campaign.roas.toFixed(2)}x` : '—';
  const flights = (campaign.flights || []).length;
  const creatives = (campaign.creatives || []).length;

  return (
    <tr className="border-b border-slate-100 hover:bg-secondary/70" data-qa={`provider-ads-campaign-${campaign.id}`}>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-primary">{campaign.name}</span>
          <span className="text-xs text-slate-500">{campaign.objective}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        <StatusPill tone={campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : 'info'}>
          {campaign.status}
        </StatusPill>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{spend}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{revenue}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{roas}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{flights}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{creatives}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button size="xs" variant="ghost" onClick={() => onEdit(campaign)} disabled={disabled}>
            Edit
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onAddFlight(campaign)} disabled={disabled}>
            Add flight
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onManageTargeting(campaign)} disabled={disabled}>
            Targeting
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onAddCreative(campaign)} disabled={disabled}>
            Creative
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onRecordMetrics(campaign)} disabled={disabled}>
            Log metrics
          </Button>
        </div>
      </td>
    </tr>
  );
}

CampaignRow.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    objective: PropTypes.string,
    status: PropTypes.string,
    spend: PropTypes.number,
    revenue: PropTypes.number,
    roas: PropTypes.number,
    flights: PropTypes.array,
    creatives: PropTypes.array
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onAddFlight: PropTypes.func.isRequired,
  onManageTargeting: PropTypes.func.isRequired,
  onRecordMetrics: PropTypes.func.isRequired,
  onAddCreative: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

CampaignRow.defaultProps = {
  disabled: false
};

export default function CampaignList({
  campaigns,
  onEditCampaign,
  onAddFlight,
  onManageTargeting,
  onRecordMetrics,
  onAddCreative,
  busy
}) {
  const sortedCampaigns = useMemo(
    () => [...campaigns].sort((a, b) => (b.spend || 0) - (a.spend || 0)),
    [campaigns]
  );

  if (!sortedCampaigns.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
        <p className="text-sm text-slate-600">
          No Gigvora campaigns yet. Launch your first promotion to populate performance data.
        </p>
        <Button className="mt-4" onClick={() => onEditCampaign(null)} disabled={busy}>
          Create campaign
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Campaign
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Spend
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Revenue
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              ROAS
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Flights
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Creatives
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedCampaigns.map((campaign) => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              onEdit={onEditCampaign}
              onAddFlight={onAddFlight}
              onManageTargeting={onManageTargeting}
              onRecordMetrics={onRecordMetrics}
              onAddCreative={onAddCreative}
              disabled={busy}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(CampaignRow.propTypes.campaign).isRequired,
  onEditCampaign: PropTypes.func.isRequired,
  onAddFlight: PropTypes.func.isRequired,
  onManageTargeting: PropTypes.func.isRequired,
  onRecordMetrics: PropTypes.func.isRequired,
  onAddCreative: PropTypes.func.isRequired,
  busy: PropTypes.bool
};

CampaignList.defaultProps = {
  busy: false
};
