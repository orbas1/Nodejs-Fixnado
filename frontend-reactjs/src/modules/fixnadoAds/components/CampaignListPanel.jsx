import PropTypes from 'prop-types';
import { ArrowPathIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button, Card, Select, Spinner, StatusPill, TextInput } from '../../../components/ui/index.js';
import { CAMPAIGN_STATUS_OPTIONS } from '../constants.js';
import { formatDate, formatNumber, formatStatus } from '../utils/formatters.js';

function statusTone(status) {
  switch (status) {
    case 'active':
      return 'success';
    case 'paused':
    case 'scheduled':
      return 'warning';
    case 'cancelled':
      return 'danger';
    case 'completed':
      return 'info';
    default:
      return 'neutral';
  }
}

export default function CampaignListPanel({
  campaigns,
  meta,
  filters,
  loading,
  error,
  activeCampaignId,
  isCreating,
  onSearchChange,
  onStatusChange,
  onSelectCampaign,
  onCreateCampaign,
  onRefresh
}) {
  return (
    <Card padding="lg" className="h-full border border-slate-200 bg-white/70 shadow-sm">
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Campaigns</p>
            <h3 className="text-xl font-semibold text-primary">Fixnado placements</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" icon={ArrowPathIcon} onClick={onRefresh} disabled={loading}>
              Refresh
            </Button>
            <Button variant="secondary" size="sm" icon={PlusIcon} onClick={onCreateCampaign}>
              New campaign
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {meta?.count ? `${formatNumber(meta.count)} campaigns available.` : 'No campaigns captured yet.'}
        </p>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,200px)]">
          <TextInput
            label="Search"
            value={filters.search}
            onChange={onSearchChange}
            placeholder="Search by name or objective"
            prefix={<MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />}
          />
          <Select label="Status" value={filters.status} onChange={onStatusChange} options={CAMPAIGN_STATUS_OPTIONS} />
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
            <Spinner />
          </div>
        ) : campaigns.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No campaigns match the filters. Create a new Fixnado campaign to begin.
          </p>
        ) : (
          campaigns.map((campaign) => {
            const tone = statusTone(campaign.status);
            const isActive = campaign.id === activeCampaignId;
            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => onSelectCampaign(campaign.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-primary/5'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-primary">{campaign.name}</p>
                    <p className="text-sm text-slate-600">{campaign.objective}</p>
                  </div>
                  <StatusPill tone={tone}>{formatStatus(campaign.status)}</StatusPill>
                </div>
                <dl className="mt-3 grid gap-3 text-xs uppercase tracking-[0.3em] text-slate-500 sm:grid-cols-3">
                  <div>
                    <dt>Type</dt>
                    <dd className="text-sm normal-case text-slate-600">{formatStatus(campaign.campaignType)}</dd>
                  </div>
                  <div>
                    <dt>Timeline</dt>
                    <dd className="text-sm normal-case text-slate-600">
                      {campaign.startAt ? formatDate(campaign.startAt) : 'Unscheduled'} –
                      {campaign.endAt ? ` ${formatDate(campaign.endAt)}` : ' ongoing'}
                    </dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd className="text-sm normal-case text-slate-600">£{campaign.totalBudget ?? '0'}</dd>
                  </div>
                </dl>
              </button>
            );
          })
        )}
      </div>

      {isCreating ? (
        <p className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
          Creating a new campaign – fill in the form on the right to continue.
        </p>
      ) : null}
    </Card>
  );
}

CampaignListPanel.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      objective: PropTypes.string,
      campaignType: PropTypes.string,
      status: PropTypes.string,
      startAt: PropTypes.string,
      endAt: PropTypes.string,
      totalBudget: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ),
  meta: PropTypes.shape({
    count: PropTypes.number
  }),
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  activeCampaignId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isCreating: PropTypes.bool,
  onSearchChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onSelectCampaign: PropTypes.func.isRequired,
  onCreateCampaign: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

CampaignListPanel.defaultProps = {
  campaigns: [],
  meta: null,
  loading: false,
  error: null,
  activeCampaignId: null,
  isCreating: false
};
