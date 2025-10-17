import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Button, Card, Spinner } from '../../components/ui/index.js';
import { useSession } from '../../hooks/useSession.js';
import {
  fetchProviderDisputes,
  createProviderDisputeCase,
  updateProviderDisputeCase,
  deleteProviderDisputeCase,
  createProviderDisputeTask,
  updateProviderDisputeTask,
  deleteProviderDisputeTask,
  createProviderDisputeNote,
  updateProviderDisputeNote,
  deleteProviderDisputeNote,
  createProviderDisputeEvidence,
  updateProviderDisputeEvidence,
  deleteProviderDisputeEvidence
} from '../../api/providerControlClient.js';
import CaseSummaryBar from './components/CaseSummaryBar.jsx';
import CaseList from './components/CaseList.jsx';
import CaseDrawer from './components/CaseDrawer.jsx';
import CaseFormDrawer from './components/CaseFormDrawer.jsx';
import TaskFormDrawer from './components/TaskFormDrawer.jsx';
import NoteFormDrawer from './components/NoteFormDrawer.jsx';
import EvidenceFormDrawer from './components/EvidenceFormDrawer.jsx';
import {
  asNumber,
  formatCurrency,
  fromDateTimeInput,
  resolvePrimaryCurrency
} from './utils.js';

const DEFAULT_METRICS = {
  statusCounts: {
    draft: 0,
    open: 0,
    under_review: 0,
    awaiting_customer: 0,
    resolved: 0,
    closed: 0
  },
  requiresFollowUp: 0,
  activeTasks: 0,
  overdue: 0,
  totalDisputedAmount: 0,
  totalCases: 0
};

const DEFAULT_CASE_FORM = {
  title: '',
  status: 'open',
  severity: 'medium',
  category: 'billing',
  amountDisputed: '',
  currency: 'GBP',
  dueAt: '',
  slaDueAt: '',
  assignedTeam: '',
  assignedOwner: '',
  summary: '',
  nextStep: '',
  resolutionNotes: '',
  externalReference: '',
  caseNumber: '',
  requiresFollowUp: false
};

const DEFAULT_TASK_FORM = {
  label: '',
  status: 'pending',
  assignedTo: '',
  dueAt: '',
  instructions: ''
};

const DEFAULT_NOTE_FORM = {
  noteType: 'update',
  visibility: 'provider',
  body: '',
  nextSteps: '',
  pinned: false
};

const DEFAULT_EVIDENCE_FORM = {
  label: '',
  fileUrl: '',
  fileType: '',
  thumbnailUrl: '',
  notes: ''
};

function makeCaseEditorState() {
  return {
    open: false,
    mode: 'create',
    caseId: null,
    form: { ...DEFAULT_CASE_FORM },
    saving: false,
    error: null
  };
}

function makeTaskEditorState() {
  return {
    open: false,
    mode: 'create',
    caseId: null,
    taskId: null,
    form: { ...DEFAULT_TASK_FORM },
    saving: false,
    error: null
  };
}

function makeNoteEditorState() {
  return {
    open: false,
    mode: 'create',
    caseId: null,
    noteId: null,
    authorId: null,
    form: { ...DEFAULT_NOTE_FORM },
    saving: false,
    error: null
  };
}

function makeEvidenceEditorState() {
  return {
    open: false,
    mode: 'create',
    caseId: null,
    evidenceId: null,
    uploadedBy: null,
    form: { ...DEFAULT_EVIDENCE_FORM },
    saving: false,
    error: null
  };
}

function cleanString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function mapCaseToForm(disputeCase) {
  if (!disputeCase) {
    return { ...DEFAULT_CASE_FORM };
  }
  return {
    title: disputeCase.title ?? '',
    status: disputeCase.status ?? 'open',
    severity: disputeCase.severity ?? 'medium',
    category: disputeCase.category ?? 'billing',
    amountDisputed:
      disputeCase.amountDisputed === null || disputeCase.amountDisputed === undefined
        ? ''
        : `${disputeCase.amountDisputed}`,
    currency: disputeCase.currency ?? 'GBP',
    dueAt: disputeCase.dueAt ?? '',
    slaDueAt: disputeCase.slaDueAt ?? '',
    assignedTeam: disputeCase.assignedTeam ?? '',
    assignedOwner: disputeCase.assignedOwner ?? '',
    summary: disputeCase.summary ?? '',
    nextStep: disputeCase.nextStep ?? '',
    resolutionNotes: disputeCase.resolutionNotes ?? '',
    externalReference: disputeCase.externalReference ?? '',
    caseNumber: disputeCase.caseNumber ?? '',
    requiresFollowUp: Boolean(disputeCase.requiresFollowUp)
  };
}

function mapTaskToForm(task) {
  if (!task) {
    return { ...DEFAULT_TASK_FORM };
  }
  return {
    label: task.label ?? '',
    status: task.status ?? 'pending',
    assignedTo: task.assignedTo ?? '',
    dueAt: task.dueAt ?? '',
    instructions: task.instructions ?? ''
  };
}

function mapNoteToForm(note) {
  if (!note) {
    return { ...DEFAULT_NOTE_FORM };
  }
  return {
    noteType: note.noteType ?? 'update',
    visibility: note.visibility ?? 'provider',
    body: note.body ?? '',
    nextSteps: note.nextSteps ?? '',
    pinned: Boolean(note.pinned)
  };
}

function mapEvidenceToForm(evidence) {
  if (!evidence) {
    return { ...DEFAULT_EVIDENCE_FORM };
  }
  return {
    label: evidence.label ?? '',
    fileUrl: evidence.fileUrl ?? '',
    fileType: evidence.fileType ?? '',
    thumbnailUrl: evidence.thumbnailUrl ?? '',
    notes: evidence.notes ?? ''
  };
}

function buildCasePayload(form) {
  return {
    title: form.title,
    status: form.status,
    severity: form.severity,
    category: form.category,
    amountDisputed: asNumber(form.amountDisputed),
    currency: cleanString(form.currency) ?? 'GBP',
    dueAt: fromDateTimeInput(form.dueAt),
    slaDueAt: fromDateTimeInput(form.slaDueAt),
    assignedTeam: cleanString(form.assignedTeam),
    assignedOwner: cleanString(form.assignedOwner),
    summary: cleanString(form.summary),
    nextStep: cleanString(form.nextStep),
    resolutionNotes: cleanString(form.resolutionNotes),
    externalReference: cleanString(form.externalReference),
    caseNumber: cleanString(form.caseNumber),
    requiresFollowUp: Boolean(form.requiresFollowUp)
  };
}

function buildTaskPayload(form) {
  return {
    label: form.label,
    status: form.status,
    assignedTo: cleanString(form.assignedTo),
    dueAt: fromDateTimeInput(form.dueAt),
    instructions: cleanString(form.instructions)
  };
}

function buildNotePayload(form, authorId) {
  return {
    noteType: form.noteType,
    visibility: form.visibility,
    body: form.body,
    nextSteps: cleanString(form.nextSteps),
    pinned: Boolean(form.pinned),
    authorId: authorId ?? undefined
  };
}

function buildEvidencePayload(form, uploadedBy) {
  return {
    label: form.label,
    fileUrl: form.fileUrl,
    fileType: cleanString(form.fileType),
    thumbnailUrl: cleanString(form.thumbnailUrl),
    notes: cleanString(form.notes),
    uploadedBy: uploadedBy ?? undefined
  };
}

function buildErrorMessage(error, fallback) {
  if (!error) {
    return fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.cause?.message) {
    return error.cause.message;
  }
  return fallback;
}

export default function ProviderDisputesWorkspace({ companyId }) {
  const { tenantId, userId } = useSession();
  const resolvedCompanyId = companyId ?? tenantId ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cases, setCases] = useState([]);
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [filter, setFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const [caseEditor, setCaseEditor] = useState(() => makeCaseEditorState());
  const [taskEditor, setTaskEditor] = useState(() => makeTaskEditorState());
  const [noteEditor, setNoteEditor] = useState(() => makeNoteEditorState());
  const [evidenceEditor, setEvidenceEditor] = useState(() => makeEvidenceEditorState());

  const loadWorkspace = useCallback(
    async ({ silent = false } = {}) => {
      if (!resolvedCompanyId) {
        setCases([]);
        setMetrics(DEFAULT_METRICS);
        setError('Select a provider company to manage disputes.');
        setLoading(false);
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      try {
        setError(null);
        const response = await fetchProviderDisputes({ companyId: resolvedCompanyId });
        const nextCases = Array.isArray(response?.cases) ? response.cases : [];
        const statusCounts = {
          ...DEFAULT_METRICS.statusCounts,
          ...(response?.metrics?.statusCounts ?? {})
        };
        setCases(nextCases);
        setMetrics({
          statusCounts,
          requiresFollowUp: response?.metrics?.requiresFollowUp ?? 0,
          activeTasks: response?.metrics?.activeTasks ?? 0,
          overdue: response?.metrics?.overdue ?? 0,
          totalDisputedAmount: response?.metrics?.totalDisputedAmount ?? 0,
          totalCases: response?.metrics?.totalCases ?? nextCases.length
        });
      } catch (caught) {
        setCases([]);
        setMetrics(DEFAULT_METRICS);
        setError(buildErrorMessage(caught, 'Unable to load disputes right now.'));
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [resolvedCompanyId]
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!selectedCaseId) {
      return;
    }
    if (!cases.some((entry) => entry.id === selectedCaseId)) {
      setDrawerOpen(false);
      setSelectedCaseId(null);
    }
  }, [cases, selectedCaseId]);

  const orderedCases = useMemo(() => {
    return cases
      .slice()
      .sort((a, b) => {
        const aTime = a?.openedAt ? new Date(a.openedAt).getTime() : 0;
        const bTime = b?.openedAt ? new Date(b.openedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [cases]);

  const selectedCase = useMemo(
    () => orderedCases.find((disputeCase) => disputeCase.id === selectedCaseId) ?? null,
    [orderedCases, selectedCaseId]
  );

  const primaryCurrency = resolvePrimaryCurrency(cases);

  const headerMeta = useMemo(() => {
    const total = metrics.totalCases ?? orderedCases.length;
    const tasks = metrics.activeTasks ?? 0;
    const follow = metrics.requiresFollowUp ?? 0;
    return [
      { label: 'Total', value: total.toLocaleString(), emphasis: true },
      { label: 'Tasks', value: tasks.toLocaleString() },
      { label: 'Follow', value: follow.toLocaleString() },
      { label: 'Amount', value: formatCurrency(metrics.totalDisputedAmount ?? 0, primaryCurrency) }
    ];
  }, [metrics.activeTasks, metrics.requiresFollowUp, metrics.totalCases, metrics.totalDisputedAmount, orderedCases.length, primaryCurrency]);

  const updateCaseForm = useCallback((patch) => {
    setCaseEditor((current) => ({ ...current, form: { ...current.form, ...patch } }));
  }, []);

  const updateTaskForm = useCallback((patch) => {
    setTaskEditor((current) => ({ ...current, form: { ...current.form, ...patch } }));
  }, []);

  const updateNoteForm = useCallback((patch) => {
    setNoteEditor((current) => ({ ...current, form: { ...current.form, ...patch } }));
  }, []);

  const updateEvidenceForm = useCallback((patch) => {
    setEvidenceEditor((current) => ({ ...current, form: { ...current.form, ...patch } }));
  }, []);

  const handleSelectCase = useCallback((disputeCase) => {
    if (!disputeCase) {
      return;
    }
    setSelectedCaseId(disputeCase.id);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleOpenCreateCase = useCallback(() => {
    setCaseEditor({ ...makeCaseEditorState(), open: true });
  }, []);

  const handleEditCase = useCallback((disputeCase) => {
    if (!disputeCase) {
      return;
    }
    setCaseEditor({
      open: true,
      mode: 'edit',
      caseId: disputeCase.id,
      form: mapCaseToForm(disputeCase),
      saving: false,
      error: null
    });
  }, []);

  const headerActions = useMemo(
    () => [
      {
        label: 'New',
        icon: PlusIcon,
        onClick: handleOpenCreateCase
      },
      {
        label: 'Refresh',
        variant: 'secondary',
        icon: ArrowPathIcon,
        onClick: () => loadWorkspace()
      }
    ],
    [handleOpenCreateCase, loadWorkspace]
  );

  const handleSubmitCase = useCallback(async () => {
    const { mode, caseId, form } = caseEditor;
    setCaseEditor((current) => ({ ...current, saving: true, error: null }));
    try {
      const payload = buildCasePayload(form);
      let saved;
      if (mode === 'edit' && caseId) {
        saved = await updateProviderDisputeCase(caseId, payload, { companyId: resolvedCompanyId });
      } else {
        saved = await createProviderDisputeCase(payload, { companyId: resolvedCompanyId });
      }
      await loadWorkspace({ silent: true });
      if (saved?.id) {
        setSelectedCaseId(saved.id);
        setDrawerOpen(true);
      }
      setCaseEditor(makeCaseEditorState());
    } catch (caught) {
      setCaseEditor((current) => ({
        ...current,
        saving: false,
        error: buildErrorMessage(caught, 'Unable to save case.')
      }));
    }
  }, [caseEditor, loadWorkspace, resolvedCompanyId]);

  const handleDeleteCase = useCallback(
    async (disputeCase) => {
      if (!disputeCase) return;
      if (!window.confirm('Remove this case?')) {
        return;
      }
      try {
        await deleteProviderDisputeCase(disputeCase.id, { companyId: resolvedCompanyId });
        setDrawerOpen(false);
        setSelectedCaseId(null);
        await loadWorkspace({ silent: true });
      } catch (caught) {
        setError(buildErrorMessage(caught, 'Unable to remove case.'));
      }
    },
    [loadWorkspace, resolvedCompanyId]
  );

  const handleAddTask = useCallback((disputeCase) => {
    if (!disputeCase) return;
    setTaskEditor({
      ...makeTaskEditorState(),
      open: true,
      caseId: disputeCase.id,
      form: { ...DEFAULT_TASK_FORM }
    });
  }, []);

  const handleEditTask = useCallback((task) => {
    if (!task) return;
    setTaskEditor({
      open: true,
      mode: 'edit',
      caseId: task.disputeCaseId ?? selectedCaseId,
      taskId: task.id,
      form: mapTaskToForm(task),
      saving: false,
      error: null
    });
  }, [selectedCaseId]);

  const handleSubmitTask = useCallback(async () => {
    const { caseId, taskId, mode, form } = taskEditor;
    if (!caseId) {
      setTaskEditor((current) => ({ ...current, error: 'Missing case context.' }));
      return;
    }
    setTaskEditor((current) => ({ ...current, saving: true, error: null }));
    try {
      const payload = buildTaskPayload(form);
      if (mode === 'edit' && taskId) {
        await updateProviderDisputeTask(caseId, taskId, payload, { companyId: resolvedCompanyId });
      } else {
        await createProviderDisputeTask(caseId, payload, { companyId: resolvedCompanyId });
      }
      await loadWorkspace({ silent: true });
      setTaskEditor(makeTaskEditorState());
    } catch (caught) {
      setTaskEditor((current) => ({
        ...current,
        saving: false,
        error: buildErrorMessage(caught, 'Unable to save task.')
      }));
    }
  }, [loadWorkspace, resolvedCompanyId, taskEditor]);

  const handleDeleteTask = useCallback(
    async (task) => {
      if (!task) return;
      if (!window.confirm('Remove this task?')) {
        return;
      }
      try {
        await deleteProviderDisputeTask(task.disputeCaseId ?? selectedCaseId, task.id, { companyId: resolvedCompanyId });
        await loadWorkspace({ silent: true });
      } catch (caught) {
        setError(buildErrorMessage(caught, 'Unable to remove task.'));
      }
    },
    [loadWorkspace, resolvedCompanyId, selectedCaseId]
  );

  const handleAddNote = useCallback(
    (disputeCase) => {
      if (!disputeCase) return;
      setNoteEditor({
        ...makeNoteEditorState(),
        open: true,
        caseId: disputeCase.id,
        authorId: userId || null,
        form: { ...DEFAULT_NOTE_FORM }
      });
    },
    [userId]
  );

  const handleEditNote = useCallback((note) => {
    if (!note) return;
    setNoteEditor({
      open: true,
      mode: 'edit',
      caseId: note.disputeCaseId ?? selectedCaseId,
      noteId: note.id,
      authorId: note.authorId ?? userId ?? null,
      form: mapNoteToForm(note),
      saving: false,
      error: null
    });
  }, [selectedCaseId, userId]);

  const handleSubmitNote = useCallback(async () => {
    const { caseId, noteId, mode, form, authorId } = noteEditor;
    if (!caseId) {
      setNoteEditor((current) => ({ ...current, error: 'Missing case context.' }));
      return;
    }
    setNoteEditor((current) => ({ ...current, saving: true, error: null }));
    try {
      const payload = buildNotePayload(form, authorId ?? userId ?? undefined);
      if (mode === 'edit' && noteId) {
        await updateProviderDisputeNote(caseId, noteId, payload, { companyId: resolvedCompanyId });
      } else {
        await createProviderDisputeNote(caseId, payload, { companyId: resolvedCompanyId });
      }
      await loadWorkspace({ silent: true });
      setNoteEditor(makeNoteEditorState());
    } catch (caught) {
      setNoteEditor((current) => ({
        ...current,
        saving: false,
        error: buildErrorMessage(caught, 'Unable to save note.')
      }));
    }
  }, [loadWorkspace, noteEditor, resolvedCompanyId, userId]);

  const handleDeleteNote = useCallback(
    async (note) => {
      if (!note) return;
      if (!window.confirm('Remove this note?')) {
        return;
      }
      try {
        await deleteProviderDisputeNote(note.disputeCaseId ?? selectedCaseId, note.id, { companyId: resolvedCompanyId });
        await loadWorkspace({ silent: true });
      } catch (caught) {
        setError(buildErrorMessage(caught, 'Unable to remove note.'));
      }
    },
    [loadWorkspace, resolvedCompanyId, selectedCaseId]
  );

  const handleAddEvidence = useCallback(
    (disputeCase) => {
      if (!disputeCase) return;
      setEvidenceEditor({
        ...makeEvidenceEditorState(),
        open: true,
        caseId: disputeCase.id,
        uploadedBy: userId || null,
        form: { ...DEFAULT_EVIDENCE_FORM }
      });
    },
    [userId]
  );

  const handleEditEvidence = useCallback((item) => {
    if (!item) return;
    setEvidenceEditor({
      open: true,
      mode: 'edit',
      caseId: item.disputeCaseId ?? selectedCaseId,
      evidenceId: item.id,
      uploadedBy: item.uploadedBy ?? userId ?? null,
      form: mapEvidenceToForm(item),
      saving: false,
      error: null
    });
  }, [selectedCaseId, userId]);

  const handleSubmitEvidence = useCallback(async () => {
    const { caseId, evidenceId, mode, form, uploadedBy } = evidenceEditor;
    if (!caseId) {
      setEvidenceEditor((current) => ({ ...current, error: 'Missing case context.' }));
      return;
    }
    setEvidenceEditor((current) => ({ ...current, saving: true, error: null }));
    try {
      const payload = buildEvidencePayload(form, uploadedBy ?? userId ?? undefined);
      if (mode === 'edit' && evidenceId) {
        await updateProviderDisputeEvidence(caseId, evidenceId, payload, { companyId: resolvedCompanyId });
      } else {
        await createProviderDisputeEvidence(caseId, payload, { companyId: resolvedCompanyId });
      }
      await loadWorkspace({ silent: true });
      setEvidenceEditor(makeEvidenceEditorState());
    } catch (caught) {
      setEvidenceEditor((current) => ({
        ...current,
        saving: false,
        error: buildErrorMessage(caught, 'Unable to save file.')
      }));
    }
  }, [evidenceEditor, loadWorkspace, resolvedCompanyId, userId]);

  const handleDeleteEvidence = useCallback(
    async (item) => {
      if (!item) return;
      if (!window.confirm('Remove this file?')) {
        return;
      }
      try {
        await deleteProviderDisputeEvidence(item.disputeCaseId ?? selectedCaseId, item.id, { companyId: resolvedCompanyId });
        await loadWorkspace({ silent: true });
      } catch (caught) {
        setError(buildErrorMessage(caught, 'Unable to remove file.'));
      }
    },
    [loadWorkspace, resolvedCompanyId, selectedCaseId]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Provider Control"
        title="Disputes"
        breadcrumbs={[
          { label: 'Provider', to: '/dashboards/provider' },
          { label: 'Disputes' }
        ]}
        actions={headerActions}
        meta={headerMeta}
      />

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-6">
        <CaseSummaryBar metrics={metrics} currency={primaryCurrency} />

        {error ? (
          <Card className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-red-200 bg-red-50/80 p-6 text-red-700">
            <span className="font-semibold">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => loadWorkspace()}>
              Retry
            </Button>
          </Card>
        ) : null}

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-slate-200 bg-white/70">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : (
          <CaseList
            cases={orderedCases}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={handleSelectCase}
            selectedCaseId={selectedCaseId}
            onCreate={handleOpenCreateCase}
          />
        )}
      </main>

      <CaseDrawer
        open={drawerOpen && Boolean(selectedCase)}
        disputeCase={selectedCase}
        onClose={handleCloseDrawer}
        onEdit={handleEditCase}
        onDelete={handleDeleteCase}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onAddNote={handleAddNote}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onAddEvidence={handleAddEvidence}
        onEditEvidence={handleEditEvidence}
        onDeleteEvidence={handleDeleteEvidence}
      />

      <CaseFormDrawer
        open={caseEditor.open}
        mode={caseEditor.mode}
        form={caseEditor.form}
        onChange={updateCaseForm}
        onSubmit={handleSubmitCase}
        onClose={() => setCaseEditor(makeCaseEditorState())}
        saving={caseEditor.saving}
        error={caseEditor.error}
      />

      <TaskFormDrawer
        open={taskEditor.open}
        mode={taskEditor.mode}
        form={taskEditor.form}
        onChange={updateTaskForm}
        onSubmit={handleSubmitTask}
        onClose={() => setTaskEditor(makeTaskEditorState())}
        saving={taskEditor.saving}
        error={taskEditor.error}
      />

      <NoteFormDrawer
        open={noteEditor.open}
        mode={noteEditor.mode}
        form={noteEditor.form}
        onChange={updateNoteForm}
        onSubmit={handleSubmitNote}
        onClose={() => setNoteEditor(makeNoteEditorState())}
        saving={noteEditor.saving}
        error={noteEditor.error}
      />

      <EvidenceFormDrawer
        open={evidenceEditor.open}
        mode={evidenceEditor.mode}
        form={evidenceEditor.form}
        onChange={updateEvidenceForm}
        onSubmit={handleSubmitEvidence}
        onClose={() => setEvidenceEditor(makeEvidenceEditorState())}
        saving={evidenceEditor.saving}
        error={evidenceEditor.error}
      />
    </div>
  );
}

ProviderDisputesWorkspace.propTypes = {
  companyId: PropTypes.string
};

ProviderDisputesWorkspace.defaultProps = {
  companyId: null
};
