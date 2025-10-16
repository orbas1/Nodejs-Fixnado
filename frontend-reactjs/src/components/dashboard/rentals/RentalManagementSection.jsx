import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  computeEscrowSummary,
  computeMetrics,
  depositStatusLabels,
  formatCurrency,
  inventoryStatusTone,
  normaliseRental
} from './rentalUtils.js';
import { listRentals } from '../../../api/rentalClient.js';
import Button from '../../ui/Button.jsx';
import StatusPill from '../../ui/StatusPill.jsx';
import RentalMetricsGrid from './RentalMetricsGrid.jsx';
import EscrowSummaryCards from './EscrowSummaryCards.jsx';
import RentalTable from './RentalTable.jsx';
import RentalDetailDrawer from './RentalDetailDrawer.jsx';
import RentalCreateModal from './RentalCreateModal.jsx';
import RentalDisputeModal from './RentalDisputeModal.jsx';
import RentalInventoryModal from './RentalInventoryModal.jsx';

export default function RentalManagementSection({ section }) {
  const data = section.data || {};
  const timezone = data.defaults?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [rentals, setRentals] = useState(() =>
    Array.isArray(data.rentals) ? data.rentals.map((rental) => normaliseRental(rental)) : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRentalId, setDetailRentalId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [disputeRentalId, setDisputeRentalId] = useState(null);
  const [inventoryDetail, setInventoryDetail] = useState(null);

  useEffect(() => {
    if (Array.isArray(data.rentals)) {
      setRentals(data.rentals.map((rental) => normaliseRental(rental)));
    }
  }, [data.rentals]);

  const selectedRental = useMemo(
    () => rentals.find((rental) => rental.id === detailRentalId) || null,
    [detailRentalId, rentals]
  );

  const disputeRental = useMemo(
    () => rentals.find((rental) => rental.id === disputeRentalId) || null,
    [disputeRentalId, rentals]
  );

  const inventoryList = useMemo(
    () => (Array.isArray(data.inventoryCatalogue) ? data.inventoryCatalogue : []),
    [data.inventoryCatalogue]
  );

  const inventoryOptions = useMemo(
    () =>
      inventoryList.map((item) => ({
        id: item.id,
        name: item.name,
        descriptor: [
          item.sku,
          item.rentalRate
            ? formatCurrency(item.rentalRate, item.rentalRateCurrency || data.defaults?.currency || 'GBP')
            : null
        ]
          .filter(Boolean)
          .join(' • ')
      })),
    [data.defaults?.currency, inventoryList]
  );

  const depositOptions = useMemo(() => {
    if (Array.isArray(data.statusOptions?.deposit) && data.statusOptions.deposit.length > 0) {
      return data.statusOptions.deposit;
    }
    return [
      { value: 'pending', label: depositStatusLabels.pending },
      { value: 'held', label: depositStatusLabels.held },
      { value: 'released', label: depositStatusLabels.released },
      { value: 'partially_released', label: depositStatusLabels.partially_released },
      { value: 'forfeited', label: depositStatusLabels.forfeited }
    ];
  }, [data.statusOptions]);

  const escrowSnapshot = useMemo(() => {
    const totals = data.escrow?.totals ? { ...data.escrow.totals } : computeEscrowSummary(rentals);
    return {
      totals,
      currency: data.escrow?.currency || data.defaults?.currency || 'GBP'
    };
  }, [data.defaults?.currency, data.escrow, rentals]);

  const escrowBuckets = useMemo(() => {
    const statuses = ['held', 'pending', 'released', 'partially_released', 'forfeited'];
    return statuses.map((status) => ({
      id: status,
      label: depositStatusLabels[status] || status,
      amount: escrowSnapshot.totals?.[status] ?? 0
    }));
  }, [escrowSnapshot]);

  const metrics = useMemo(() => computeMetrics(rentals, timezone), [rentals, timezone]);

  const resolveActorId = useCallback(
    (rental) => data.defaults?.renterId || rental?.renterId || rental?.meta?.createdBy || null,
    [data.defaults]
  );

  const refreshRentals = useCallback(async () => {
    setLoading(true);
    try {
      const query = {};
      if (data.defaults?.renterId) query.renterId = data.defaults.renterId;
      if (data.defaults?.companyId) query.companyId = data.defaults.companyId;
      const result = await listRentals(query);
      const normalised = Array.isArray(result) ? result.map((item) => normaliseRental(item)) : [];
      setRentals(normalised);
      setError(null);
    } catch (caught) {
      console.error('Failed to refresh rentals', caught);
      setError(caught instanceof Error ? caught.message : 'Failed to load rentals');
    } finally {
      setLoading(false);
    }
  }, [data.defaults]);

  const openDetail = useCallback((id) => {
    setDetailRentalId(id);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailRentalId(null);
  }, []);

  const handleDisputeStart = useCallback((rental) => {
    setDisputeRentalId(rental?.id ?? null);
  }, []);

  return (
    <section className="space-y-6" aria-labelledby={`${section.id}-header`}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 id={`${section.id}-header`} className="text-2xl font-semibold text-primary">
            {section.label}
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">{section.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setCreateOpen(true)} data-qa="rental-new-button">
            Request rental
          </Button>
          <Button variant="ghost" onClick={refreshRentals} loading={loading} data-qa="rental-refresh-button">
            Refresh
          </Button>
        </div>
      </header>

      <RentalMetricsGrid metrics={metrics} />

      <EscrowSummaryCards
        buckets={escrowBuckets}
        currency={escrowSnapshot.currency}
        total={escrowSnapshot.totals?.total ?? 0}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      ) : null}

      <RentalTable rentals={rentals} timezone={timezone} onSelect={openDetail} />

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary">Inventory catalogue</h3>
            <p className="text-sm text-slate-500">
              Linked assets with availability, rates, and deposit requirements.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {inventoryList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-secondary/40 p-6 text-sm text-slate-500">
              No inventory linked yet. Add assets from the inventory workspace to request rentals faster.
            </div>
          ) : (
            inventoryList.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-primary">{item.name}</h4>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.sku}</p>
                    {item.category ? <p className="mt-1 text-xs text-slate-500">{item.category}</p> : null}
                  </div>
                  <StatusPill tone={inventoryStatusTone[item.status] || 'neutral'}>
                    {item.status?.replace(/_/g, ' ') || 'Unknown'}
                  </StatusPill>
                </div>
                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <dt>Availability</dt>
                    <dd className="font-medium text-primary">{item.availability}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Daily rate</dt>
                    <dd>
                      {item.rentalRate
                        ? formatCurrency(item.rentalRate, item.rentalRateCurrency || data.defaults?.currency || 'GBP')
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Deposit</dt>
                    <dd>
                      {item.depositAmount
                        ? formatCurrency(item.depositAmount, item.depositCurrency || data.defaults?.currency || 'GBP')
                        : 'None'}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setInventoryDetail(item)}>
                    View details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <RentalDetailDrawer
        open={detailOpen}
        onClose={closeDetail}
        rental={selectedRental}
        timezone={timezone}
        depositOptions={depositOptions}
        currency={escrowSnapshot.currency}
        onRefresh={refreshRentals}
        resolveActorId={resolveActorId}
        onDispute={handleDisputeStart}
      />

      <RentalCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        inventoryOptions={inventoryOptions}
        defaults={data.defaults}
        onCreated={refreshRentals}
      />

      <RentalDisputeModal
        open={Boolean(disputeRentalId)}
        rental={disputeRental}
        onClose={() => setDisputeRentalId(null)}
        resolveActorId={resolveActorId}
        onSubmitted={refreshRentals}
      />

      <RentalInventoryModal
        open={Boolean(inventoryDetail)}
        onClose={() => setInventoryDetail(null)}
        item={inventoryDetail}
        currency={data.defaults?.currency || 'GBP'}
      />
    </section>
  );
}

RentalManagementSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    data: PropTypes.shape({
      rentals: PropTypes.array,
      inventoryCatalogue: PropTypes.array,
      escrow: PropTypes.shape({
        totals: PropTypes.object,
        currency: PropTypes.string
      }),
      statusOptions: PropTypes.shape({
        deposit: PropTypes.array
      }),
      defaults: PropTypes.shape({
        renterId: PropTypes.string,
        companyId: PropTypes.string,
        timezone: PropTypes.string,
        currency: PropTypes.string
      })
    })
  }).isRequired
};

