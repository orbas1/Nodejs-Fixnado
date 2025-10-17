import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';

function RentalManager({ rentals, loading, onRefresh, onCreate, onAction }) {
  const [createForm, setCreateForm] = useState({
    itemId: '',
    renterId: '',
    quantity: '1'
  });
  const [depositForm, setDepositForm] = useState({ rentalId: null, status: 'held', amount: '', reason: '' });

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = (event) => {
    event.preventDefault();
    if (!createForm.itemId || !createForm.renterId) return;
    onCreate({
      itemId: createForm.itemId,
      renterId: createForm.renterId,
      quantity: Number.parseInt(createForm.quantity, 10) || 1,
      actorRole: 'provider'
    });
    setCreateForm({ itemId: '', renterId: '', quantity: '1' });
  };

  const openDeposit = (rental) => {
    setDepositForm({
      rentalId: rental.id,
      status: rental.depositStatus || 'held',
      amount: rental.depositAmount != null ? String(rental.depositAmount) : '',
      reason: ''
    });
  };

  const submitDeposit = (event) => {
    event.preventDefault();
    if (!depositForm.rentalId) return;
    onAction(depositForm.rentalId, 'deposit', {
      status: depositForm.status,
      amount: depositForm.amount ? Number.parseFloat(depositForm.amount) : null,
      reason: depositForm.reason || undefined,
      actorRole: 'provider'
    });
    setDepositForm({ rentalId: null, status: 'held', amount: '', reason: '' });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary">Rental lifecycle</h3>
          <p className="text-sm text-slate-500">
            Track requests, approvals, deposit holds, and inspection outcomes for every hire agreement.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <form onSubmit={handleCreate} className="mt-4 grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 md:grid-cols-4">
        <div>
          <label htmlFor="rental-item" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Inventory item ID
          </label>
          <input
            id="rental-item"
            name="itemId"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={createForm.itemId}
            onChange={handleCreateChange}
            required
          />
        </div>
        <div>
          <label htmlFor="rental-renter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Renter ID
          </label>
          <input
            id="rental-renter"
            name="renterId"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={createForm.renterId}
            onChange={handleCreateChange}
            required
          />
        </div>
        <div>
          <label htmlFor="rental-quantity" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quantity
          </label>
          <input
            id="rental-quantity"
            name="quantity"
            type="number"
            min="1"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={createForm.quantity}
            onChange={handleCreateChange}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Creating…' : 'Create rental'}
          </Button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Rental</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Deposit</th>
              <th className="px-4 py-3 text-left">Return due</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/60">
            {rentals.length ? (
              rentals.map((rental) => (
                <tr key={rental.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-primary">{rental.rentalNumber || rental.id}</p>
                    <p className="text-xs text-slate-500">Qty {rental.quantity}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="font-semibold text-slate-600">{rental.status?.replace(/_/g, ' ')}</span>
                      <span className="text-slate-500">{rental.booking?.reference || rental.bookingId || 'No booking'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="font-semibold text-slate-600">{rental.depositStatus}</span>
                      <span className="text-slate-500">
                        {rental.depositAmount != null ? `${rental.depositCurrency || 'GBP'} ${rental.depositAmount}` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {rental.returnDueAt ? new Date(rental.returnDueAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2 text-xs">
                      {rental.status === 'requested' ? (
                        <Button size="xs" variant="ghost" onClick={() => onAction(rental.id, 'approve', { actorRole: 'provider' })}>
                          Approve
                        </Button>
                      ) : null}
                      {['approved'].includes(rental.status) ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() =>
                            onAction(rental.id, 'schedule', { pickupAt: new Date().toISOString(), actorRole: 'provider' })
                          }
                        >
                          Schedule pickup
                        </Button>
                      ) : null}
                      {['approved', 'pickup_scheduled'].includes(rental.status) ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() =>
                            onAction(rental.id, 'checkout', { rentalStartAt: new Date().toISOString(), actorRole: 'provider' })
                          }
                        >
                          Check-out
                        </Button>
                      ) : null}
                      {['in_use'].includes(rental.status) ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() =>
                            onAction(rental.id, 'return', { returnedAt: new Date().toISOString(), actorRole: 'provider' })
                          }
                        >
                          Mark returned
                        </Button>
                      ) : null}
                      <Button size="xs" variant="ghost" onClick={() => openDeposit(rental)}>
                        Update deposit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                  No rental agreements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {depositForm.rentalId ? (
        <form
          onSubmit={submitDeposit}
          className="mt-6 grid gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 md:grid-cols-4"
        >
          <p className="md:col-span-4 text-sm font-semibold text-amber-700">
            Update deposit for rental {depositForm.rentalId.slice(0, 8)}
          </p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-amber-700" htmlFor="deposit-status">
              Status
            </label>
            <select
              id="deposit-status"
              name="status"
              className="mt-1 w-full rounded-2xl border border-amber-200 px-4 py-2 text-sm"
              value={depositForm.status}
              onChange={(event) => setDepositForm((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="held">Held</option>
              <option value="released">Released</option>
              <option value="forfeited">Forfeited</option>
              <option value="partially_released">Partially released</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-amber-700" htmlFor="deposit-amount">
              Amount
            </label>
            <input
              id="deposit-amount"
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-2xl border border-amber-200 px-4 py-2 text-sm"
              value={depositForm.amount}
              onChange={(event) => setDepositForm((current) => ({ ...current, amount: event.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-amber-700" htmlFor="deposit-reason">
              Notes
            </label>
            <textarea
              id="deposit-reason"
              className="mt-1 w-full rounded-2xl border border-amber-200 px-4 py-2 text-sm"
              rows={2}
              value={depositForm.reason}
              onChange={(event) => setDepositForm((current) => ({ ...current, reason: event.target.value }))}
            />
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit" size="sm" variant="secondary">
              Save deposit
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDepositForm({ rentalId: null, status: 'held', amount: '', reason: '' })}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

RentalManager.propTypes = {
  rentals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      rentalNumber: PropTypes.string,
      status: PropTypes.string,
      quantity: PropTypes.number,
      depositStatus: PropTypes.string,
      depositAmount: PropTypes.number,
      depositCurrency: PropTypes.string,
      returnDueAt: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  onCreate: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired
};

RentalManager.defaultProps = {
  rentals: [],
  loading: false,
  onRefresh: () => {}
};

export default RentalManager;
