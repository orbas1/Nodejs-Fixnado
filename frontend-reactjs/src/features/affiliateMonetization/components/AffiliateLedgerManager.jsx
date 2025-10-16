import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Spinner, StatusPill, TextInput, Textarea } from '../../../components/ui/index.js';

const LEDGER_STATUS_OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' }
];

const statusTone = {
  approved: 'success',
  pending: 'info',
  paid: 'success',
  rejected: 'danger'
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

function formatDate(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }
  return date.toLocaleString();
}

export default function AffiliateLedgerManager({
  profile,
  entries,
  meta,
  loading,
  error,
  form,
  onFormChange,
  onSubmit,
  saving,
  onRefresh,
  onClose,
  onPaginate
}) {
  return (
    <Card padding="lg" className="space-y-6 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-primary">
            Ledger • {profile.referralCode}{' '}
            <span className="text-sm font-normal text-slate-500">({profile.user?.email ?? profile.userId})</span>
          </h3>
          <p className="text-sm text-slate-600">
            Adjust balances, recognise payouts, and audit transaction history for this affiliate profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" icon={XMarkIcon} onClick={onClose}>
            Close ledger
          </Button>
          <Button type="button" variant="secondary" size="sm" icon={ArrowPathIcon} onClick={onRefresh} disabled={loading}>
            Refresh ledger
          </Button>
        </div>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2">
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Pending commission:</span>{' '}
            {formatCurrency(profile.pendingCommission)}
          </p>
          <p>
            <span className="font-semibold text-slate-800">Approved commission:</span>{' '}
            {formatCurrency(profile.totalCommissionEarned)}
          </p>
          <p>
            <span className="font-semibold text-slate-800">Lifetime revenue:</span>{' '}
            {formatCurrency(profile.lifetimeRevenue)}
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Status:</span>{' '}
            <StatusPill tone={statusTone[profile.status] ?? 'info'}>{profile.status}</StatusPill>
          </p>
          <p>
            <span className="font-semibold text-slate-800">Tier:</span>{' '}
            {profile.tierLabel || 'Not assigned'}
          </p>
          <p>
            <span className="font-semibold text-slate-800">Total referrals:</span> {profile.totalReferred ?? 0}
          </p>
        </div>
      </section>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={onSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Transaction amount"
            type="number"
            step="0.01"
            min="0"
            value={form.transactionAmount}
            onChange={(event) => onFormChange('transactionAmount', event.target.value)}
            prefix={<CreditCardIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          />
          <TextInput
            label="Commission amount"
            type="number"
            step="0.01"
            value={form.commissionAmount}
            onChange={(event) => onFormChange('commissionAmount', event.target.value)}
            prefix={<ShieldCheckIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput
            label="Currency"
            value={form.currency}
            onChange={(event) => onFormChange('currency', event.target.value.toUpperCase())}
            maxLength={3}
          />
          <TextInput
            label="Occurrence index"
            type="number"
            min="1"
            value={form.occurrenceIndex}
            onChange={(event) => onFormChange('occurrenceIndex', event.target.value)}
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Status</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.status}
              onChange={(event) => onFormChange('status', event.target.value)}
            >
              {LEDGER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            label="Recognised at"
            type="datetime-local"
            value={form.recognizedAt}
            onChange={(event) => onFormChange('recognizedAt', event.target.value)}
            prefix={<ClockIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          />
          <TextInput
            label="Transaction reference"
            value={form.transactionId ?? ''}
            onChange={(event) => onFormChange('transactionId', event.target.value)}
            prefix={<DocumentTextIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          />
        </div>
        <Textarea
          label="Memo"
          value={form.memo ?? ''}
          onChange={(event) => onFormChange('memo', event.target.value)}
          hint="Optional note for auditors and finance reviewers."
        />
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" icon={ArrowTopRightOnSquareIcon} loading={saving} disabled={saving}>
            Record adjustment
          </Button>
        </div>
      </form>

      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-primary">Ledger history</h4>
          <span className="text-xs text-slate-500">
            Page {meta.page ?? 1} of {Math.max(meta.pageCount ?? 1, 1)} • {meta.total ?? entries.length} entries
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <div>Reference</div>
            <div>Commission</div>
            <div>Transaction</div>
            <div>Status</div>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-10">
                <Spinner size="sm">Loading ledger…</Spinner>
              </div>
            ) : entries.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">No ledger entries recorded yet.</div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-4 py-3 text-sm text-slate-700">
                  <div className="space-y-1">
                    <p className="font-medium text-primary">{entry.transactionId}</p>
                    <p className="text-xs text-slate-500">Recognised {formatDate(entry.recognizedAt)}</p>
                    {entry.metadata?.memo ? (
                      <p className="text-xs text-slate-500">Memo: {entry.metadata.memo}</p>
                    ) : null}
                  </div>
                  <div>
                    <p>{formatCurrency(entry.commissionAmount, entry.currency)}</p>
                    <p className="text-xs text-slate-500">Occurrence #{entry.occurrenceIndex}</p>
                  </div>
                  <div>
                    <p>{formatCurrency(entry.transactionAmount, entry.currency)}</p>
                    {entry.referral?.referralCodeUsed ? (
                      <p className="text-xs text-slate-500">Referral {entry.referral.referralCodeUsed}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={statusTone[entry.status] ?? 'info'}>{entry.status}</StatusPill>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing page {meta.page ?? 1} of {Math.max(meta.pageCount ?? 1, 1)}
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
              onClick={() =>
                onPaginate(
                  Math.min(meta.pageCount ?? meta.page ?? 1, (meta.page ?? 1) + 1)
                )
              }
              disabled={loading || (meta.page ?? 1) >= (meta.pageCount ?? meta.page ?? 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </Card>
  );
}

AffiliateLedgerManager.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.string.isRequired,
    referralCode: PropTypes.string.isRequired,
    userId: PropTypes.string,
    user: PropTypes.shape({ email: PropTypes.string }),
    status: PropTypes.string,
    tierLabel: PropTypes.string,
    totalCommissionEarned: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    pendingCommission: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lifetimeRevenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalReferred: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      transactionId: PropTypes.string.isRequired,
      commissionAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      transactionAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      currency: PropTypes.string,
      occurrenceIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
      recognizedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      metadata: PropTypes.object
    })
  ),
  meta: PropTypes.shape({
    page: PropTypes.number,
    pageCount: PropTypes.number,
    total: PropTypes.number
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  form: PropTypes.shape({
    transactionAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    commissionAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    occurrenceIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    status: PropTypes.string,
    recognizedAt: PropTypes.string,
    memo: PropTypes.string,
    transactionId: PropTypes.string
  }).isRequired,
  onFormChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onPaginate: PropTypes.func.isRequired
};

AffiliateLedgerManager.defaultProps = {
  entries: [],
  meta: { page: 1, pageCount: 1, total: 0 },
  loading: false,
  error: null,
  saving: false
};
