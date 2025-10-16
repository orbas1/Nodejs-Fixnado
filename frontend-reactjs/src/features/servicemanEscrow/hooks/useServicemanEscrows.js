import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchServicemanEscrows,
  fetchServicemanEscrow,
  updateServicemanEscrow,
  createServicemanEscrowNote,
  deleteServicemanEscrowNote,
  upsertServicemanEscrowMilestone,
  deleteServicemanEscrowMilestone,
  createServicemanWorkLog,
  updateServicemanWorkLog,
  deleteServicemanWorkLog
} from '../../../api/servicemanEscrowClient.js';
import { createEmptyMilestone } from '../../escrowManagement/constants.js';
import { toIsoString, toLocalDateTimeInput } from '../../escrowManagement/utils/formatters.js';

const DEFAULT_FILTERS = {
  status: 'all',
  onHold: 'all',
  policyId: 'all',
  search: ''
};

function normaliseAmountInput(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function useServicemanEscrows({ initialSelectionId = null } = {}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [listPayload, setListPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(initialSelectionId);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [detailDraft, setDetailDraft] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [milestoneDraft, setMilestoneDraft] = useState(createEmptyMilestone());
  const [noteSaving, setNoteSaving] = useState(false);
  const [workLogSaving, setWorkLogSaving] = useState(false);
  const [page, setPageState] = useState(1);

  const loadList = useCallback(
    async ({ focusId } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchServicemanEscrows({
          status: filters.status,
          onHold: filters.onHold,
          policyId: filters.policyId,
          search: filters.search,
          page
        });
        setListPayload(payload);
        if (payload?.pagination?.page) {
          setPageState(payload.pagination.page);
        }
        if (!payload.items?.length) {
          setSelectedId(null);
          setSelected(null);
          setDetailDraft(null);
        } else {
          setSelectedId((current) => {
            if (focusId) {
              return focusId;
            }
            if (current && payload.items.some((item) => item.id === current)) {
              return current;
            }
            return payload.items[0]?.id ?? null;
          });
        }
        return payload;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Unable to load escrows';
        setError(message);
        setListPayload(null);
        setSelectedId(null);
        setSelected(null);
        setDetailDraft(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [filters, page]
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setSelected(null);
      setDetailDraft(null);
      return null;
    }
    setSelectedLoading(true);
    try {
      const record = await fetchServicemanEscrow(id);
      setSelected(record);
      setDetailDraft({
        status: record.status,
        requiresDualApproval: Boolean(record.requiresDualApproval),
        amount: record.amount != null ? String(record.amount) : '',
        currency: record.currency ?? '',
        policyId: record.policyId ?? '',
        autoReleaseAt: toLocalDateTimeInput(record.autoReleaseAt),
        fundedAt: toLocalDateTimeInput(record.fundedAt),
        releasedAt: toLocalDateTimeInput(record.releasedAt),
        onHold: Boolean(record.onHold),
        holdReason: record.holdReason ?? '',
        externalReference: record.externalReference ?? ''
      });
      return record;
    } catch (caught) {
      console.error('Failed to load serviceman escrow', caught);
      return null;
    } finally {
      setSelectedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
      setMilestoneDraft(createEmptyMilestone());
    } else {
      setSelected(null);
      setDetailDraft(null);
    }
  }, [selectedId, loadDetail]);

  const updateFilter = useCallback((field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPageState(1);
  }, []);

  const setPage = useCallback((nextPage) => {
    setPageState((current) => {
      const numeric = Number.parseInt(nextPage, 10);
      if (!Number.isFinite(numeric) || numeric < 1) {
        return current;
      }
      return numeric;
    });
  }, []);

  const updateDetailField = useCallback((field, value) => {
    setDetailDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const saveDetails = useCallback(async () => {
    if (!selected) {
      return null;
    }
    setSavingDetails(true);
    try {
      const amountValue = normaliseAmountInput(detailDraft.amount);
      const payload = {
        status: detailDraft.status,
        requiresDualApproval: Boolean(detailDraft.requiresDualApproval),
        autoReleaseAt: detailDraft.autoReleaseAt ? toIsoString(detailDraft.autoReleaseAt) : null,
        fundedAt: detailDraft.fundedAt ? toIsoString(detailDraft.fundedAt) : null,
        releasedAt: detailDraft.releasedAt ? toIsoString(detailDraft.releasedAt) : null,
        onHold: Boolean(detailDraft.onHold),
        holdReason: detailDraft.onHold ? detailDraft.holdReason : null,
        externalReference: detailDraft.externalReference || null,
        policyId: detailDraft.policyId || null,
        currency: detailDraft.currency ? detailDraft.currency.trim() : null
      };
      if (amountValue !== null) {
        payload.amount = amountValue;
      }
      const updated = await updateServicemanEscrow(selected.id, payload);
      setSelected(updated);
      setDetailDraft({
        status: updated.status,
        requiresDualApproval: Boolean(updated.requiresDualApproval),
        amount: updated.amount != null ? String(updated.amount) : '',
        currency: updated.currency ?? '',
        policyId: updated.policyId ?? '',
        autoReleaseAt: toLocalDateTimeInput(updated.autoReleaseAt),
        fundedAt: toLocalDateTimeInput(updated.fundedAt),
        releasedAt: toLocalDateTimeInput(updated.releasedAt),
        onHold: Boolean(updated.onHold),
        holdReason: updated.holdReason ?? '',
        externalReference: updated.externalReference ?? ''
      });
      await loadList({ focusId: updated.id });
      return updated;
    } catch (caught) {
      console.error('Failed to update escrow details', caught);
      return null;
    } finally {
      setSavingDetails(false);
    }
  }, [detailDraft, loadList, selected]);

  const changeMilestoneDraft = useCallback((next) => {
    setMilestoneDraft(next);
  }, []);

  const changeMilestoneLocal = useCallback((next) => {
    setSelected((current) => {
      if (!current?.milestones) {
        return current;
      }
      return {
        ...current,
        milestones: current.milestones.map((item) => (item.id === next.id ? { ...item, ...next } : item))
      };
    });
  }, []);

  const refreshDetail = useCallback(async () => {
    if (!selectedId) {
      return null;
    }
    const record = await loadDetail(selectedId);
    if (record) {
      await loadList({ focusId: record.id });
    }
    return record;
  }, [loadDetail, loadList, selectedId]);

  const createMilestone = useCallback(
    async (payload) => {
      if (!selectedId) return null;
      const result = await upsertServicemanEscrowMilestone(selectedId, null, payload);
      setMilestoneDraft(createEmptyMilestone());
      if (result) {
        setSelected(result);
        setDetailDraft((current) => ({ ...current }));
        await loadList({ focusId: result.id });
      }
      return result;
    },
    [loadList, selectedId]
  );

  const updateMilestone = useCallback(
    async (milestoneId, payload) => {
      if (!selectedId || !milestoneId) return null;
      const result = await upsertServicemanEscrowMilestone(selectedId, milestoneId, payload);
      if (result) {
        setSelected(result);
        await loadList({ focusId: result.id });
      }
      return result;
    },
    [loadList, selectedId]
  );

  const removeMilestone = useCallback(
    async (milestoneId) => {
      if (!selectedId || !milestoneId) return null;
      const result = await deleteServicemanEscrowMilestone(selectedId, milestoneId);
      if (result) {
        setSelected(result);
        await loadList({ focusId: result.id });
      }
      return result;
    },
    [loadList, selectedId]
  );

  const addNote = useCallback(
    async ({ body, pinned }) => {
      if (!selectedId) return null;
      setNoteSaving(true);
      try {
        const result = await createServicemanEscrowNote(selectedId, { body, pinned });
        if (result) {
          setSelected(result);
          await loadList({ focusId: result.id });
        }
        return result;
      } catch (caught) {
        console.error('Failed to add note', caught);
        return null;
      } finally {
        setNoteSaving(false);
      }
    },
    [loadList, selectedId]
  );

  const removeNote = useCallback(
    async (noteId) => {
      if (!selectedId || !noteId) return null;
      try {
        const result = await deleteServicemanEscrowNote(selectedId, noteId);
        if (result) {
          setSelected(result);
          await loadList({ focusId: result.id });
        }
        return result;
      } catch (caught) {
        console.error('Failed to delete note', caught);
        return null;
      }
    },
    [loadList, selectedId]
  );

  const toggleNote = useCallback(
    async (note) => {
      if (!selectedId || !note?.id) return null;
      setNoteSaving(true);
      try {
        const result = await updateServicemanEscrow(selectedId, {
          notes: [{ id: note.id, pinned: !note.pinned }]
        });
        if (result) {
          setSelected(result);
          await loadList({ focusId: result.id });
        }
        return result;
      } catch (caught) {
        console.error('Failed to toggle note pin', caught);
        return null;
      } finally {
        setNoteSaving(false);
      }
    },
    [loadList, selectedId]
  );

  const createWorkLog = useCallback(
    async (payload) => {
      if (!selectedId) return null;
      setWorkLogSaving(true);
      try {
        const result = await createServicemanWorkLog(selectedId, payload);
        if (result) {
          setSelected(result);
          await loadList({ focusId: result.id });
        }
        return result;
      } catch (caught) {
        console.error('Failed to add work log', caught);
        return null;
      } finally {
        setWorkLogSaving(false);
      }
    },
    [loadList, selectedId]
  );

  const updateWorkLog = useCallback(
    async (workLogId, payload) => {
      if (!selectedId || !workLogId) return null;
      setWorkLogSaving(true);
      try {
        const result = await updateServicemanWorkLog(selectedId, workLogId, payload);
        if (result) {
          setSelected(result);
          await loadList({ focusId: result.id });
        }
        return result;
      } catch (caught) {
        console.error('Failed to update work log', caught);
        return null;
      } finally {
        setWorkLogSaving(false);
      }
    },
    [loadList, selectedId]
  );

  const deleteWorkLog = useCallback(
    async (workLogId) => {
      if (!selectedId || !workLogId) return null;
      setWorkLogSaving(true);
      try {
        const result = await deleteServicemanWorkLog(selectedId, workLogId);
        if (result) {
          setSelected(result);
          await loadList({ focusId: result.id });
        }
        return result;
      } catch (caught) {
        console.error('Failed to delete work log', caught);
        return null;
      } finally {
        setWorkLogSaving(false);
      }
    },
    [loadList, selectedId]
  );

  const summaryCards = useMemo(() => {
    const summary = listPayload?.summary;
    if (!summary) {
      return [];
    }
    return [
      {
        id: 'total',
        label: 'Escrow value',
        helper: `${listPayload?.items?.length ?? 0} records`,
        value: summary.totalAmountFormatted ?? '—'
      },
      {
        id: 'ready',
        label: 'Ready for release',
        helper: 'Funded and off hold',
        value: summary.readyForRelease ?? 0
      },
      {
        id: 'holds',
        label: 'On hold',
        helper: 'Requires review',
        value: summary.onHold ?? 0
      },
      {
        id: 'active',
        label: 'Active milestones',
        helper: 'Escrows with pending milestones',
        value: summary.active ?? 0
      }
    ];
  }, [listPayload]);

  const availablePolicies = useMemo(() => {
    const map = new Map();
    if (Array.isArray(listPayload?.policies)) {
      listPayload.policies.forEach((policy) => {
        if (policy?.id && !map.has(policy.id)) {
          map.set(policy.id, { id: policy.id, name: policy.name ?? policy.id });
        }
      });
    }
    if (Array.isArray(listPayload?.items)) {
      listPayload.items.forEach((item) => {
        if (item.policyId && !map.has(item.policyId)) {
          map.set(item.policyId, { id: item.policyId, name: item.policyId });
        }
      });
    }
    if (selected?.policyId && !map.has(selected.policyId)) {
      map.set(selected.policyId, { id: selected.policyId, name: selected.policyId });
    }
    return Array.from(map.values());
  }, [listPayload, selected]);

  const pagination = useMemo(() => {
    if (listPayload?.pagination) {
      return listPayload.pagination;
    }
    return { page, totalPages: 1, pageSize: 20, totalItems: listPayload?.items?.length ?? 0 };
  }, [listPayload, page]);

  return {
    filters,
    updateFilter,
    listPayload,
    loading,
    error,
    selectedId,
    setSelectedId,
    selected,
    selectedLoading,
    detailDraft,
    updateDetailField,
    saveDetails,
    savingDetails,
    milestoneDraft,
    changeMilestoneDraft,
    changeMilestoneLocal,
    createMilestone,
    updateMilestone,
    removeMilestone,
    addNote,
    removeNote,
    toggleNote,
    noteSaving,
    refreshList: loadList,
    refreshDetail,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    workLogSaving,
    summaryCards,
    availablePolicies,
    pagination,
    page,
    setPage
  };
}

export default useServicemanEscrows;
