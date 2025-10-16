import PropTypes from 'prop-types';
import { SegmentedControl, StatusPill, TextInput, Spinner } from '../../../components/ui/index.js';
import { formatDateTime, toFriendlyLabel } from '../utils.js';

export default function RentalListPanel({
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  searchTerm,
  onSearchTermChange,
  listState,
  rentals,
  selectedRentalId,
  onSelectRental,
  depositStatusTone,
  rentalStatusTone
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-primary">Rental agreements</h2>
            <p className="text-sm text-slate-600">
              Filter by lifecycle status or search by rental number, SKU, or asset name.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <TextInput
              label="Search"
              placeholder="Search rentals"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
            />
            <SegmentedControl
              name="Rental status filter"
              value={statusFilter}
              options={statusOptions}
              onChange={onStatusFilterChange}
            />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {listState.error ? (
            <StatusPill tone="danger">{listState.error.message || 'Unable to load rentals.'}</StatusPill>
          ) : null}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-secondary/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Rental</th>
                  <th className="px-4 py-3 text-left">Asset</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Deposit</th>
                  <th className="px-4 py-3 text-right">Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                {rentals.map((rental) => {
                  const isActive = rental.id === selectedRentalId;
                  return (
                    <tr
                      key={rental.id}
                      className={`cursor-pointer transition hover:bg-primary/5 ${isActive ? 'bg-primary/10' : ''}`}
                      onClick={() => onSelectRental(rental.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-primary">
                        <div>{rental.rentalNumber}</div>
                        <p className="text-xs text-slate-500">Quantity • {rental.quantity}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700">{rental.item?.name || 'Unassigned asset'}</p>
                        <p className="text-xs text-slate-500">{rental.item?.sku || 'SKU pending'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <StatusPill tone={rentalStatusTone[rental.status] ?? 'info'}>
                            {toFriendlyLabel(rental.status)}
                          </StatusPill>
                          {rental.latestCheckpoint ? (
                            <p className="text-xs text-slate-500">{rental.latestCheckpoint.description}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={depositStatusTone[rental.depositStatus] ?? 'neutral'}>
                          {toFriendlyLabel(rental.depositStatus)}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">
                        <div>{formatDateTime(rental.pickupAt || rental.rentalStartAt)}</div>
                        <div className="mt-1">→ {formatDateTime(rental.returnDueAt || rental.rentalEndAt)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {listState.loading ? (
              <div className="flex items-center justify-center gap-3 bg-white/80 py-6">
                <Spinner />
                <span className="text-sm text-slate-500">Loading rental agreements…</span>
              </div>
            ) : null}
            {!listState.loading && rentals.length === 0 ? (
              <div className="bg-white/80 p-6 text-sm text-slate-500">No rentals found for the current filters.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

RentalListPanel.propTypes = {
  statusFilter: PropTypes.string.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  statusOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  listState: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.instanceOf(Error)
  }).isRequired,
  rentals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  ).isRequired,
  selectedRentalId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectRental: PropTypes.func.isRequired,
  depositStatusTone: PropTypes.object.isRequired,
  rentalStatusTone: PropTypes.object.isRequired
};

RentalListPanel.defaultProps = {
  selectedRentalId: null
};
