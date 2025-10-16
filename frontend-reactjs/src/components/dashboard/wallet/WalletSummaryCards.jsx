import PropTypes from 'prop-types';
import { formatCurrency } from '../../../utils/numberFormatters.js';

const SummaryCard = ({ label, value, helper = null, tone = 'neutral' }) => {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'info'
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : 'border-slate-200 bg-white text-slate-700';

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-3 text-xl font-semibold">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-600">{helper}</p> : null}
    </div>
  );
};

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.node,
  tone: PropTypes.oneOf(['warning', 'success', 'info', 'neutral'])
};

const WalletSummaryCards = ({
  summary,
  availableBalance = 0,
  currency,
  autopayoutEnabled = false,
  autopayoutStatus = 'Disabled'
}) => (
  <div className="grid gap-4 lg:grid-cols-4">
    <SummaryCard
      label="Current balance"
      value={formatCurrency(summary.balance ?? 0, currency)}
      helper="Total funds available inside your wallet"
    />
    <SummaryCard
      label="Pending holds"
      value={formatCurrency(summary.pending ?? 0, currency)}
      helper="Deposits reserved for in-flight bookings"
      tone={summary.pending > 0 ? 'warning' : 'neutral'}
    />
    <SummaryCard
      label="Available"
      value={formatCurrency(availableBalance ?? 0, currency)}
      helper="Funds that can be applied to new orders"
      tone="success"
    />
    <SummaryCard
      label="Autopayout"
      value={autopayoutEnabled ? 'Enabled' : 'Disabled'}
      helper={autopayoutEnabled ? autopayoutStatus : 'Enable to route surplus funds automatically'}
      tone={autopayoutEnabled ? 'info' : 'neutral'}
    />
  </div>
);

WalletSummaryCards.propTypes = {
  summary: PropTypes.shape({
    balance: PropTypes.number,
    pending: PropTypes.number,
    available: PropTypes.number
  }).isRequired,
  availableBalance: PropTypes.number,
  currency: PropTypes.string.isRequired,
  autopayoutEnabled: PropTypes.bool,
  autopayoutStatus: PropTypes.string
};

export default WalletSummaryCards;
