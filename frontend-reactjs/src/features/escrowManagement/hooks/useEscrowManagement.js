import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addEscrowNoteRecord,
  createEscrow,
  deleteEscrowMilestoneRecord,
  deleteEscrowNoteRecord,
  fetchEscrow,
  fetchEscrows,
  updateEscrowRecord,
  upsertEscrowMilestoneRecord,
  fetchReleasePolicies,
  createReleasePolicyRecord,
  updateReleasePolicyRecord,
  deleteReleasePolicyRecord
} from '../../../api/adminEscrowClient.js';
import { createEmptyMilestone, createEmptyEscrowForm } from '../constants.js';
import { formatNumber, toIsoString, toLocalDateTimeInput } from '../utils/formatters.js';

const DEFAULT_FILTERS = { status: 'all', policyId: 'all', onHold: 'all', search: '' };
const DEFAULT_PAGINATION = { page: 1, pageSize: 20 };

export function useEscrowManagement() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [listPayload, setListPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [detailDraft, setDetailDraft] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [milestoneDraft, setMilestoneDraft] = useState(createEmptyMilestone());
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [createForm, setCreateForm] = useState(createEmptyEscrowForm());

  const loadEscrows = useCallback(
    async ({ focusId } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const query = {
          page: pagination.page,
          pageSize: pagination.pageSize
        };
        if (filters.status && filters.status !== 'all') {
          query.status = filters.status;
        }
        if (filters.policyId && filters.policyId !== 'all') {
          query.policyId = filters.policyId;
        }
        if (filters.onHold && filters.onHold !== 'all') {
          query.onHold = filters.onHold;
        }
        if (filters.search) {
          query.search = filters.search;
        }
        const payload = await fetchEscrows(query);
        setListPayload(payload);
        setPolicies(payload?.settings?.releasePolicies ?? []);
        if (!payload.items?.length) {
          setSelectedId(null);
          setSelected(null);
          setDetailDraft(null);
          return payload;
        }
        setSelectedId((current) => {
          if (focusId) {
            return focusId;
          }
          if (current && payload.items.some((item) => item.id === current)) {
            return current;
          }
          return payload.items[0]?.id ?? null;
        });
        return payload;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Unable to load escrow records';
        setError(message);
        setListPayload(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination]
  );

  useEffect(() => {
    loadEscrows();
  }, [loadEscrows]);

  const refreshPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    setPolicyError(null);
    try {
      const items = await fetchReleasePolicies();
      setPolicies(items ?? []);
      return items;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load release policies';
      setPolicyError(message);
      return null;
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPolicies();
  }, [refreshPolicies]);

  const loadEscrowDetail = useCallback(async (id) => {
    if (!id) {
      setSelected(null);
      setDetailDraft(null);
      return null;
    }
    setSelectedLoading(true);
    try {
      const record = await fetchEscrow(id);
      setSelected(record);
      setDetailDraft({
        status: record.status,
        amount: record.amount,
        currency: record.currency,
        policyId: record.policyId ?? '',
        requiresDualApproval: record.requiresDualApproval,
        autoReleaseAt: toLocalDateTimeInput(record.autoReleaseAt),
        fundedAt: toLocalDateTimeInput(record.fundedAt),
        releasedAt: toLocalDateTimeInput(record.releasedAt),
        onHold: record.onHold,
        holdReason: record.holdReason ?? '',
        externalReference: record.externalReference ?? ''
      });
      return record;
    } catch (caught) {
      console.error('Failed to load escrow', caught);
      return null;
    } finally {
      setSelectedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadEscrowDetail(selectedId);
      setMilestoneDraft(createEmptyMilestone());
    } else {
      setSelected(null);
      setDetailDraft(null);
    }
  }, [selectedId, loadEscrowDetail]);

  const updateFilter = useCallback((field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  }, []);

  const setPage = useCallback((page) => {
    setPagination((current) => ({ ...current, page: Math.max(1, page) }));
  }, []);

  const availablePolicies = useMemo(() => {
    if (Array.isArray(listPayload?.filters?.policies) && listPayload.filters.policies.length > 0) {
      return listPayload.filters.policies;
    }
    return policies.map((policy) => ({ id: policy.id, name: policy.name }));
  }, [listPayload, policies]);

  const headerMeta = useMemo(() => {
    if (!listPayload?.summary) {
      return [];
    }
    return [
      {
        label: 'Escrow under management',
        value: listPayload.summary.totalAmountFormatted ?? '—',
        caption: `${formatNumber(listPayload.pagination?.totalItems ?? 0)} active records`,
        emphasis: true
      },
      {
        label: 'Ready for release',
        value: formatNumber(listPayload.summary.readyForRelease ?? 0),
        caption: 'Funded and not on hold'
      },
      {
        label: 'On hold',
        value: formatNumber(listPayload.summary.onHold ?? 0),
        caption: 'Escrows paused for review'
      },
      {
        label: 'Disputes',
        value: formatNumber(listPayload.summary.disputed ?? 0),
        caption: 'Escrows with active disputes'
      }
    ];
  }, [listPayload]);

  const updateDetailField = useCallback((field, value) => {
    setDetailDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const saveDetails = useCallback(async () => {
    if (!selected) {
      return;
    }
    setSavingDetails(true);
    try {
      const payload = {
        status: detailDraft.status,
        amount: detailDraft.amount,
        currency: detailDraft.currency,
        policyId: detailDraft.policyId || null,
        requiresDualApproval: Boolean(detailDraft.requiresDualApproval),
        autoReleaseAt: detailDraft.autoReleaseAt ? toIsoString(detailDraft.autoReleaseAt) : null,
        fundedAt: detailDraft.fundedAt ? toIsoString(detailDraft.fundedAt) : null,
        releasedAt: detailDraft.releasedAt ? toIsoString(detailDraft.releasedAt) : null,
        onHold: Boolean(detailDraft.onHold),
        holdReason: detailDraft.onHold ? detailDraft.holdReason : null,
        externalReference: detailDraft.externalReference || null
      };
      await updateEscrowRecord(selected.id, payload);
      await loadEscrowDetail(selected.id);
      await loadEscrows();
    } catch (caught) {
      console.error('Failed to update escrow details', caught);
    } finally {
      setSavingDetails(false);
    }
  }, [detailDraft, selected, loadEscrowDetail, loadEscrows]);

  const addNote = useCallback(
    async (body, pinned) => {
      if (!selected) return;
      setNoteSaving(true);
      try {
        await addEscrowNoteRecord(selected.id, { body, pinned });
        await loadEscrowDetail(selected.id);
      } catch (caught) {
        console.error('Failed to add note', caught);
      } finally {
        setNoteSaving(false);
      }
    },
    [selected, loadEscrowDetail]
  );

  const deleteNote = useCallback(
    async (note) => {
      if (!selected) return;
      try {
        await deleteEscrowNoteRecord(selected.id, note.id);
        await loadEscrowDetail(selected.id);
      } catch (caught) {
        console.error('Failed to delete note', caught);
      }
    },
    [selected, loadEscrowDetail]
  );

  const toggleNotePin = useCallback(
    async (note) => {
      if (!selected) return;
      try {
        await updateEscrowRecord(selected.id, {
          notes: [
            {
              id: note.id,
              pinned: !note.pinned
            }
          ]
        });
        await loadEscrowDetail(selected.id);
      } catch (caught) {
        console.error('Failed to toggle note pin', caught);
      }
    },
    [selected, loadEscrowDetail]
  );

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
        milestones: current.milestones.map((item) => (item.id === next.id ? next : item))
      };
    });
  }, []);

  const persistMilestone = useCallback(
    async (milestone) => {
      if (!selected) return;
      try {
        await upsertEscrowMilestoneRecord(
          selected.id,
          {
            id: milestone.id,
            label: milestone.label,
            status: milestone.status,
            amount: milestone.amount,
            dueAt: milestone.dueAt,
            sequence: milestone.sequence
          },
          milestone.id
        );
        await loadEscrowDetail(selected.id);
      } catch (caught) {
        console.error('Failed to update milestone', caught);
      }
    },
    [selected, loadEscrowDetail]
  );

  const removeMilestone = useCallback(
    async (milestone) => {
      if (!selected) return;
      try {
        await deleteEscrowMilestoneRecord(selected.id, milestone.id);
        await loadEscrowDetail(selected.id);
      } catch (caught) {
        console.error('Failed to delete milestone', caught);
      }
    },
    [selected, loadEscrowDetail]
  );

  const createMilestone = useCallback(
    async (milestone) => {
      if (!selected) return;
      try {
        await upsertEscrowMilestoneRecord(selected.id, milestone);
        await loadEscrowDetail(selected.id);
        setMilestoneDraft(createEmptyMilestone());
      } catch (caught) {
        console.error('Failed to create milestone', caught);
      }
    },
    [selected, loadEscrowDetail]
  );

  const resetCreateForm = useCallback(() => {
    setCreateForm(createEmptyEscrowForm());
  }, []);

  const createPolicy = useCallback(
    async (payload) => {
      setPolicySaving(true);
      setPolicyError(null);
      try {
        const result = await createReleasePolicyRecord(payload ?? {});
        if (Array.isArray(result?.policies)) {
          setPolicies(result.policies);
        } else {
          await refreshPolicies();
        }
        await loadEscrows();
        return result?.policy ?? null;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Unable to save release policy';
        setPolicyError(message);
        return null;
      } finally {
        setPolicySaving(false);
      }
    },
    [loadEscrows, refreshPolicies]
  );

  const updatePolicy = useCallback(
    async (id, payload) => {
      if (!id) {
        return null;
      }
      setPolicySaving(true);
      setPolicyError(null);
      try {
        const result = await updateReleasePolicyRecord(id, payload ?? {});
        if (Array.isArray(result?.policies)) {
          setPolicies(result.policies);
        } else {
          await refreshPolicies();
        }
        await loadEscrows();
        return result?.policy ?? null;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Unable to update release policy';
        setPolicyError(message);
        return null;
      } finally {
        setPolicySaving(false);
      }
    },
    [loadEscrows, refreshPolicies]
  );

  const deletePolicy = useCallback(
    async (id) => {
      if (!id) {
        return false;
      }
      setPolicySaving(true);
      setPolicyError(null);
      try {
        const result = await deleteReleasePolicyRecord(id);
        if (Array.isArray(result?.policies)) {
          setPolicies(result.policies);
        } else {
          await refreshPolicies();
        }
        await loadEscrows();
        return true;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Unable to delete release policy';
        setPolicyError(message);
        return false;
      } finally {
        setPolicySaving(false);
      }
    },
    [loadEscrows, refreshPolicies]
  );

  const updateCreateField = useCallback((field, value) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  }, []);

  const updateCreateMilestone = useCallback((index, field, value) => {
    setCreateForm((current) => ({
      ...current,
      milestones: current.milestones.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    }));
  }, []);

  const addCreateMilestone = useCallback(() => {
    setCreateForm((current) => ({
      ...current,
      milestones: [...current.milestones, createEmptyMilestone()]
    }));
  }, []);

  const removeCreateMilestone = useCallback((index) => {
    setCreateForm((current) => ({
      ...current,
      milestones: current.milestones.filter((_, idx) => idx !== index)
    }));
  }, []);

  const submitCreateForm = useCallback(async () => {
    if (!createForm.orderId || !createForm.amount) {
      return null;
    }
    setCreatingRecord(true);
    try {
      const payload = {
        orderId: createForm.orderId.trim(),
        amount: Number.parseFloat(createForm.amount),
        currency: createForm.currency || 'GBP',
        policyId: createForm.policyId || undefined,
        requiresDualApproval: Boolean(createForm.requiresDualApproval),
        autoReleaseAt: createForm.autoReleaseAt ? toIsoString(createForm.autoReleaseAt) : null,
        note: createForm.note?.trim() || undefined,
        pinNote: createForm.pinNote,
        milestones: createForm.milestones
          .filter((milestone) => milestone.label?.trim())
          .map((milestone, index) => ({
            label: milestone.label.trim(),
            status: milestone.status,
            amount: milestone.amount ? Number.parseFloat(milestone.amount) : null,
            dueAt: milestone.dueAt ? milestone.dueAt : null,
            sequence: index + 1
          }))
      };
      const created = await createEscrow(payload);
      resetCreateForm();
      await loadEscrows({ focusId: created?.id });
      return created;
    } catch (caught) {
      console.error('Failed to create escrow', caught);
      return null;
    } finally {
      setCreatingRecord(false);
    }
  }, [createForm, loadEscrows, resetCreateForm]);

  return {
    filters,
    updateFilter,
    pagination,
    setPage,
    listPayload,
    loading,
    error,
    availablePolicies,
    headerMeta,
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
    createMilestone,
    changeMilestoneLocal,
    persistMilestone,
    removeMilestone,
    addNote,
    deleteNote,
    toggleNotePin,
    releasePolicies: policies,
    policiesLoading,
    policySaving,
    policyError,
    refreshPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    noteSaving,
    refreshList: loadEscrows,
    loadEscrowDetail,
    createForm,
    updateCreateField,
    updateCreateMilestone,
    addCreateMilestone,
    removeCreateMilestone,
    submitCreateForm,
    creatingRecord,
    resetCreateForm
  };
}
