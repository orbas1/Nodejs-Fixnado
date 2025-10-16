import { useCallback, useEffect, useMemo, useState } from 'react';
import CustomerDisputesSection from '../customerControl/CustomerDisputesSection.jsx';
import {
  fetchServicemanDisputes,
  createServicemanDisputeCase,
  updateServicemanDisputeCase,
  deleteServicemanDisputeCase,
  createServicemanDisputeTask,
  updateServicemanDisputeTask,
  deleteServicemanDisputeTask,
  createServicemanDisputeNote,
  updateServicemanDisputeNote,
  deleteServicemanDisputeNote,
  createServicemanDisputeEvidence,
  updateServicemanDisputeEvidence,
  deleteServicemanDisputeEvidence
} from '../../api/servicemanControlClient.js';
import {
  disputeCaseTemplate,
  disputeTaskTemplate,
  disputeNoteTemplate,
  disputeEvidenceTemplate
} from '../customerControl/constants.js';

const EMPTY_METRICS = {
  statusCounts: { draft: 0, open: 0, under_review: 0, awaiting_customer: 0, resolved: 0, closed: 0 },
  requiresFollowUp: 0,
  activeTasks: 0,
  totalDisputedAmount: 0,
  totalCases: 0
};

const initialStatus = { tone: null, message: null };

const buildErrorMessage = (error, fallback) => {
  if (!error) {
    return fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
};

const ServicemanDisputeWorkspace = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);

  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [activeCase, setActiveCase] = useState(null);
  const [caseStatus, setCaseStatus] = useState(initialStatus);
  const [caseSaving, setCaseSaving] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTaskContext, setActiveTaskContext] = useState(null);
  const [taskStatus, setTaskStatus] = useState(initialStatus);
  const [taskSaving, setTaskSaving] = useState(false);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNoteContext, setActiveNoteContext] = useState(null);
  const [noteStatus, setNoteStatus] = useState(initialStatus);
  const [noteSaving, setNoteSaving] = useState(false);

  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [activeEvidenceContext, setActiveEvidenceContext] = useState(null);
  const [evidenceStatus, setEvidenceStatus] = useState(initialStatus);
  const [evidenceSaving, setEvidenceSaving] = useState(false);

  const resetStatuses = useCallback(() => {
    setCaseStatus(initialStatus);
    setTaskStatus(initialStatus);
    setNoteStatus(initialStatus);
    setEvidenceStatus(initialStatus);
  }, []);

  const loadWorkspace = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        setError(null);
        const response = await fetchServicemanDisputes();
        setDisputes(Array.isArray(response.cases) ? response.cases : []);
        setMetrics(response.metrics ? { ...EMPTY_METRICS, ...response.metrics } : EMPTY_METRICS);
      } catch (caught) {
        console.error('Failed to load serviceman dispute workspace', caught);
        setError(buildErrorMessage(caught, 'We could not load dispute management right now.'));
        setDisputes([]);
        setMetrics(EMPTY_METRICS);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleCreateCase = useCallback(() => {
    resetStatuses();
    setActiveCase({ ...disputeCaseTemplate, id: null });
    setCaseModalOpen(true);
  }, [resetStatuses]);

  const handleEditCase = useCallback(
    (dispute) => {
      resetStatuses();
      setActiveCase({ ...disputeCaseTemplate, ...dispute });
      setCaseModalOpen(true);
    },
    [resetStatuses]
  );

  const handleCloseCaseModal = useCallback(() => {
    setCaseModalOpen(false);
    setActiveCase(null);
  }, []);

  const handleSubmitCase = useCallback(
    async (form) => {
      if (!form?.title) {
        setCaseStatus({ tone: 'negative', message: 'Title is required.' });
        return;
      }
      setCaseSaving(true);
      try {
        if (form.id) {
          await updateServicemanDisputeCase(form.id, form);
          setCaseStatus({ tone: 'positive', message: 'Dispute case updated.' });
        } else {
          await createServicemanDisputeCase(form);
          setCaseStatus({ tone: 'positive', message: 'Dispute case created.' });
        }
        await loadWorkspace({ silent: true });
        setCaseModalOpen(false);
        setActiveCase(null);
      } catch (caught) {
        console.error('Failed to save dispute case', caught);
        setCaseStatus({ tone: 'negative', message: buildErrorMessage(caught, 'Unable to save dispute case.') });
      } finally {
        setCaseSaving(false);
      }
    },
    [loadWorkspace]
  );

  const handleDeleteCase = useCallback(
    async (caseId) => {
      try {
        await deleteServicemanDisputeCase(caseId);
        setCaseStatus({ tone: 'positive', message: 'Dispute case removed.' });
        await loadWorkspace({ silent: true });
        setCaseModalOpen(false);
        setActiveCase(null);
      } catch (caught) {
        console.error('Failed to delete dispute case', caught);
        setCaseStatus({ tone: 'negative', message: buildErrorMessage(caught, 'Unable to delete dispute case.') });
      }
    },
    [loadWorkspace]
  );

  const handleOpenTask = useCallback(
    (dispute) => {
      resetStatuses();
      setActiveTaskContext({ disputeId: dispute.id, form: { ...disputeTaskTemplate, disputeCaseId: dispute.id } });
      setTaskModalOpen(true);
    },
    [resetStatuses]
  );

  const handleEditTask = useCallback(
    (dispute, task) => {
      resetStatuses();
      setActiveTaskContext({ disputeId: dispute.id, form: { ...disputeTaskTemplate, ...task, disputeCaseId: dispute.id } });
      setTaskModalOpen(true);
    },
    [resetStatuses]
  );

  const handleCloseTaskModal = useCallback(() => {
    setTaskModalOpen(false);
    setActiveTaskContext(null);
  }, []);

  const handleSubmitTask = useCallback(
    async (form) => {
      if (!activeTaskContext?.disputeId) {
        return;
      }
      setTaskSaving(true);
      try {
        if (form.id) {
          await updateServicemanDisputeTask(activeTaskContext.disputeId, form.id, form);
          setTaskStatus({ tone: 'positive', message: 'Task updated.' });
        } else {
          await createServicemanDisputeTask(activeTaskContext.disputeId, form);
          setTaskStatus({ tone: 'positive', message: 'Task added to dispute case.' });
        }
        await loadWorkspace({ silent: true });
        setTaskModalOpen(false);
        setActiveTaskContext(null);
      } catch (caught) {
        console.error('Failed to save dispute task', caught);
        setTaskStatus({ tone: 'negative', message: buildErrorMessage(caught, 'Unable to save dispute task.') });
      } finally {
        setTaskSaving(false);
      }
    },
    [activeTaskContext, loadWorkspace]
  );

  const handleDeleteTask = useCallback(
    async (disputeId, taskId) => {
      try {
        await deleteServicemanDisputeTask(disputeId, taskId);
        setTaskStatus({ tone: 'positive', message: 'Task removed.' });
        await loadWorkspace({ silent: true });
      } catch (caught) {
        console.error('Failed to delete dispute task', caught);
        setTaskStatus({ tone: 'negative', message: buildErrorMessage(caught, 'Unable to delete dispute task.') });
      }
    },
    [loadWorkspace]
  );

  const handleOpenNote = useCallback(
    (dispute) => {
      resetStatuses();
      setActiveNoteContext({ disputeId: dispute.id, form: { ...disputeNoteTemplate, disputeCaseId: dispute.id } });
      setNoteModalOpen(true);
    },
    [resetStatuses]
  );

  const handleEditNote = useCallback(
    (dispute, note) => {
      resetStatuses();
      setActiveNoteContext({ disputeId: dispute.id, form: { ...disputeNoteTemplate, ...note, disputeCaseId: dispute.id } });
      setNoteModalOpen(true);
    },
    [resetStatuses]
  );

  const handleCloseNoteModal = useCallback(() => {
    setNoteModalOpen(false);
    setActiveNoteContext(null);
  }, []);

  const handleSubmitNote = useCallback(
    async (form) => {
      if (!activeNoteContext?.disputeId) {
        return;
      }
      setNoteSaving(true);
      try {
        if (form.id) {
          await updateServicemanDisputeNote(activeNoteContext.disputeId, form.id, form);
          setNoteStatus({ tone: 'positive', message: 'Note updated.' });
        } else {
          await createServicemanDisputeNote(activeNoteContext.disputeId, form);
          setNoteStatus({ tone: 'positive', message: 'Note added.' });
        }
        await loadWorkspace({ silent: true });
        setNoteModalOpen(false);
        setActiveNoteContext(null);
      } catch (caught) {
        console.error('Failed to save dispute note', caught);
        setNoteStatus({ tone: 'negative', message: buildErrorMessage(caught, 'Unable to save dispute note.') });
      } finally {
        setNoteSaving(false);
      }
    },
    [activeNoteContext, loadWorkspace]
  );

  const handleDeleteNote = useCallback(
    async (disputeId, noteId) => {
      try {
        await deleteServicemanDisputeNote(disputeId, noteId);
        setNoteStatus({ tone: 'positive', message: 'Note removed.' });
        await loadWorkspace({ silent: true });
      } catch (caught) {
        console.error('Failed to delete dispute note', caught);
        setNoteStatus({ tone: 'negative', message: buildErrorMessage(caught, 'Unable to delete dispute note.') });
      }
    },
    [loadWorkspace]
  );

  const handleOpenEvidence = useCallback(
    (dispute) => {
      resetStatuses();
      setActiveEvidenceContext({ disputeId: dispute.id, form: { ...disputeEvidenceTemplate, disputeCaseId: dispute.id } });
      setEvidenceModalOpen(true);
    },
    [resetStatuses]
  );

  const handleEditEvidence = useCallback(
    (dispute, evidence) => {
      resetStatuses();
      setActiveEvidenceContext({
        disputeId: dispute.id,
        form: { ...disputeEvidenceTemplate, ...evidence, disputeCaseId: dispute.id }
      });
      setEvidenceModalOpen(true);
    },
    [resetStatuses]
  );

  const handleCloseEvidenceModal = useCallback(() => {
    setEvidenceModalOpen(false);
    setActiveEvidenceContext(null);
  }, []);

  const handleSubmitEvidence = useCallback(
    async (form) => {
      if (!activeEvidenceContext?.disputeId) {
        return;
      }
      setEvidenceSaving(true);
      try {
        if (form.id) {
          await updateServicemanDisputeEvidence(activeEvidenceContext.disputeId, form.id, form);
          setEvidenceStatus({ tone: 'positive', message: 'Evidence updated.' });
        } else {
          await createServicemanDisputeEvidence(activeEvidenceContext.disputeId, form);
          setEvidenceStatus({ tone: 'positive', message: 'Evidence uploaded.' });
        }
        await loadWorkspace({ silent: true });
        setEvidenceModalOpen(false);
        setActiveEvidenceContext(null);
      } catch (caught) {
        console.error('Failed to save dispute evidence', caught);
        setEvidenceStatus({ tone: 'negative', message: buildErrorMessage(caught, 'Unable to save dispute evidence.') });
      } finally {
        setEvidenceSaving(false);
      }
    },
    [activeEvidenceContext, loadWorkspace]
  );

  const handleDeleteEvidence = useCallback(
    async (disputeId, evidenceId) => {
      try {
        await deleteServicemanDisputeEvidence(disputeId, evidenceId);
        setEvidenceStatus({ tone: 'positive', message: 'Evidence removed.' });
        await loadWorkspace({ silent: true });
      } catch (caught) {
        console.error('Failed to delete dispute evidence', caught);
        setEvidenceStatus({ tone: 'negative', message: buildErrorMessage(caught, 'Unable to delete dispute evidence.') });
      }
    },
    [loadWorkspace]
  );

  const emptyStateMessage = useMemo(
    () =>
      'No dispute cases yet. Raise your first case to collaborate with finance, log updates, and attach supporting evidence.',
    []
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-60 animate-pulse rounded-full bg-primary/10" />
        <div className="h-60 animate-pulse rounded-3xl bg-primary/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-sm">{error}</p>
        <button
          type="button"
          onClick={() => loadWorkspace({ silent: false })}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:border-rose-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <CustomerDisputesSection
      disputes={disputes}
      metrics={metrics}
      caseStatus={caseStatus}
      caseModalOpen={caseModalOpen}
      activeCase={activeCase}
      onCreateCase={handleCreateCase}
      onEditCase={handleEditCase}
      onCloseCaseModal={handleCloseCaseModal}
      onSubmitCase={handleSubmitCase}
      onDeleteCase={handleDeleteCase}
      caseSaving={caseSaving}
      taskStatus={taskStatus}
      taskModalOpen={taskModalOpen}
      activeTask={activeTaskContext?.form ?? null}
      onOpenTask={handleOpenTask}
      onEditTask={handleEditTask}
      onCloseTaskModal={handleCloseTaskModal}
      onSubmitTask={handleSubmitTask}
      onDeleteTask={handleDeleteTask}
      taskSaving={taskSaving}
      noteStatus={noteStatus}
      noteModalOpen={noteModalOpen}
      activeNote={activeNoteContext?.form ?? null}
      onOpenNote={handleOpenNote}
      onEditNote={handleEditNote}
      onCloseNoteModal={handleCloseNoteModal}
      onSubmitNote={handleSubmitNote}
      onDeleteNote={handleDeleteNote}
      noteSaving={noteSaving}
      evidenceStatus={evidenceStatus}
      evidenceModalOpen={evidenceModalOpen}
      activeEvidence={activeEvidenceContext?.form ?? null}
      onOpenEvidence={handleOpenEvidence}
      onEditEvidence={handleEditEvidence}
      onCloseEvidenceModal={handleCloseEvidenceModal}
      onSubmitEvidence={handleSubmitEvidence}
      onDeleteEvidence={handleDeleteEvidence}
      evidenceSaving={evidenceSaving}
      title="Dispute management"
      description="Open disputes, assign action owners, and maintain evidence packs for finance and compliance."
      openCaseLabel="Open dispute case"
      emptyStateMessage={emptyStateMessage}
    />
  );
};

export default ServicemanDisputeWorkspace;

