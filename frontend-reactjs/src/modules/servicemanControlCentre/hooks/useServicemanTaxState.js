import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchTaxWorkspace,
  updateTaxProfile,
  listTaxFilings,
  createTaxFiling,
  updateTaxFiling,
  updateTaxFilingStatus,
  deleteTaxFiling,
  listTaxTasks,
  createTaxTask,
  updateTaxTask,
  updateTaxTaskStatus,
  deleteTaxTask,
  listTaxDocuments,
  createTaxDocument,
  updateTaxDocument,
  deleteTaxDocument
} from '../../../api/servicemanTaxClient.js';

const DEFAULT_SUMMARY = Object.freeze({
  filings: { total: 0, overdue: 0, amountDueTotal: 0, amountPaidTotal: 0, byStatus: {} },
  tasks: { total: 0, open: 0, overdue: 0, byStatus: {} },
  documents: { total: 0, byType: {} }
});

const DEFAULT_FILINGS = Object.freeze({ items: [], meta: { total: 0, overdue: 0 } });
const DEFAULT_TASKS = Object.freeze({ items: [], meta: { total: 0, open: 0, overdue: 0 } });
const DEFAULT_DOCUMENTS = Object.freeze({ items: [], meta: { total: 0 } });

const DEFAULT_METADATA = Object.freeze({
  filingStatuses: ['draft', 'pending', 'submitted', 'accepted', 'overdue', 'rejected', 'cancelled'],
  filingTypes: ['self_assessment', 'vat_return', 'cis', 'payroll', 'other'],
  submissionMethods: ['online', 'paper', 'agent', 'api', 'other'],
  remittanceCycles: ['monthly', 'quarterly', 'annually', 'ad_hoc'],
  profileFilingStatuses: ['sole_trader', 'limited_company', 'partnership', 'umbrella', 'other'],
  taskStatuses: ['planned', 'in_progress', 'blocked', 'completed'],
  taskPriorities: ['low', 'normal', 'high', 'urgent'],
  documentStatuses: ['active', 'archived', 'superseded'],
  documentTypes: ['evidence', 'receipt', 'correspondence', 'certificate', 'other']
});

const DEFAULT_PERMISSIONS = Object.freeze({
  canManageProfile: false,
  canManageFilings: false,
  canManageTasks: false,
  canManageDocuments: false
});

const unwrap = (payload) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload);

const buildProfileDraft = (profile = {}) => ({
  filingStatus: profile.filingStatus ?? 'sole_trader',
  residencyCountry: profile.residencyCountry ?? '',
  residencyRegion: profile.residencyRegion ?? '',
  vatRegistered: Boolean(profile.vatRegistered),
  vatNumber: profile.vatNumber ?? '',
  utrNumber: profile.utrNumber ?? '',
  companyNumber: profile.companyNumber ?? '',
  taxAdvisorName: profile.taxAdvisorName ?? '',
  taxAdvisorEmail: profile.taxAdvisorEmail ?? '',
  taxAdvisorPhone: profile.taxAdvisorPhone ?? '',
  remittanceCycle: profile.remittanceCycle ?? 'monthly',
  withholdingRate: profile.withholdingRate != null ? String(profile.withholdingRate) : '',
  lastFilingSubmittedAt: profile.lastFilingSubmittedAt ?? '',
  nextDeadlineAt: profile.nextDeadlineAt ?? '',
  notes: profile.notes ?? ''
});

const normaliseString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length ? trimmed : null;
};

const buildProfilePayload = (draft) => ({
  filingStatus: normaliseString(draft.filingStatus) ?? 'sole_trader',
  residencyCountry: draft.residencyCountry ? draft.residencyCountry.trim().toUpperCase() : null,
  residencyRegion: normaliseString(draft.residencyRegion),
  vatRegistered: Boolean(draft.vatRegistered),
  vatNumber: normaliseString(draft.vatNumber),
  utrNumber: normaliseString(draft.utrNumber),
  companyNumber: normaliseString(draft.companyNumber),
  taxAdvisorName: normaliseString(draft.taxAdvisorName),
  taxAdvisorEmail: normaliseString(draft.taxAdvisorEmail),
  taxAdvisorPhone: normaliseString(draft.taxAdvisorPhone),
  remittanceCycle: normaliseString(draft.remittanceCycle) ?? 'monthly',
  withholdingRate:
    draft.withholdingRate === '' || draft.withholdingRate === null
      ? null
      : Number.parseFloat(draft.withholdingRate),
  lastFilingSubmittedAt: normaliseString(draft.lastFilingSubmittedAt),
  nextDeadlineAt: normaliseString(draft.nextDeadlineAt),
  notes: normaliseString(draft.notes)
});

const normaliseWorkspace = (snapshot = {}) => ({
  context: snapshot.context ?? { servicemanId: null, serviceman: null },
  profile: snapshot.profile ?? null,
  summary: snapshot.summary
    ? {
        filings: { ...DEFAULT_SUMMARY.filings, ...(snapshot.summary.filings ?? {}) },
        tasks: { ...DEFAULT_SUMMARY.tasks, ...(snapshot.summary.tasks ?? {}) },
        documents: { ...DEFAULT_SUMMARY.documents, ...(snapshot.summary.documents ?? {}) }
      }
    : DEFAULT_SUMMARY,
  filings: snapshot.filings ?? DEFAULT_FILINGS,
  tasks: snapshot.tasks ?? DEFAULT_TASKS,
  documents: snapshot.documents ?? DEFAULT_DOCUMENTS,
  metadata: { ...DEFAULT_METADATA, ...(snapshot.metadata ?? {}) },
  permissions: { ...DEFAULT_PERMISSIONS, ...(snapshot.permissions ?? {}) }
});

export function useServicemanTaxState(initialSnapshot = {}) {
  const normalised = useMemo(() => normaliseWorkspace(initialSnapshot), [initialSnapshot]);
  const servicemanId = normalised.context?.servicemanId ?? null;

  const [workspace, setWorkspace] = useState(normalised);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [profileDraft, setProfileDraft] = useState(() => buildProfileDraft(normalised.profile));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [filings, setFilings] = useState(normalised.filings ?? DEFAULT_FILINGS);
  const [filingsLoading, setFilingsLoading] = useState(false);
  const [filingsError, setFilingsError] = useState(null);
  const [filingsFilters, setFilingsFilters] = useState({ status: 'all', search: '' });

  const [tasks, setTasks] = useState(normalised.tasks ?? DEFAULT_TASKS);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  const [tasksFilters, setTasksFilters] = useState({ status: 'all' });

  const [documents, setDocuments] = useState(normalised.documents ?? DEFAULT_DOCUMENTS);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [documentFilters, setDocumentFilters] = useState({ type: 'all', status: 'all' });

  useEffect(() => {
    setWorkspace(normalised);
    setProfileDraft(buildProfileDraft(normalised.profile));
    setFilings(normalised.filings ?? DEFAULT_FILINGS);
    setTasks(normalised.tasks ?? DEFAULT_TASKS);
    setDocuments(normalised.documents ?? DEFAULT_DOCUMENTS);
  }, [normalised]);

  const itemsLimitFromState = useCallback((collection) => {
    if (!collection?.items?.length) {
      return 10;
    }
    return Math.max(collection.items.length, 10);
  }, []);

  const refreshWorkspace = useCallback(
    async ({ limit = 10, silent = false } = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await fetchTaxWorkspace({ servicemanId, limit });
        const data = unwrap(response);
        const nextWorkspace = normaliseWorkspace(data);
        setWorkspace(nextWorkspace);
        setProfileDraft(buildProfileDraft(nextWorkspace.profile));
        setFilings(nextWorkspace.filings ?? DEFAULT_FILINGS);
        setTasks(nextWorkspace.tasks ?? DEFAULT_TASKS);
        setDocuments(nextWorkspace.documents ?? DEFAULT_DOCUMENTS);
        return { status: 'resolved', data: nextWorkspace };
      } catch (caught) {
        console.error('Failed to refresh serviceman tax workspace', caught);
        setError(caught);
        return { status: 'error', error: caught };
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [servicemanId]
  );

  const saveProfile = useCallback(
    async (draft) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setProfileSaving(true);
      setProfileFeedback(null);
      setProfileError(null);
      try {
        const payload = buildProfilePayload(draft ?? profileDraft);
        const response = await updateTaxProfile(payload, { servicemanId });
        const updated = unwrap(response);
        setWorkspace((current) => ({ ...current, profile: updated }));
        setProfileDraft(buildProfileDraft(updated));
        setProfileFeedback('Tax profile saved');
        setTimeout(() => setProfileFeedback(null), 4000);
        return { status: 'resolved', profile: updated };
      } catch (caught) {
        console.error('Failed to update serviceman tax profile', caught);
        setProfileError(caught);
        return { status: 'error', error: caught };
      } finally {
        setProfileSaving(false);
      }
    },
    [profileDraft, servicemanId]
  );

  const loadFilings = useCallback(
    async (overrides = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setFilingsLoading(true);
      setFilingsError(null);
      try {
        const params = {
          servicemanId,
          status: overrides.status ?? filingsFilters.status,
          search: overrides.search ?? filingsFilters.search,
          limit: overrides.limit,
          offset: overrides.offset
        };
        const response = await listTaxFilings(params);
        setFilings({
          items: response.items ?? [],
          meta: response.meta ?? { total: 0 }
        });
        return { status: 'resolved', data: response };
      } catch (caught) {
        console.error('Failed to load serviceman tax filings', caught);
        setFilingsError(caught);
        return { status: 'error', error: caught };
      } finally {
        setFilingsLoading(false);
      }
    },
    [servicemanId, filingsFilters]
  );

  const loadTasks = useCallback(
    async (overrides = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setTasksLoading(true);
      setTasksError(null);
      try {
        const params = {
          servicemanId,
          status: overrides.status ?? tasksFilters.status,
          limit: overrides.limit,
          offset: overrides.offset
        };
        const response = await listTaxTasks(params);
        setTasks({ items: response.items ?? [], meta: response.meta ?? { total: 0 } });
        return { status: 'resolved', data: response };
      } catch (caught) {
        console.error('Failed to load serviceman tax tasks', caught);
        setTasksError(caught);
        return { status: 'error', error: caught };
      } finally {
        setTasksLoading(false);
      }
    },
    [servicemanId, tasksFilters]
  );

  const loadDocuments = useCallback(
    async (overrides = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      setDocumentsLoading(true);
      setDocumentsError(null);
      try {
        const params = {
          servicemanId,
          type: overrides.type ?? documentFilters.type,
          status: overrides.status ?? documentFilters.status,
          limit: overrides.limit,
          offset: overrides.offset
        };
        const response = await listTaxDocuments(params);
        setDocuments({ items: response.items ?? [], meta: response.meta ?? { total: 0 } });
        return { status: 'resolved', data: response };
      } catch (caught) {
        console.error('Failed to load serviceman tax documents', caught);
        setDocumentsError(caught);
        return { status: 'error', error: caught };
      } finally {
        setDocumentsLoading(false);
      }
    },
    [servicemanId, documentFilters]
  );

  const upsertFiling = useCallback(
    async (draft, { silentRefresh = true } = {}) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      const isUpdate = Boolean(draft?.id);
      try {
        const response = isUpdate
          ? await updateTaxFiling(draft.id, draft, { servicemanId })
          : await createTaxFiling(draft, { servicemanId });
        const result = unwrap(response);
        setFilings((current) => {
          const items = isUpdate
            ? current.items.map((item) => (item.id === result.id ? result : item))
            : [result, ...current.items];
          const meta = {
            total: isUpdate ? current.meta?.total ?? items.length : (current.meta?.total ?? 0) + 1,
            overdue: current.meta?.overdue ?? workspace.summary.filings.overdue ?? 0
          };
          return { items, meta };
        });
        if (silentRefresh) {
          refreshWorkspace({ limit: itemsLimitFromState(filings), silent: true });
        }
        return { status: 'resolved', filing: result };
      } catch (caught) {
        console.error('Failed to upsert serviceman tax filing', caught);
        throw caught;
      }
    },
    [filings, itemsLimitFromState, refreshWorkspace, servicemanId, workspace.summary.filings.overdue]
  );

  const adjustSummaryAfterDelete = useCallback(() => {
    setWorkspace((current) => ({
      ...current,
      summary: {
        ...current.summary,
        filings: {
          ...current.summary.filings,
          total: Math.max((current.summary.filings.total ?? 1) - 1, 0)
        }
      }
    }));
  }, []);

  const removeFiling = useCallback(
    async (filingId) => {
      if (!servicemanId || !filingId) {
        return { status: 'skipped' };
      }
      await deleteTaxFiling(filingId, { servicemanId });
      setFilings((current) => ({
        items: current.items.filter((item) => item.id !== filingId),
        meta: {
          total: Math.max((current.meta?.total ?? current.items.length) - 1, 0),
          overdue: current.meta?.overdue ?? workspace.summary.filings.overdue ?? 0
        }
      }));
      adjustSummaryAfterDelete();
      refreshWorkspace({ limit: itemsLimitFromState(filings), silent: true });
      return { status: 'resolved' };
    },
    [adjustSummaryAfterDelete, filings, itemsLimitFromState, refreshWorkspace, servicemanId, workspace.summary.filings.overdue]
  );

  const changeFilingStatus = useCallback(
    async (filingId, payload) => {
      if (!servicemanId || !filingId) {
        return { status: 'skipped' };
      }
      const response = await updateTaxFilingStatus(filingId, payload, { servicemanId });
      const result = unwrap(response);
      setFilings((current) => ({
        items: current.items.map((item) => (item.id === result.id ? result : item)),
        meta: current.meta ?? { total: current.items.length }
      }));
      refreshWorkspace({ limit: itemsLimitFromState(filings), silent: true });
      return { status: 'resolved', filing: result };
    },
    [filings, itemsLimitFromState, refreshWorkspace, servicemanId]
  );

  const upsertTask = useCallback(
    async (draft) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      const isUpdate = Boolean(draft?.id);
      const response = isUpdate
        ? await updateTaxTask(draft.id, draft, { servicemanId })
        : await createTaxTask(draft, { servicemanId });
      const result = unwrap(response);
      setTasks((current) => ({
        items: isUpdate
          ? current.items.map((item) => (item.id === result.id ? result : item))
          : [result, ...current.items],
        meta: {
          total: isUpdate ? current.meta?.total ?? current.items.length : (current.meta?.total ?? 0) + 1,
          open: current.meta?.open ?? workspace.summary.tasks.open ?? 0,
          overdue: current.meta?.overdue ?? workspace.summary.tasks.overdue ?? 0
        }
      }));
      refreshWorkspace({ limit: itemsLimitFromState(tasks), silent: true });
      return { status: 'resolved', task: result };
    },
    [itemsLimitFromState, refreshWorkspace, servicemanId, tasks, workspace.summary.tasks.open, workspace.summary.tasks.overdue]
  );

  const removeTask = useCallback(
    async (taskId) => {
      if (!servicemanId || !taskId) {
        return { status: 'skipped' };
      }
      await deleteTaxTask(taskId, { servicemanId });
      setTasks((current) => ({
        items: current.items.filter((item) => item.id !== taskId),
        meta: {
          total: Math.max((current.meta?.total ?? current.items.length) - 1, 0),
          open: current.meta?.open ?? workspace.summary.tasks.open ?? 0,
          overdue: current.meta?.overdue ?? workspace.summary.tasks.overdue ?? 0
        }
      }));
      refreshWorkspace({ limit: itemsLimitFromState(tasks), silent: true });
      return { status: 'resolved' };
    },
    [itemsLimitFromState, refreshWorkspace, servicemanId, tasks, workspace.summary.tasks.open, workspace.summary.tasks.overdue]
  );

  const changeTaskStatus = useCallback(
    async (taskId, payload) => {
      if (!servicemanId || !taskId) {
        return { status: 'skipped' };
      }
      const response = await updateTaxTaskStatus(taskId, payload, { servicemanId });
      const result = unwrap(response);
      setTasks((current) => ({
        items: current.items.map((item) => (item.id === result.id ? result : item)),
        meta: current.meta ?? { total: current.items.length }
      }));
      refreshWorkspace({ limit: itemsLimitFromState(tasks), silent: true });
      return { status: 'resolved', task: result };
    },
    [itemsLimitFromState, refreshWorkspace, servicemanId, tasks]
  );

  const upsertDocument = useCallback(
    async (draft) => {
      if (!servicemanId) {
        return { status: 'skipped' };
      }
      const isUpdate = Boolean(draft?.id);
      const response = isUpdate
        ? await updateTaxDocument(draft.id, draft, { servicemanId })
        : await createTaxDocument(draft, { servicemanId });
      const result = unwrap(response);
      setDocuments((current) => ({
        items: isUpdate
          ? current.items.map((item) => (item.id === result.id ? result : item))
          : [result, ...current.items],
        meta: {
          total: isUpdate ? current.meta?.total ?? current.items.length : (current.meta?.total ?? 0) + 1
        }
      }));
      refreshWorkspace({ limit: itemsLimitFromState(documents), silent: true });
      return { status: 'resolved', document: result };
    },
    [documents, itemsLimitFromState, refreshWorkspace, servicemanId]
  );

  const removeDocument = useCallback(
    async (documentId) => {
      if (!servicemanId || !documentId) {
        return { status: 'skipped' };
      }
      await deleteTaxDocument(documentId, { servicemanId });
      setDocuments((current) => ({
        items: current.items.filter((item) => item.id !== documentId),
        meta: {
          total: Math.max((current.meta?.total ?? current.items.length) - 1, 0)
        }
      }));
      refreshWorkspace({ limit: itemsLimitFromState(documents), silent: true });
      return { status: 'resolved' };
    },
    [documents, itemsLimitFromState, refreshWorkspace, servicemanId]
  );

  const handleProfileFieldChange = useCallback((field, value) => {
    setProfileDraft((current) => ({
      ...current,
      [field]: field === 'vatRegistered' ? Boolean(value) : value
    }));
  }, []);

  return {
    servicemanId,
    workspace,
    loading,
    error,
    refreshWorkspace,
    profileDraft,
    setProfileDraft,
    handleProfileFieldChange,
    saveProfile,
    profileSaving,
    profileFeedback,
    profileError,
    filings,
    filingsLoading,
    filingsError,
    filingsFilters,
    setFilingsFilters,
    loadFilings,
    upsertFiling,
    changeFilingStatus,
    removeFiling,
    tasks,
    tasksLoading,
    tasksError,
    tasksFilters,
    setTasksFilters,
    loadTasks,
    upsertTask,
    changeTaskStatus,
    removeTask,
    documents,
    documentsLoading,
    documentsError,
    documentFilters,
    setDocumentFilters,
    loadDocuments,
    upsertDocument,
    removeDocument,
    metadata: workspace.metadata ?? DEFAULT_METADATA,
    permissions: workspace.permissions ?? DEFAULT_PERMISSIONS
  };
}

export default useServicemanTaxState;
