import PropTypes from 'prop-types';
import { Button } from '../../ui/index.js';

const WalletEmptyState = ({ onCreate, loading = false, error = null, canManage = true }) => (
  <div className="rounded-3xl border border-dashed border-primary/30 bg-white/60 p-10 text-center shadow-sm">
    <h3 className="text-xl font-semibold text-primary">Create your Fixnado wallet</h3>
    <p className="mt-3 text-sm text-slate-600">
      Provision a wallet to fund bookings, hold deposits, and release payouts automatically once inspections pass. Configure
      payout methods and automation rules immediately after creation.
    </p>
    {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    <div className="mt-6 flex justify-center">
      <Button type="button" onClick={onCreate} disabled={!canManage || loading} className="px-6">
        {loading ? 'Creating…' : 'Create wallet'}
      </Button>
    </div>
    {!canManage ? (
      <p className="mt-3 text-xs text-slate-500">
        You do not currently have permission to create a wallet. Contact your administrator to request access.
      </p>
    ) : null}
  </div>
);

WalletEmptyState.propTypes = {
  onCreate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  canManage: PropTypes.bool
};

export default WalletEmptyState;
