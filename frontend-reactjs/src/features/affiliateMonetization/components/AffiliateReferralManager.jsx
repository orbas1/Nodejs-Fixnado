import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Button, Card, SegmentedControl, Spinner, StatusPill, TextInput, Textarea } from '../../../components/ui/index.js';

const STATUS_SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'converted', label: 'Converted' },
  { value: 'blocked', label: 'Blocked' }
];

const statusToneMap = {
  pending: 'info',
  converted: 'success',
  blocked: 'danger'
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

export default function AffiliateReferralManager({
  loading,
  referrals,
  meta,
  error,
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onPaginate,
  onRefresh,
  profileOptions,
  createForm,
  onCreateFormChange,
  onCreate,
  creating,
  creationError,
  onUpdateField,
  updatingIds
}) {
  return (
    <Card padding="lg" className="space-y-6 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-primary">Referral conversions</h3>
          <p className="text-sm text-slate-600">
            Inspect referral outcomes, adjust conversion counts, and manage remediation directly from the admin workspace.
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
            label="Search referral or code"
            placeholder="AFFILIATE01"
            value={filters.search}
            onChange={(event) => onFilterChange('search', event.target.value)}
            icon={MagnifyingGlassIcon}
          />
          <SegmentedControl
            name="Referral status filter"
            value={filters.status}
            options={STATUS_SEGMENTS}
            onChange={(next) => onFilterChange('status', next)}
            size="sm"
          />
        </div>
        <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-end">
          <Button type="button" variant="ghost" size="sm" onClick={onResetFilters}>
            Reset filters
          </Button>
          <Button type="button" size="sm" onClick={onApplyFilters} icon={UserGroupIcon}>
            Apply filters
          </Button>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Log manual referral</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Affiliate profile</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={createForm.affiliateProfileId}
              onChange={(event) => onCreateFormChange('affiliateProfileId', event.target.value)}
            >
              <option value="">Select profile</option>
              {profileOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <TextInput
            label="Referral code"
            placeholder="AFFILIATE01"
            value={createForm.referralCodeUsed}
            onChange={(event) => onCreateFormChange('referralCodeUsed', event.target.value)}
          />
          <TextInput
            label="Referred user ID"
            placeholder="Optional user ID"
            value={createForm.referredUserId}
            onChange={(event) => onCreateFormChange('referredUserId', event.target.value)}
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Status</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={createForm.status}
              onChange={(event) => onCreateFormChange('status', event.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="converted">Converted</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Conversions"
            type="number"
            min="0"
            value={createForm.conversionsCount}
            onChange={(event) => onCreateFormChange('conversionsCount', event.target.value)}
          />
          <TextInput
            label="Total revenue"
            type="number"
            min="0"
            step="0.01"
            value={createForm.totalRevenue}
            onChange={(event) => onCreateFormChange('totalRevenue', event.target.value)}
            prefix={<CalendarDaysIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          />
          <TextInput
            label="Total commission"
            type="number"
            min="0"
            step="0.01"
            value={createForm.totalCommissionEarned}
            onChange={(event) => onCreateFormChange('totalCommissionEarned', event.target.value)}
            prefix={<PencilSquareIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Last conversion at"
            type="datetime-local"
            value={createForm.lastConversionAt}
            onChange={(event) => onCreateFormChange('lastConversionAt', event.target.value)}
            prefix={<ClockIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          />
          <Textarea
            label="Notes"
            value={createForm.memo ?? ''}
            onChange={(event) => onCreateFormChange('memo', event.target.value)}
            hint="Optional notes for partner operations"
          />
        </div>
        <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-center">
          {creationError ? <StatusPill tone="danger">{creationError}</StatusPill> : null}
          <Button type="button" icon={PlusIcon} onClick={onCreate} loading={creating} disabled={creating}>
            Add referral
          </Button>
        </div>
      </section>

      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-primary">Referral history</h4>
          <span className="text-xs text-slate-500">
            Page {meta.page ?? 1} of {Math.max(meta.pageCount ?? 1, 1)} • {meta.total ?? referrals.length} referrals
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,180px)] bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <div>Referral</div>
            <div>Status &amp; conversions</div>
            <div>Revenue</div>
            <div>Commission</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-10">
                <Spinner size="sm">Loading referrals…</Spinner>
              </div>
            ) : referrals.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">No referrals found for the current filters.</div>
            ) : (
              referrals.map((referral) => {
                const isUpdating = updatingIds.has(referral.id);
                return (
                  <div
                    key={referral.id}
                    className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,180px)] items-center gap-4 px-4 py-4 text-sm text-slate-700"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-primary">{referral.referralCodeUsed}</p>
                      <p className="text-xs text-slate-500">
                        {referral.affiliate?.referralCode ? `Affiliate ${referral.affiliate.referralCode}` : 'Unassigned'}
                      </p>
                      {referral.referredUser?.email ? (
                        <p className="text-xs text-slate-400">{referral.referredUser.email}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StatusPill tone={statusToneMap[referral.status] ?? 'info'}>{referral.status}</StatusPill>
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                          value={referral.status}
                          onChange={(event) => onUpdateField(referral.id, { status: event.target.value })}
                          disabled={isUpdating}
                        >
                          <option value="pending">Pending</option>
                          <option value="converted">Converted</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                      <TextInput
                        label="Conversions"
                        type="number"
                        min="0"
                        defaultValue={referral.conversionsCount ?? 0}
                        onBlur={(event) => onUpdateField(referral.id, { conversionsCount: event.target.value })}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p>Revenue: {formatCurrency(referral.totalRevenue)}</p>
                      <TextInput
                        label="Adjust revenue"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={referral.totalRevenue ?? 0}
                        onBlur={(event) => onUpdateField(referral.id, { totalRevenue: event.target.value })}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p>Commission: {formatCurrency(referral.totalCommissionEarned)}</p>
                      <TextInput
                        label="Adjust commission"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={referral.totalCommissionEarned ?? 0}
                        onBlur={(event) => onUpdateField(referral.id, { totalCommissionEarned: event.target.value })}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <TextInput
                        label="Last conversion"
                        type="datetime-local"
                        defaultValue={referral.lastConversionAt ? referral.lastConversionAt.slice(0, 16) : ''}
                        onBlur={(event) => onUpdateField(referral.id, { lastConversionAt: event.target.value })}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing page {meta.page ?? 1} of {Math.max(meta.pageCount ?? 1, 1)} • {meta.total ?? referrals.length} referrals
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => onPaginate(Math.max(1, (meta.page ?? 1) - 1))}
              disabled={loading || (meta.page ?? 1) <= 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => onPaginate(Math.min(meta.pageCount || meta.page || 1, (meta.page ?? 1) + 1))}
              disabled={loading || (meta.page ?? 1) >= (meta.pageCount ?? 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </Card>
  );
}

AffiliateReferralManager.propTypes = {
  loading: PropTypes.bool,
  referrals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      referralCodeUsed: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      conversionsCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      totalRevenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      totalCommissionEarned: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      lastConversionAt: PropTypes.string,
      affiliate: PropTypes.shape({
        id: PropTypes.string,
        referralCode: PropTypes.string,
        tierLabel: PropTypes.string,
        status: PropTypes.string
      }),
      referredUser: PropTypes.shape({
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
  profileOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ),
  createForm: PropTypes.shape({
    affiliateProfileId: PropTypes.string,
    referralCodeUsed: PropTypes.string,
    referredUserId: PropTypes.string,
    status: PropTypes.string,
    conversionsCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalRevenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalCommissionEarned: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lastConversionAt: PropTypes.string,
    memo: PropTypes.string
  }).isRequired,
  onCreateFormChange: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  creating: PropTypes.bool,
  creationError: PropTypes.string,
  onUpdateField: PropTypes.func.isRequired,
  updatingIds: PropTypes.instanceOf(Set).isRequired
};

AffiliateReferralManager.defaultProps = {
  loading: false,
  referrals: [],
  error: null,
  profileOptions: [],
  creating: false,
  creationError: null
};
