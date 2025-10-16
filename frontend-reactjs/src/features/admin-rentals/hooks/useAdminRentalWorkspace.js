import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addAdminRentalCheckpoint,
  approveAdminRental,
  cancelAdminRental,
  checkoutAdminRental,
  createAdminRental,
  getAdminRental,
  inspectAdminRental,
  listAdminRentals,
  markAdminRentalReturned,
  scheduleAdminRentalPickup,
  updateAdminRental
} from '../../../api/rentalAdminClient.js';
import { parseList, rentalMatchesSearch, toFriendlyLabel, toLocalInputValue } from '../utils.js';

const DEFAULT_CREATE_FORM = {
  itemId: '',
  renterId: '',
  bookingId: '',
  marketplaceItemId: '',
  quantity: 1,
  rentalStartAt: '',
  rentalEndAt: '',
  notes: ''
};

const DEFAULT_APPROVE_FORM = { notes: '' };
const DEFAULT_PICKUP_FORM = { pickupAt: '', returnDueAt: '', logisticsNotes: '' };
const DEFAULT_CHECKOUT_FORM = { rentalStartAt: '', conditionNotes: '', conditionImages: '', handoverNotes: '' };
const DEFAULT_RETURN_FORM = { returnedAt: '', conditionNotes: '', conditionImages: '', notes: '' };
const DEFAULT_INSPECTION_FORM = { outcome: 'clear', inspectionNotes: '', charges: [] };
const DEFAULT_CANCEL_FORM = { reason: '' };
const DEFAULT_CHECKPOINT_FORM = { type: 'note', description: '', notes: '', images: '' };
const DEFAULT_SCHEDULE_FORM = { rentalStartAt: '', rentalEndAt: '', pickupAt: '', returnDueAt: '' };
const DEFAULT_FINANCIAL_FORM = {
  depositAmount: '',
  depositCurrency: '',
  depositStatus: 'pending',
  dailyRate: '',
  rateCurrency: ''
};
const DEFAULT_ASSOCIATION_FORM = {
  bookingId: '',
  marketplaceItemId: '',
  regionId: '',
  renterId: '',
  companyId: '',
  notes: '',
  logisticsNotes: ''
};

function isoRelativeHours(offset) {
  const date = new Date(Date.now() + offset * 60 * 60 * 1000);
  return date.toISOString();
}

const DEMO_RENTALS = [
  {
    id: 'demo-rental-1',
    rentalNumber: 'RA-FX-10241',
    status: 'pickup_scheduled',
    depositStatus: 'held',
    quantity: 2,
    rentalStartAt: isoRelativeHours(-24),
    rentalEndAt: isoRelativeHours(120),
    pickupAt: isoRelativeHours(4),
    returnDueAt: isoRelativeHours(132),
    dailyRate: 180,
    rateCurrency: 'GBP',
    depositAmount: 600,
    depositCurrency: 'GBP',
    companyId: 'demo-company-1',
    renterId: 'demo-renter-1',
    bookingId: 'demo-booking-1',
    marketplaceItemId: 'market-004',
    meta: {
      notes: 'High priority refurbishment schedule.',
      logisticsNotes: 'Deliver to loading bay B before 08:00.'
    },
    item: {
      id: 'demo-asset-1',
      name: 'Industrial Dehumidifier',
      sku: 'FX-DH-400',
      rentalRate: 180,
      rentalRateCurrency: 'GBP',
      depositAmount: 600,
      depositCurrency: 'GBP',
      metadata: { manufacturer: 'DryAir Systems' }
    },
    booking: {
      id: 'demo-booking-1',
      status: 'scheduled',
      scheduledStart: isoRelativeHours(4),
      scheduledEnd: isoRelativeHours(128),
      totalAmount: 1440,
      currency: 'GBP',
      reference: 'BOOK-45821'
    },
    timeline: [
      {
        id: 'demo-timeline-1',
        type: 'status_change',
        description: 'Rental approved',
        recordedBy: 'ops-admin',
        recordedByRole: 'admin',
        occurredAt: isoRelativeHours(-30),
        payload: { notes: 'Auto-approval rule matched for trusted renter.' }
      },
      {
        id: 'demo-timeline-2',
        type: 'handover',
        description: 'Pickup scheduled',
        recordedBy: 'logistics-team',
        recordedByRole: 'provider',
        occurredAt: isoRelativeHours(-12),
        payload: { pickupAt: isoRelativeHours(4), returnDueAt: isoRelativeHours(132) }
      },
      {
        id: 'demo-timeline-3',
        type: 'deposit',
        description: 'Deposit hold confirmed',
        recordedBy: 'finance-bot',
        recordedByRole: 'system',
        occurredAt: isoRelativeHours(-6),
        payload: { amount: 600, currency: 'GBP' }
      }
    ]
  },
  {
    id: 'demo-rental-2',
    rentalNumber: 'RA-FX-20490',
    status: 'inspection_pending',
    depositStatus: 'held',
    quantity: 1,
    rentalStartAt: isoRelativeHours(-72),
    rentalEndAt: isoRelativeHours(-6),
    pickupAt: isoRelativeHours(-70),
    returnDueAt: isoRelativeHours(-4),
    returnedAt: isoRelativeHours(-5),
    dailyRate: 95,
    rateCurrency: 'GBP',
    depositAmount: 250,
    depositCurrency: 'GBP',
    companyId: 'demo-company-2',
    renterId: 'demo-renter-2',
    bookingId: 'demo-booking-2',
    marketplaceItemId: 'market-021',
    meta: {
      notes: 'Awaiting inspection clearance before release.',
      logisticsNotes: 'Store in quarantine bay until QA signs off.'
    },
    item: {
      id: 'demo-asset-2',
      name: 'Compact Excavator',
      sku: 'FX-EX-200',
      rentalRate: 95,
      rentalRateCurrency: 'GBP',
      depositAmount: 250,
      depositCurrency: 'GBP',
      metadata: { manufacturer: 'BuildRight' }
    },
    booking: {
      id: 'demo-booking-2',
      status: 'completed',
      scheduledStart: isoRelativeHours(-72),
      scheduledEnd: isoRelativeHours(-6),
      totalAmount: 665,
      currency: 'GBP',
      reference: 'BOOK-50112'
    },
    timeline: [
      {
        id: 'demo-timeline-4',
        type: 'status_change',
        description: 'Rental approved',
        recordedBy: 'ops-admin',
        recordedByRole: 'admin',
        occurredAt: isoRelativeHours(-90),
        payload: { notes: 'Manual approval after credit review.' }
      },
      {
        id: 'demo-timeline-5',
        type: 'handover',
        description: 'Equipment checked out',
        recordedBy: 'yard-team',
        recordedByRole: 'provider',
        occurredAt: isoRelativeHours(-70),
        payload: { conditionOut: { notes: 'All systems normal' } }
      },
      {
        id: 'demo-timeline-6',
        type: 'return',
        description: 'Equipment returned - awaiting inspection',
        recordedBy: 'yard-team',
        recordedByRole: 'provider',
        occurredAt: isoRelativeHours(-5),
        payload: { conditionIn: { notes: 'Light surface wear' } }
      }
    ]
  }
].map((entry) => ({
  ...entry,
  latestCheckpoint: entry.timeline[entry.timeline.length - 1] ?? null
}));

function createDemoTimelineEntry(type, description, payload = {}) {
  return {
    id: `demo-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    description,
    recordedBy: 'demo-admin',
    recordedByRole: 'admin',
    occurredAt: new Date().toISOString(),
    payload
  };
}

function ensureLatestCheckpoint(rental) {
  return {
    ...rental,
    latestCheckpoint: rental.timeline?.[rental.timeline.length - 1] ?? null
  };
}

function cloneDemoRental(rental) {
  return ensureLatestCheckpoint(JSON.parse(JSON.stringify(rental)));
}

function createInitialDemoRentals() {
  return DEMO_RENTALS.map((entry) => cloneDemoRental(entry));
}

function updateDemoRentalCollection(rentals, rentalId, mutator) {
  let updated = false;
  const next = rentals.map((entry) => {
    if (entry.id !== rentalId) {
      return entry;
    }
    const draft = cloneDemoRental(entry);
    const result = mutator(draft) || draft;
    updated = true;
    return ensureLatestCheckpoint(result);
  });
  return updated ? next : rentals;
}

function toNumberOrNull(value) {
  if (value === '' || value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function useAdminRentalWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRentalId = searchParams.get('rental');
  const demoMode =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('demo') === '1';

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [listReloadKey, setListReloadKey] = useState(0);
  const [selectedReloadKey, setSelectedReloadKey] = useState(0);
  const [demoRentals, setDemoRentals] = useState(() => createInitialDemoRentals());
  const [listState, setListState] = useState({ loading: true, data: [], meta: {}, error: null });
  const [selectedState, setSelectedState] = useState({ loading: false, data: null, error: null });
  const [actionLoading, setActionLoading] = useState(null);
  const [detailStatus, setDetailStatus] = useState(null);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [createStatus, setCreateStatus] = useState({ loading: false, error: null, success: null });
  const [approveForm, setApproveForm] = useState(DEFAULT_APPROVE_FORM);
  const [pickupForm, setPickupForm] = useState(DEFAULT_PICKUP_FORM);
  const [checkoutForm, setCheckoutForm] = useState(DEFAULT_CHECKOUT_FORM);
  const [returnForm, setReturnForm] = useState(DEFAULT_RETURN_FORM);
  const [inspectionForm, setInspectionForm] = useState(DEFAULT_INSPECTION_FORM);
  const [cancelForm, setCancelForm] = useState(DEFAULT_CANCEL_FORM);
  const [checkpointForm, setCheckpointForm] = useState(DEFAULT_CHECKPOINT_FORM);
  const [scheduleForm, setScheduleForm] = useState(DEFAULT_SCHEDULE_FORM);
  const [financialForm, setFinancialForm] = useState(DEFAULT_FINANCIAL_FORM);
  const [associationForm, setAssociationForm] = useState(DEFAULT_ASSOCIATION_FORM);
  const [updateStatus, setUpdateStatus] = useState({
    schedule: { loading: false, notice: null },
    financial: { loading: false, notice: null },
    associations: { loading: false, notice: null }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (demoMode) {
      setDemoRentals(createInitialDemoRentals());
    }
  }, [demoMode]);

  const reloadList = useCallback(() => setListReloadKey((key) => key + 1), []);
  const reloadSelected = useCallback(() => setSelectedReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (demoMode) {
      const depositSummary = demoRentals.reduce((acc, rental) => {
        if (rental.depositStatus) {
          acc[rental.depositStatus] = (acc[rental.depositStatus] ?? 0) + 1;
        }
        return acc;
      }, {});
      const statusFilteredRentals =
        statusFilter !== 'all' ? demoRentals.filter((entry) => entry.status === statusFilter) : demoRentals;
      setListState({
        loading: false,
        data: statusFilteredRentals,
        meta: {
          total: demoRentals.length,
          active: demoRentals.filter((entry) => entry.status !== 'settled' && entry.status !== 'cancelled').length,
          byStatus: demoRentals.reduce((acc, rental) => {
            acc[rental.status] = (acc[rental.status] ?? 0) + 1;
            return acc;
          }, {}),
          depositSummary,
          limit: undefined,
          offset: undefined
        },
        error: null
      });
      return;
    }

    const controller = new AbortController();
    setListState((current) => ({ ...current, loading: true, error: null }));
    listAdminRentals(
      {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearch || undefined
      },
      { signal: controller.signal }
    )
      .then((payload) => {
        setListState({
          loading: false,
          data: Array.isArray(payload?.data) ? payload.data : [],
          meta: payload?.meta ?? {},
          error: null
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setListState({ loading: false, data: [], meta: {}, error });
      });
    return () => controller.abort();
  }, [statusFilter, debouncedSearch, listReloadKey, demoMode, demoRentals]);

  useEffect(() => {
    if (demoMode) {
      const demoSelected = demoRentals.find((entry) => entry.id === selectedRentalId) ?? demoRentals[0] ?? null;
      if (!selectedRentalId && demoSelected?.id) {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.set('rental', demoSelected.id);
          return next;
        });
      }
      setSelectedState({ loading: false, data: demoSelected ?? null, error: null });
      return;
    }
    if (!selectedRentalId) {
      setSelectedState({ loading: false, data: null, error: null });
      return;
    }
    const controller = new AbortController();
    setSelectedState((current) => ({ ...current, loading: true, error: null }));
    getAdminRental(selectedRentalId, { signal: controller.signal })
      .then((payload) => {
        setSelectedState({ loading: false, data: payload?.data ?? null, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setSelectedState({ loading: false, data: null, error });
      });
    return () => controller.abort();
  }, [selectedRentalId, selectedReloadKey, demoMode, demoRentals, setSearchParams]);

  useEffect(() => {
    setDetailStatus(null);
    setActionLoading(null);
    setApproveForm(DEFAULT_APPROVE_FORM);
    setPickupForm(DEFAULT_PICKUP_FORM);
    setCheckoutForm(DEFAULT_CHECKOUT_FORM);
    setReturnForm(DEFAULT_RETURN_FORM);
    setInspectionForm(DEFAULT_INSPECTION_FORM);
    setCancelForm(DEFAULT_CANCEL_FORM);
    setCheckpointForm(DEFAULT_CHECKPOINT_FORM);
    setScheduleForm(DEFAULT_SCHEDULE_FORM);
    setFinancialForm(DEFAULT_FINANCIAL_FORM);
    setAssociationForm(DEFAULT_ASSOCIATION_FORM);
    setUpdateStatus({
      schedule: { loading: false, notice: null },
      financial: { loading: false, notice: null },
      associations: { loading: false, notice: null }
    });
  }, [selectedRentalId]);

  const selectedRental = selectedState.data;

  useEffect(() => {
    if (!selectedRental) {
      return;
    }

    setScheduleForm({
      rentalStartAt: toLocalInputValue(selectedRental.rentalStartAt),
      rentalEndAt: toLocalInputValue(selectedRental.rentalEndAt),
      pickupAt: toLocalInputValue(selectedRental.pickupAt),
      returnDueAt: toLocalInputValue(selectedRental.returnDueAt)
    });

    setFinancialForm({
      depositAmount:
        selectedRental.depositAmount != null && !Number.isNaN(Number(selectedRental.depositAmount))
          ? Number(selectedRental.depositAmount).toString()
          : '',
      depositCurrency: selectedRental.depositCurrency || '',
      depositStatus: selectedRental.depositStatus || 'pending',
      dailyRate:
        selectedRental.dailyRate != null && !Number.isNaN(Number(selectedRental.dailyRate))
          ? Number(selectedRental.dailyRate).toString()
          : '',
      rateCurrency: selectedRental.rateCurrency || ''
    });

    setAssociationForm({
      bookingId: selectedRental.booking?.id || selectedRental.bookingId || '',
      marketplaceItemId: selectedRental.marketplaceItemId || '',
      regionId: selectedRental.regionId || '',
      renterId: selectedRental.renterId || '',
      companyId: selectedRental.companyId || '',
      notes: selectedRental.meta?.notes || '',
      logisticsNotes: selectedRental.meta?.logisticsNotes || ''
    });
  }, [selectedRental]);

  const headerMeta = useMemo(() => {
    const total = listState.meta?.total ?? listState.data.length;
    const active =
      listState.meta?.active ?? listState.data.filter((entry) => entry.status !== 'settled' && entry.status !== 'cancelled').length;
    const depositSummary = listState.meta?.depositSummary ?? {};
    const held = depositSummary.held ?? 0;
    const pending = depositSummary.pending ?? 0;
    const released = depositSummary.released ?? 0;
    const forfeited = depositSummary.forfeited ?? 0;
    const depositParts = [`${held} held`, `${pending} pending`, `${released} released`];
    if (forfeited) {
      depositParts.push(`${forfeited} forfeited`);
    }

    return [
      {
        label: 'Total agreements',
        value: total.toLocaleString()
      },
      {
        label: 'Active agreements',
        value: active.toLocaleString(),
        caption: 'Requested, scheduled, in field, or pending inspection.'
      },
      {
        label: 'Deposit snapshot',
        value: depositParts.join(' • ')
      }
    ];
  }, [listState]);

  const filteredRentals = useMemo(() => {
    if (!debouncedSearch) {
      return listState.data;
    }
    return listState.data.filter((rental) => rentalMatchesSearch(rental, debouncedSearch));
  }, [listState.data, debouncedSearch]);

  const handleSelectRental = useCallback(
    (rentalId) => {
      if (demoMode) {
        const demoSelected = demoRentals.find((entry) => entry.id === rentalId) ?? null;
        setSelectedState({ loading: false, data: demoSelected, error: null });
      }
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (!rentalId) {
          next.delete('rental');
        } else {
          next.set('rental', rentalId);
        }
        return next;
      });
    },
    [demoMode, demoRentals, setSearchParams]
  );

  const handleCreateRental = async (event) => {
    event.preventDefault();
    setCreateStatus({ loading: true, error: null, success: null });
    if (demoMode) {
      const now = Date.now();
      const rentalId = `demo-rental-${now}`;
      const rentalNumber = `RA-DEMO-${now.toString(36).toUpperCase()}`;
      const quantity = Number.parseInt(createForm.quantity, 10) || 1;
      const rentalStartAtIso = createForm.rentalStartAt ? new Date(createForm.rentalStartAt).toISOString() : null;
      const rentalEndAtIso = createForm.rentalEndAt ? new Date(createForm.rentalEndAt).toISOString() : null;
      const timeline = [
        createDemoTimelineEntry('status_change', 'Rental requested (demo)', {
          notes: createForm.notes.trim() || undefined,
          quantity
        })
      ];
      const newRental = ensureLatestCheckpoint({
        id: rentalId,
        rentalNumber,
        status: 'requested',
        depositStatus: 'pending',
        quantity,
        rentalStartAt: rentalStartAtIso,
        rentalEndAt: rentalEndAtIso,
        pickupAt: null,
        returnDueAt: null,
        returnedAt: null,
        depositAmount: null,
        depositCurrency: null,
        dailyRate: null,
        rateCurrency: null,
        companyId: 'demo-company-new',
        renterId: createForm.renterId.trim() || 'demo-renter-new',
        bookingId: createForm.bookingId.trim() || null,
        marketplaceItemId: createForm.marketplaceItemId.trim() || null,
        itemId: createForm.itemId.trim() || null,
        meta: {
          notes: createForm.notes.trim() || null,
          logisticsNotes: null
        },
        item: createForm.itemId
          ? {
              id: createForm.itemId.trim(),
              name: 'Requested asset',
              sku: createForm.itemId.trim(),
              rentalRate: null,
              rentalRateCurrency: null,
              depositAmount: null,
              depositCurrency: null,
              metadata: {}
            }
          : null,
        booking: createForm.bookingId
          ? {
              id: createForm.bookingId.trim(),
              status: 'requested',
              scheduledStart: rentalStartAtIso,
              scheduledEnd: rentalEndAtIso,
              totalAmount: null,
              currency: null,
              reference: createForm.bookingId.trim()
            }
          : null,
        timeline
      });

      setDemoRentals((current) => [newRental, ...current]);
      setStatusFilter('all');
      setSearchTerm('');
      setDebouncedSearch('');
      setCreateForm(DEFAULT_CREATE_FORM);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('rental', rentalId);
        return next;
      });
      setTimeout(() => {
        setCreateStatus({
          loading: false,
          error: null,
          success: 'Rental agreement created successfully (demo).'
        });
      }, 300);
      return;
    }
    try {
      const payload = {
        itemId: createForm.itemId.trim(),
        renterId: createForm.renterId.trim(),
        bookingId: createForm.bookingId.trim() || undefined,
        marketplaceItemId: createForm.marketplaceItemId.trim() || undefined,
        quantity: Number.parseInt(createForm.quantity, 10) || 1,
        rentalStart: createForm.rentalStartAt ? new Date(createForm.rentalStartAt).toISOString() : undefined,
        rentalEnd: createForm.rentalEndAt ? new Date(createForm.rentalEndAt).toISOString() : undefined,
        notes: createForm.notes.trim() || undefined
      };

      const response = await createAdminRental(payload);
      const rental = response?.data;
      setCreateStatus({ loading: false, error: null, success: 'Rental agreement created successfully.' });
      setCreateForm(DEFAULT_CREATE_FORM);
      setStatusFilter('all');
      setSearchTerm('');
      setDebouncedSearch('');
      reloadList();
      if (rental?.id) {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.set('rental', rental.id);
          return next;
        });
        reloadSelected();
      }
    } catch (error) {
      setCreateStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to create rental agreement.',
        success: null
      });
    }
  };

  const runAction = async (actionKey, executor, successMessage, demoUpdater) => {
    if (!selectedRental) return;
    const rentalId = selectedRental.id;
    setActionLoading(actionKey);
    setDetailStatus(null);
    if (demoMode) {
      setTimeout(() => {
        if (demoUpdater && rentalId) {
          setDemoRentals((current) =>
            updateDemoRentalCollection(current, rentalId, (draft) => {
              demoUpdater(draft);
              return draft;
            })
          );
        }
        setActionLoading(null);
        setDetailStatus({ tone: 'success', message: `${successMessage} (demo)` });
      }, 250);
      return;
    }
    try {
      await executor();
      setDetailStatus({ tone: 'success', message: successMessage });
      setActionLoading(null);
      reloadList();
      reloadSelected();
    } catch (error) {
      setActionLoading(null);
      setDetailStatus({
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Action failed. Please try again.'
      });
    }
  };

  const handleApprove = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    const approvalNotes = approveForm.notes.trim();
    runAction(
      'approve',
      () => approveAdminRental(selectedRental.id, { approvalNotes: approvalNotes || undefined }),
      'Rental approved successfully.',
      (draft) => {
        draft.status = 'approved';
        draft.depositStatus = draft.depositStatus || 'held';
        draft.approvedAt = new Date().toISOString();
        draft.meta = {
          ...draft.meta,
          approvalNotes: approvalNotes || draft.meta?.approvalNotes || null
        };
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('status_change', 'Rental approved (demo)', {
            notes: approvalNotes || undefined
          })
        );
        return draft;
      }
    );
  };

  const handleSchedule = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    const pickupAtIso = pickupForm.pickupAt ? new Date(pickupForm.pickupAt).toISOString() : null;
    const returnDueAtIso = pickupForm.returnDueAt ? new Date(pickupForm.returnDueAt).toISOString() : null;
    const logisticsNotes = pickupForm.logisticsNotes.trim();
    runAction(
      'schedule',
      () =>
        scheduleAdminRentalPickup(selectedRental.id, {
          pickupAt: pickupAtIso || undefined,
          returnDueAt: returnDueAtIso || undefined,
          logisticsNotes: logisticsNotes || undefined
        }),
      'Pickup window scheduled. Logistics updated.',
      (draft) => {
        draft.status = 'pickup_scheduled';
        draft.pickupAt = pickupAtIso;
        draft.returnDueAt = returnDueAtIso;
        draft.meta = {
          ...draft.meta,
          logisticsNotes: logisticsNotes || draft.meta?.logisticsNotes || null
        };
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('handover', 'Pickup scheduled (demo)', {
            pickupAt: pickupAtIso,
            returnDueAt: returnDueAtIso,
            logisticsNotes: logisticsNotes || undefined
          })
        );
        return draft;
      }
    );
  };

  const handleCheckout = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    const conditionOut = {};
    if (checkoutForm.conditionNotes.trim()) {
      conditionOut.notes = checkoutForm.conditionNotes.trim();
    }
    const images = parseList(checkoutForm.conditionImages);
    if (images.length) {
      conditionOut.images = images;
    }

    const rentalStartAtIso = checkoutForm.rentalStartAt
      ? new Date(checkoutForm.rentalStartAt).toISOString()
      : null;
    const handoverNotes = checkoutForm.handoverNotes.trim();
    runAction(
      'checkout',
      () =>
        checkoutAdminRental(selectedRental.id, {
          rentalStartAt: rentalStartAtIso || undefined,
          conditionOut,
          handoverNotes: handoverNotes || undefined
        }),
      'Rental checked out. Usage tracking started.',
      (draft) => {
        draft.status = 'in_use';
        if (rentalStartAtIso) {
          draft.rentalStartAt = rentalStartAtIso;
        }
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('handover', 'Rental checked out (demo)', {
            conditionOut: Object.keys(conditionOut).length ? conditionOut : undefined,
            handoverNotes: handoverNotes || undefined
          })
        );
        return draft;
      }
    );
  };

  const handleReturn = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    const conditionIn = {};
    if (returnForm.conditionNotes.trim()) {
      conditionIn.notes = returnForm.conditionNotes.trim();
    }
    const images = parseList(returnForm.conditionImages);
    if (images.length) {
      conditionIn.images = images;
    }

    const returnedAtIso = returnForm.returnedAt ? new Date(returnForm.returnedAt).toISOString() : new Date().toISOString();
    const returnNotes = returnForm.notes.trim();
    runAction(
      'return',
      () =>
        markAdminRentalReturned(selectedRental.id, {
          returnedAt: returnForm.returnedAt ? returnedAtIso : undefined,
          conditionIn,
          notes: returnNotes || undefined
        }),
      'Rental marked as returned. Inspection queue updated.',
      (draft) => {
        draft.status = 'inspection_pending';
        draft.returnedAt = returnedAtIso;
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('return', 'Rental returned (demo)', {
            conditionIn: Object.keys(conditionIn).length ? conditionIn : undefined,
            notes: returnNotes || undefined
          })
        );
        return draft;
      }
    );
  };

  const performUpdate = async (sectionKey, payload, successMessage, demoMutator) => {
    if (!selectedRental) return;
    const rentalId = selectedRental.id;
    setUpdateStatus((current) => ({
      ...current,
      [sectionKey]: { loading: true, notice: null }
    }));
    if (demoMode) {
      setTimeout(() => {
        if (demoMutator && rentalId) {
          setDemoRentals((current) =>
            updateDemoRentalCollection(current, rentalId, (draft) => {
              demoMutator(draft);
              return draft;
            })
          );
        }
        setUpdateStatus((current) => ({
          ...current,
          [sectionKey]: { loading: false, notice: { tone: 'success', message: `${successMessage} (demo)` } }
        }));
      }, 200);
      return;
    }
    try {
      await updateAdminRental(selectedRental.id, payload);
      setUpdateStatus((current) => ({
        ...current,
        [sectionKey]: { loading: false, notice: { tone: 'success', message: successMessage } }
      }));
      reloadList();
      reloadSelected();
    } catch (error) {
      setUpdateStatus((current) => ({
        ...current,
        [sectionKey]: {
          loading: false,
          notice: {
            tone: 'danger',
            message: error instanceof Error ? error.message : 'Unable to update rental details.'
          }
        }
      }));
    }
  };

  const handleUpdateSchedule = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    const rentalStartAtIso = scheduleForm.rentalStartAt ? new Date(scheduleForm.rentalStartAt).toISOString() : null;
    const rentalEndAtIso = scheduleForm.rentalEndAt ? new Date(scheduleForm.rentalEndAt).toISOString() : null;
    const pickupAtIso = scheduleForm.pickupAt ? new Date(scheduleForm.pickupAt).toISOString() : null;
    const returnDueAtIso = scheduleForm.returnDueAt ? new Date(scheduleForm.returnDueAt).toISOString() : null;
    performUpdate(
      'schedule',
      {
        rentalStartAt: rentalStartAtIso,
        rentalEndAt: rentalEndAtIso,
        pickupAt: pickupAtIso,
        returnDueAt: returnDueAtIso
      },
      'Scheduling windows updated.',
      (draft) => {
        draft.rentalStartAt = rentalStartAtIso;
        draft.rentalEndAt = rentalEndAtIso;
        draft.pickupAt = pickupAtIso;
        draft.returnDueAt = returnDueAtIso;
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('schedule_update', 'Schedule updated (demo)', {
            rentalStartAt: rentalStartAtIso,
            rentalEndAt: rentalEndAtIso,
            pickupAt: pickupAtIso,
            returnDueAt: returnDueAtIso
          })
        );
        return draft;
      }
    );
  };

  const handleUpdateFinancial = (event) => {
    event.preventDefault();
    if (!selectedRental) return;

    const depositAmountValue = toNumberOrNull(financialForm.depositAmount);
    if (Number.isNaN(depositAmountValue)) {
      setUpdateStatus((current) => ({
        ...current,
        financial: {
          loading: false,
          notice: { tone: 'danger', message: 'Deposit amount must be a valid number.' }
        }
      }));
      return;
    }

    const dailyRateValue = toNumberOrNull(financialForm.dailyRate);
    if (Number.isNaN(dailyRateValue)) {
      setUpdateStatus((current) => ({
        ...current,
        financial: {
          loading: false,
          notice: { tone: 'danger', message: 'Daily rate must be a valid number.' }
        }
      }));
      return;
    }

    performUpdate(
      'financial',
      {
        depositAmount: depositAmountValue,
        depositCurrency: financialForm.depositCurrency || null,
        depositStatus: financialForm.depositStatus || null,
        dailyRate: dailyRateValue,
        rateCurrency: financialForm.rateCurrency || null
      },
      'Financial settings updated.',
      (draft) => {
        draft.depositAmount = depositAmountValue;
        draft.depositCurrency = financialForm.depositCurrency || null;
        draft.depositStatus = financialForm.depositStatus || null;
        draft.dailyRate = dailyRateValue;
        draft.rateCurrency = financialForm.rateCurrency || null;
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('financial_update', 'Financial settings updated (demo)', {
            depositAmount: depositAmountValue,
            depositCurrency: financialForm.depositCurrency || null,
            depositStatus: financialForm.depositStatus || null,
            dailyRate: dailyRateValue,
            rateCurrency: financialForm.rateCurrency || null
          })
        );
        return draft;
      }
    );
  };

  const handleUpdateAssociations = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    const notes = associationForm.notes;
    const logisticsNotes = associationForm.logisticsNotes;
    performUpdate(
      'associations',
      {
        bookingId: associationForm.bookingId || null,
        marketplaceItemId: associationForm.marketplaceItemId || null,
        regionId: associationForm.regionId || null,
        renterId: associationForm.renterId || null,
        companyId: associationForm.companyId || null,
        notes: associationForm.notes,
        logisticsNotes: associationForm.logisticsNotes
      },
      'Associations and notes updated.',
      (draft) => {
        draft.bookingId = associationForm.bookingId || null;
        draft.marketplaceItemId = associationForm.marketplaceItemId || null;
        draft.regionId = associationForm.regionId || null;
        draft.renterId = associationForm.renterId || null;
        draft.companyId = associationForm.companyId || null;
        draft.meta = {
          ...draft.meta,
          notes: notes || null,
          logisticsNotes: logisticsNotes || null
        };
        if (draft.booking) {
          draft.booking.id = associationForm.bookingId || null;
        } else if (associationForm.bookingId) {
          draft.booking = {
            id: associationForm.bookingId,
            status: 'linked'
          };
        }
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('association_update', 'Associations updated (demo)', {
            bookingId: associationForm.bookingId || null,
            marketplaceItemId: associationForm.marketplaceItemId || null,
            regionId: associationForm.regionId || null,
            renterId: associationForm.renterId || null,
            companyId: associationForm.companyId || null
          })
        );
        return draft;
      }
    );
  };

  const handleInspection = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    const inspectionNotes = inspectionForm.inspectionNotes.trim();
    const outcome = inspectionForm.outcome;
    const charges = inspectionForm.charges
      .filter((charge) => charge && (charge.label || charge.amount))
      .map((charge) => ({
        label: charge.label?.trim() || undefined,
        description: charge.description?.trim() || undefined,
        amount: charge.amount !== undefined && charge.amount !== '' ? Number(charge.amount) : undefined,
        currency: charge.currency?.trim() || undefined
      }));

    runAction(
      'inspection',
      () =>
        inspectAdminRental(selectedRental.id, {
          outcome: inspectionForm.outcome,
          inspectionNotes: inspectionNotes || undefined,
          charges
        }),
      'Inspection completed. Deposit instructions updated.',
      (draft) => {
        const nextStatus = outcome === 'clear' ? 'settled' : 'disputed';
        draft.status = nextStatus;
        draft.depositStatus =
          outcome === 'clear' ? 'released' : charges.length > 0 ? 'forfeited' : draft.depositStatus || 'held';
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('inspection', 'Inspection recorded (demo)', {
            outcome,
            inspectionNotes: inspectionNotes || undefined,
            charges: charges.length ? charges : undefined
          })
        );
        return draft;
      }
    );
  };

  const handleCancel = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    const reason = cancelForm.reason.trim();
    runAction(
      'cancel',
      () =>
        cancelAdminRental(selectedRental.id, {
          reason: reason || undefined
        }),
      'Rental cancelled. Inventory reservation released.',
      (draft) => {
        draft.status = 'cancelled';
        draft.depositStatus = draft.depositStatus === 'held' ? 'released' : draft.depositStatus;
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry('status_change', 'Rental cancelled (demo)', {
            reason: reason || undefined
          })
        );
        return draft;
      }
    );
  };

  const handleCheckpoint = (event) => {
    event.preventDefault();
    if (!selectedRental) return;
    if (!checkpointForm.description.trim()) {
      setDetailStatus({ tone: 'warning', message: 'Checkpoint description is required.' });
      return;
    }
    const payload = {};
    if (checkpointForm.notes.trim()) {
      payload.notes = checkpointForm.notes.trim();
    }
    const images = parseList(checkpointForm.images);
    if (images.length) {
      payload.images = images;
    }

    runAction(
      'checkpoint',
      () =>
        addAdminRentalCheckpoint(selectedRental.id, {
          type: checkpointForm.type,
          description: checkpointForm.description.trim(),
          payload
        }),
      'Checkpoint recorded. Timeline synced.',
      (draft) => {
        draft.timeline = draft.timeline || [];
        draft.timeline.push(
          createDemoTimelineEntry(checkpointForm.type, `${toFriendlyLabel(checkpointForm.type)} added (demo)`, {
            description: checkpointForm.description.trim(),
            ...payload
          })
        );
        return draft;
      }
    );
  };

  const handleOpenNewWindow = () => {
    if (!selectedRental) return;
    const url = `/admin/rentals?rental=${encodeURIComponent(selectedRental.id)}`;
    window.open(url, '_blank', 'noopener');
  };

  const canApprove = selectedRental?.status === 'requested';
  const canSchedule = selectedRental && ['approved', 'pickup_scheduled'].includes(selectedRental.status);
  const canCheckout = selectedRental && ['approved', 'pickup_scheduled'].includes(selectedRental.status);
  const canReturn = selectedRental?.status === 'in_use';
  const canInspect = selectedRental?.status === 'inspection_pending';
  const canCancel = selectedRental && ['requested', 'approved', 'pickup_scheduled'].includes(selectedRental.status);

  return {
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    listState,
    headerMeta,
    filteredRentals,
    selectedRental,
    selectedRentalId,
    selectedState,
    actionLoading,
    detailStatus,
    clearDetailStatus: () => setDetailStatus(null),
    createForm,
    setCreateForm,
    createStatus,
    handleCreateRental,
    approveForm,
    setApproveForm,
    pickupForm,
    setPickupForm,
    checkoutForm,
    setCheckoutForm,
    returnForm,
    setReturnForm,
    inspectionForm,
    setInspectionForm,
    cancelForm,
    setCancelForm,
    checkpointForm,
    setCheckpointForm,
    scheduleForm,
    setScheduleForm,
    financialForm,
    setFinancialForm,
    associationForm,
    setAssociationForm,
    updateStatus,
    handleApprove,
    handleSchedule,
    handleCheckout,
    handleReturn,
    handleInspection,
    handleCancel,
    handleCheckpoint,
    handleUpdateSchedule,
    handleUpdateFinancial,
    handleUpdateAssociations,
    handleSelectRental,
    reloadList,
    reloadSelected,
    handleOpenNewWindow,
    canApprove,
    canSchedule,
    canCheckout,
    canReturn,
    canInspect,
    canCancel
  };
}

export default useAdminRentalWorkspace;
