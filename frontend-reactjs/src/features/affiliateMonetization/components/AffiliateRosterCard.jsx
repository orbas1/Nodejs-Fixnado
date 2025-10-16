import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Button, Card, SegmentedControl, Spinner, StatusPill, TextInput } from '../../../components/ui/index.js';

const STATUS_SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' }
];

const statusToneMap = {
  active: 'success',
  pending: 'info',
  suspended: 'warning'
};

function formatCurrency(amount, currency = 'USD') {
  const numeric = Number.parseFloat(amount ?? 0);
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  });
  return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
}

export default function AffiliateRosterCard({
  loading,
  profiles,
  meta,
  error,
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onPaginate,
  onRefresh,
  createForm,
  onCreateFormChange,
  onCreate,
  creating,
  creationError,
  onLocalProfileChange,
  onUpdateProfile,
  updatingIds,
  onOpenLedger
}) {
  const disabled = loading || creating;

  return (
    <Card padding="lg" className="space-y-6 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-primary">Affiliate roster</h3>
          <p className="text-sm text-slate-600">
            Manage partner status, tiers, and ledgers. Changes sync instantly across the affiliate portal and reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" icon={ArrowPathIcon} onClick={onRefresh} disabled={loading}>
            Refresh list
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <TextInput
            label="Search referral code"
            placeholder="AFFILIATE01"
            value={filters.search}
            onChange={(event) => onFilterChange('search', event.target.value)}
            icon={MagnifyingGlassIcon}
          />
          <SegmentedControl
            name="Affiliate status filter"
            value={filters.status}
            options={STATUS_SEGMENTS}
            onChange={(next) => onFilterChange('status', next)}
            size="sm"
          />
        </div>
        <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-end">
          <Button type="button" variant="ghost" size="sm" onClick={onResetFilters} icon={AdjustmentsHorizontalIcon}>
            Reset filters
          </Button>
          <Button type="button" size="sm" onClick={onApplyFilters} icon={UsersIcon}>
            Apply filters
          </Button>
        </div>
      </div>

      {error ? (
        <StatusPill tone="danger">{error}</StatusPill>
      ) : null}

      <section className="space-y-4">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,200px)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="User ID"
              placeholder="UUID of the platform user"
              value={createForm.userId}
              onChange={(event) => onCreateFormChange('userId', event.target.value)}
              required
            />
            <TextInput
              label="Referral code"
              placeholder="Optional custom code"
              value={createForm.referralCode}
              onChange={(event) => onCreateFormChange('referralCode', event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Tier label"
              placeholder="Starter"
              value={createForm.tierLabel}
              onChange={(event) => onCreateFormChange('tierLabel', event.target.value)}
            />
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={createForm.status}
                onChange={(event) => onCreateFormChange('status', event.target.value)}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            {creationError ? <StatusPill tone="danger">{creationError}</StatusPill> : null}
            <Button type="button" icon={PlusIcon} onClick={onCreate} loading={creating} disabled={disabled}>
              Add affiliate
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,140px)] bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <div>Affiliate</div>
            <div>Status &amp; tier</div>
            <div className="flex items-center gap-1">
              <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
              Commission
            </div>
            <div className="flex items-center gap-1">
              <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
              Referrals
            </div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-10">
                <Spinner size="sm">Loading affiliates…</Spinner>
              </div>
            ) : profiles.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">No affiliates found for the current filters.</div>
            ) : (
              profiles.map((profile) => {
                const isUpdating = updatingIds.has(profile.id);
                return (
                  <div
                    key={profile.id}
                    className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,140px)] items-center gap-4 px-4 py-4 text-sm text-slate-700"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-primary">{profile.referralCode}</p>
                      <p className="text-xs text-slate-500">{profile.user?.email ?? profile.userId}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <StatusPill tone={statusToneMap[profile.status] ?? 'info'}>{profile.status}</StatusPill>
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                          value={profile.status}
                          onChange={(event) => {
                            onLocalProfileChange(profile.id, { status: event.target.value });
                            onUpdateProfile(profile.id, { status: event.target.value });
                          }}
                          disabled={isUpdating}
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                      <TextInput
                        label="Tier"
                        value={profile.tierLabel ?? ''}
                        onChange={(event) => onLocalProfileChange(profile.id, { tierLabel: event.target.value })}
                        onBlur={(event) => onUpdateProfile(profile.id, { tierLabel: event.target.value })}
                        placeholder="Starter"
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p>Approved: {formatCurrency(profile.totalCommissionEarned)}</p>
                      <p>Pending: {formatCurrency(profile.pendingCommission)}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p>Total referred: {profile.totalReferred ?? 0}</p>
                      <p>Revenue: {formatCurrency(profile.lifetimeRevenue)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => onOpenLedger(profile)}>
                        View ledger
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing page {meta.page} of {Math.max(meta.pageCount, 1)} • {meta.total} affiliates
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => onPaginate(Math.max(1, meta.page - 1))}
              disabled={loading || meta.page <= 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => onPaginate(Math.min(meta.pageCount || meta.page, meta.page + 1))}
              disabled={loading || meta.page >= meta.pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </Card>
  );
}

AffiliateRosterCard.propTypes = {
  loading: PropTypes.bool,
  profiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      referralCode: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      tierLabel: PropTypes.string,
      totalCommissionEarned: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      pendingCommission: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      totalReferred: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      lifetimeRevenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      user: PropTypes.shape({
        id: PropTypes.string,
        email: PropTypes.string
      })
    })
  ),
  meta: PropTypes.shape({
    page: PropTypes.number,
    pageCount: PropTypes.number,
    total: PropTypes.number
  }).isRequired,
  error: PropTypes.string,
  filters: PropTypes.shape({
    status: PropTypes.string,
    search: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onApplyFilters: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  onPaginate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  createForm: PropTypes.shape({
    userId: PropTypes.string,
    referralCode: PropTypes.string,
    tierLabel: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  onCreateFormChange: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  creating: PropTypes.bool,
  creationError: PropTypes.string,
  onLocalProfileChange: PropTypes.func.isRequired,
  onUpdateProfile: PropTypes.func.isRequired,
  updatingIds: PropTypes.instanceOf(Set).isRequired,
  onOpenLedger: PropTypes.func.isRequired
};

AffiliateRosterCard.defaultProps = {
  loading: false,
  profiles: [],
  error: null,
  creating: false,
  creationError: null
};
