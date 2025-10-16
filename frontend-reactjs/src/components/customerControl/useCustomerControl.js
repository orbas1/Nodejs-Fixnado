import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCustomerOverview,
  saveCustomerProfile,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  createCustomerLocation,
  updateCustomerLocation,
  deleteCustomerLocation,
  createCustomerDisputeCase,
  updateCustomerDisputeCase,
  deleteCustomerDisputeCase,
  createCustomerDisputeTask,
  updateCustomerDisputeTask,
  deleteCustomerDisputeTask,
  createCustomerDisputeNote,
  updateCustomerDisputeNote,
  deleteCustomerDisputeNote,
  createCustomerDisputeEvidence,
  updateCustomerDisputeEvidence,
  deleteCustomerDisputeEvidence
} from '../../api/customerControlClient.js';
import {
  contactTemplate,
  defaultProfile,
  locationTemplate,
  disputeCaseTemplate,
  disputeTaskTemplate,
  disputeNoteTemplate,
  disputeEvidenceTemplate
} from './constants.js';

const normaliseProfile = (profile) => ({
  ...defaultProfile,
  ...(profile ?? {}),
  escalationWindowMinutes: Number.isFinite(profile?.escalationWindowMinutes)
    ? profile.escalationWindowMinutes
    : defaultProfile.escalationWindowMinutes,
  marketingOptIn: Boolean(profile?.marketingOptIn),
  notificationsEmailOptIn:
    profile?.notificationsEmailOptIn === undefined
      ? defaultProfile.notificationsEmailOptIn
      : Boolean(profile?.notificationsEmailOptIn),
  notificationsSmsOptIn: Boolean(profile?.notificationsSmsOptIn)
});

const normaliseContact = (contact) => ({
  ...contactTemplate,
  ...(contact ?? {}),
  isPrimary: Boolean(contact?.isPrimary)
});

const normaliseLocation = (location) => ({
  ...locationTemplate,
  ...(location ?? {}),
  isPrimary: Boolean(location?.isPrimary)
});

const formatDateInput = (value) => {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
};

const formatDateOutput = (value) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const normaliseDisputeTask = (task) => ({
  ...disputeTaskTemplate,
  ...(task ?? {}),
  disputeCaseId: task?.disputeCaseId ?? task?.dispute_case_id ?? disputeTaskTemplate.disputeCaseId,
  dueAt: formatDateInput(task?.dueAt ?? task?.due_at),
  completedAt: formatDateInput(task?.completedAt ?? task?.completed_at)
});

const normaliseDisputeNote = (note) => ({
  ...disputeNoteTemplate,
  ...(note ?? {}),
  disputeCaseId: note?.disputeCaseId ?? note?.dispute_case_id ?? disputeNoteTemplate.disputeCaseId,
  pinned: Boolean(note?.pinned)
});

const normaliseDisputeEvidence = (evidence) => ({
  ...disputeEvidenceTemplate,
  ...(evidence ?? {}),
  disputeCaseId: evidence?.disputeCaseId ?? evidence?.dispute_case_id ?? disputeEvidenceTemplate.disputeCaseId
});

const normaliseDisputeCase = (disputeCase) => ({
  ...disputeCaseTemplate,
  ...(disputeCase ?? {}),
  amountDisputed:
    disputeCase?.amountDisputed === null || disputeCase?.amountDisputed === undefined
      ? ''
      : `${disputeCase.amountDisputed}`,
  openedAt: formatDateInput(disputeCase?.openedAt),
  dueAt: formatDateInput(disputeCase?.dueAt),
  resolvedAt: formatDateInput(disputeCase?.resolvedAt),
  slaDueAt: formatDateInput(disputeCase?.slaDueAt),
  lastReviewedAt: formatDateInput(disputeCase?.lastReviewedAt),
  tasks: Array.isArray(disputeCase?.tasks)
    ? disputeCase.tasks.map(normaliseDisputeTask)
    : disputeCaseTemplate.tasks,
  notes: Array.isArray(disputeCase?.notes)
    ? disputeCase.notes.map(normaliseDisputeNote)
    : disputeCaseTemplate.notes,
  evidence: Array.isArray(disputeCase?.evidence)
    ? disputeCase.evidence.map(normaliseDisputeEvidence)
    : disputeCaseTemplate.evidence
});

export const useCustomerControl = () => {
  const [profile, setProfile] = useState(defaultProfile);
  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [disputes, setDisputes] = useState([]);

  const [disputeMetrics, setDisputeMetrics] = useState({
    statusCounts: {
      draft: 0,
      open: 0,
      under_review: 0,
      awaiting_customer: 0,
      resolved: 0,
      closed: 0
    },
    requiresFollowUp: 0,
    overdue: 0,
    activeTasks: 0,
    totalDisputedAmount: 0,
    totalCases: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profileStatus, setProfileStatus] = useState(null);
  const [contactStatus, setContactStatus] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [disputeStatus, setDisputeStatus] = useState(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [caseSaving, setCaseSaving] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [evidenceSaving, setEvidenceSaving] = useState(false);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activeContact, setActiveContact] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [activeCase, setActiveCase] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [noteStatus, setNoteStatus] = useState(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState(null);
  const [evidenceStatus, setEvidenceStatus] = useState(null);

  const computeDisputeMetrics = useCallback((cases) => {
    const metrics = {
      statusCounts: {
        draft: 0,
        open: 0,
        under_review: 0,
        awaiting_customer: 0,
        resolved: 0,
        closed: 0
      },
      requiresFollowUp: 0,
      overdue: 0,
      activeTasks: 0,
      totalDisputedAmount: 0,
      totalCases: Array.isArray(cases) ? cases.length : 0
    };

    if (!Array.isArray(cases)) {
      return metrics;
    }

    const now = Date.now();

    cases.forEach((dispute) => {
      const status = dispute.status ?? 'draft';
      if (metrics.statusCounts[status] !== undefined) {
        metrics.statusCounts[status] += 1;
      }
      if (dispute.requiresFollowUp) {
        metrics.requiresFollowUp += 1;
      }
      const amount = Number.parseFloat(dispute.amountDisputed);
      if (Number.isFinite(amount)) {
        metrics.totalDisputedAmount += amount;
      }
      if (dispute.dueAt) {
        const dueTime = new Date(dispute.dueAt).getTime();
        if (!Number.isNaN(dueTime) && dueTime < now && !['resolved', 'closed'].includes(status)) {
          metrics.overdue += 1;
        }
      }
      if (Array.isArray(dispute.tasks) && dispute.tasks.some((task) => task.status !== 'completed')) {
        metrics.activeTasks += 1;
      }
    });

    return metrics;
  }, []);

  const applyDisputesUpdate = useCallback(
    (updater) => {
      setDisputes((previous) => {
        const updated = updater(previous);
        setDisputeMetrics(computeDisputeMetrics(updated));
        return updated;
      });
    },
    [computeDisputeMetrics]
  );

  const loadOverview = useCallback(
    async ({ signal } = {}) => {
      try {
        const data = await fetchCustomerOverview({ signal });
        if (signal?.aborted) return;
        setProfile(normaliseProfile(data.profile));
        setContacts(Array.isArray(data.contacts) ? data.contacts.map(normaliseContact) : []);
        setLocations(Array.isArray(data.locations) ? data.locations.map(normaliseLocation) : []);
        const normalisedDisputes = Array.isArray(data.disputes?.cases)
          ? data.disputes.cases.map(normaliseDisputeCase)
          : [];
        setDisputes(normalisedDisputes);
        setDisputeMetrics(computeDisputeMetrics(normalisedDisputes));
        setError(null);
      } catch (caught) {
        if (signal?.aborted) return;
        setError(caught?.message || 'Unable to load customer overview');
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadOverview({ signal: controller.signal });
    return () => controller.abort();
  }, [loadOverview]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    await loadOverview();
  }, [loadOverview]);

  const handleProfileChange = useCallback((field, value) => {
    setProfile((previous) => ({ ...previous, [field]: value }));
  }, []);

  const handleProfileCheckbox = useCallback((field, value) => {
    setProfile((previous) => ({ ...previous, [field]: Boolean(value) }));
  }, []);

  const handleProfileSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProfileSaving(true);
      setProfileStatus(null);
      try {
        const { profile: savedProfile } = await saveCustomerProfile(profile);
        setProfile(normaliseProfile(savedProfile));
        setProfileStatus({ tone: 'success', message: 'Customer profile updated successfully.' });
      } catch (caught) {
        setProfileStatus({ tone: 'error', message: caught?.message || 'Unable to save profile.' });
      } finally {
        setProfileSaving(false);
      }
    },
    [profile]
  );

  const openCreateContact = useCallback(() => {
    setActiveContact(normaliseContact(contactTemplate));
    setContactStatus(null);
    setContactModalOpen(true);
  }, []);

  const openEditContact = useCallback((contact) => {
    setActiveContact(normaliseContact(contact));
    setContactStatus(null);
    setContactModalOpen(true);
  }, []);

  const closeContactModal = useCallback(() => {
    setContactModalOpen(false);
    setActiveContact(null);
  }, []);

  const handleContactSubmit = useCallback(
    async (form) => {
      setContactSaving(true);
      try {
        if (form.id) {
          const { contact } = await updateCustomerContact(form.id, form);
          setContacts((previous) => previous.map((item) => (item.id === contact.id ? normaliseContact(contact) : item)));
          setContactStatus({ tone: 'success', message: 'Contact updated.' });
        } else {
          const { contact } = await createCustomerContact(form);
          setContacts((previous) => [...previous, normaliseContact(contact)]);
          setContactStatus({ tone: 'success', message: 'Contact added.' });
        }
        setContactModalOpen(false);
        setActiveContact(null);
      } catch (caught) {
        setContactStatus({ tone: 'error', message: caught?.message || 'Unable to save contact.' });
      } finally {
        setContactSaving(false);
      }
    },
    []
  );

  const handleDeleteContact = useCallback(async (contactId) => {
    setContactSaving(true);
    try {
      await deleteCustomerContact(contactId);
      setContacts((previous) => previous.filter((contact) => contact.id !== contactId));
      setContactStatus({ tone: 'success', message: 'Contact removed.' });
    } catch (caught) {
      setContactStatus({ tone: 'error', message: caught?.message || 'Unable to remove contact.' });
    } finally {
      setContactSaving(false);
    }
  }, []);

  const openCreateLocation = useCallback(() => {
    setActiveLocation(normaliseLocation(locationTemplate));
    setLocationStatus(null);
    setLocationModalOpen(true);
  }, []);

  const openEditLocation = useCallback((location) => {
    setActiveLocation(normaliseLocation(location));
    setLocationStatus(null);
    setLocationModalOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setLocationModalOpen(false);
    setActiveLocation(null);
  }, []);

  const handleLocationSubmit = useCallback(async (form) => {
    setLocationSaving(true);
    try {
      if (form.id) {
        const { location } = await updateCustomerLocation(form.id, form);
        setLocations((previous) => previous.map((item) => (item.id === location.id ? normaliseLocation(location) : item)));
        setLocationStatus({ tone: 'success', message: 'Location updated.' });
      } else {
        const { location } = await createCustomerLocation(form);
        setLocations((previous) => [...previous, normaliseLocation(location)]);
        setLocationStatus({ tone: 'success', message: 'Location added.' });
      }
      setLocationModalOpen(false);
      setActiveLocation(null);
    } catch (caught) {
      setLocationStatus({ tone: 'error', message: caught?.message || 'Unable to save location.' });
    } finally {
      setLocationSaving(false);
    }
  }, []);

  const handleDeleteLocation = useCallback(async (locationId) => {
    setLocationSaving(true);
    try {
      await deleteCustomerLocation(locationId);
      setLocations((previous) => previous.filter((location) => location.id !== locationId));
      setLocationStatus({ tone: 'success', message: 'Location removed.' });
    } catch (caught) {
      setLocationStatus({ tone: 'error', message: caught?.message || 'Unable to remove location.' });
    } finally {
      setLocationSaving(false);
    }
  }, []);

  const openCreateDisputeCase = useCallback(() => {
    setActiveCase(normaliseDisputeCase({ ...disputeCaseTemplate }));
    setDisputeStatus(null);
    setCaseModalOpen(true);
  }, []);

  const openEditDisputeCase = useCallback((disputeCase) => {
    setActiveCase(normaliseDisputeCase(disputeCase));
    setDisputeStatus(null);
    setCaseModalOpen(true);
  }, []);

  const closeCaseModal = useCallback(() => {
    setCaseModalOpen(false);
    setActiveCase(null);
  }, []);

  const handleDisputeCaseSubmit = useCallback(
    async (form) => {
      setCaseSaving(true);
      setDisputeStatus(null);
      try {
        const payload = {
          caseNumber: form.caseNumber?.trim() || undefined,
          disputeId: form.disputeId?.trim() || undefined,
          title: form.title?.trim() || '',
          category: form.category,
          status: form.status,
          severity: form.severity,
          summary: form.summary?.trim() || undefined,
          nextStep: form.nextStep?.trim() || undefined,
          assignedTeam: form.assignedTeam?.trim() || undefined,
          assignedOwner: form.assignedOwner?.trim() || undefined,
          resolutionNotes: form.resolutionNotes?.trim() || undefined,
          externalReference: form.externalReference?.trim() || undefined,
          amountDisputed:
            form.amountDisputed === '' || form.amountDisputed === null
              ? null
              : Number.parseFloat(form.amountDisputed),
          currency: form.currency?.trim() || undefined,
          openedAt: formatDateOutput(form.openedAt),
          dueAt: formatDateOutput(form.dueAt),
          resolvedAt: formatDateOutput(form.resolvedAt),
          slaDueAt: formatDateOutput(form.slaDueAt),
          requiresFollowUp: Boolean(form.requiresFollowUp),
          lastReviewedAt: formatDateOutput(form.lastReviewedAt)
        };

        const response = form.id
          ? await updateCustomerDisputeCase(form.id, payload)
          : await createCustomerDisputeCase(payload);

        const savedCase = normaliseDisputeCase(response.case);

        applyDisputesUpdate((previous) => {
          if (form.id) {
            return previous.map((item) => (item.id === savedCase.id ? savedCase : item));
          }
          return [...previous, savedCase];
        });

        setDisputeStatus({
          tone: 'success',
          message: form.id ? 'Dispute case updated.' : 'Dispute case created.'
        });
        setCaseModalOpen(false);
        setActiveCase(null);
      } catch (caught) {
        setDisputeStatus({
          tone: 'error',
          message: caught?.message || 'Unable to save dispute case.'
        });
      } finally {
        setCaseSaving(false);
      }
    },
    [applyDisputesUpdate]
  );

  const handleDeleteDisputeCase = useCallback(
    async (disputeCaseId) => {
      setCaseSaving(true);
      setDisputeStatus(null);
      try {
        await deleteCustomerDisputeCase(disputeCaseId);
        applyDisputesUpdate((previous) => previous.filter((item) => item.id !== disputeCaseId));
        setDisputeStatus({ tone: 'success', message: 'Dispute case removed.' });
      } catch (caught) {
        setDisputeStatus({
          tone: 'error',
          message: caught?.message || 'Unable to remove dispute case.'
        });
      } finally {
        setCaseSaving(false);
      }
    },
    [applyDisputesUpdate]
  );

  const openCreateDisputeTask = useCallback((disputeCase) => {
    setActiveTask({
      ...normaliseDisputeTask({ ...disputeTaskTemplate, disputeCaseId: disputeCase.id }),
      caseTitle: disputeCase.title
    });
    setTaskStatus(null);
    setTaskModalOpen(true);
  }, []);

  const openEditDisputeTask = useCallback((disputeCase, task) => {
    setActiveTask({ ...normaliseDisputeTask(task), caseTitle: disputeCase.title });
    setTaskStatus(null);
    setTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setTaskModalOpen(false);
    setActiveTask(null);
  }, []);

  const handleDisputeTaskSubmit = useCallback(
    async (form) => {
      setTaskSaving(true);
      setTaskStatus(null);
      try {
        const payload = {
          label: form.label?.trim() || '',
          status: form.status,
          dueAt: formatDateOutput(form.dueAt),
          assignedTo: form.assignedTo?.trim() || undefined,
          instructions: form.instructions?.trim() || undefined,
          completedAt: formatDateOutput(form.completedAt)
        };

        const response = form.id
          ? await updateCustomerDisputeTask(form.disputeCaseId, form.id, payload)
          : await createCustomerDisputeTask(form.disputeCaseId, payload);

        const savedTask = normaliseDisputeTask(response.task);

        applyDisputesUpdate((previous) =>
          previous.map((item) => {
            if (item.id !== form.disputeCaseId) {
              return item;
            }
            const tasks = form.id
              ? item.tasks.map((task) => (task.id === savedTask.id ? savedTask : task))
              : [...item.tasks, savedTask];
            return { ...item, tasks };
          })
        );

        setTaskStatus({
          tone: 'success',
          message: form.id ? 'Follow-up task updated.' : 'Follow-up task added.'
        });
        setTaskModalOpen(false);
        setActiveTask(null);
      } catch (caught) {
        setTaskStatus({
          tone: 'error',
          message: caught?.message || 'Unable to save follow-up task.'
        });
      } finally {
        setTaskSaving(false);
      }
    },
    [applyDisputesUpdate]
  );

  const handleDeleteDisputeTask = useCallback(
    async (disputeCaseId, taskId) => {
      setTaskSaving(true);
      setTaskStatus(null);
      try {
        await deleteCustomerDisputeTask(disputeCaseId, taskId);
        applyDisputesUpdate((previous) =>
          previous.map((item) =>
            item.id === disputeCaseId ? { ...item, tasks: item.tasks.filter((task) => task.id !== taskId) } : item
          )
        );
        setTaskStatus({ tone: 'success', message: 'Follow-up task removed.' });
      } catch (caught) {
        setTaskStatus({
          tone: 'error',
          message: caught?.message || 'Unable to remove follow-up task.'
        });
      } finally {
        setTaskSaving(false);
      }
    },
    [applyDisputesUpdate]
  );

  const openCreateDisputeNote = useCallback((disputeCase) => {
    setActiveNote({
      ...normaliseDisputeNote({ ...disputeNoteTemplate, disputeCaseId: disputeCase.id }),
      caseTitle: disputeCase.title
    });
    setNoteStatus(null);
    setNoteModalOpen(true);
  }, []);

  const openEditDisputeNote = useCallback((disputeCase, note) => {
    setActiveNote({ ...normaliseDisputeNote(note), caseTitle: disputeCase.title });
    setNoteStatus(null);
    setNoteModalOpen(true);
  }, []);

  const closeNoteModal = useCallback(() => {
    setNoteModalOpen(false);
    setActiveNote(null);
  }, []);

  const handleDisputeNoteSubmit = useCallback(
    async (form) => {
      setNoteSaving(true);
      setNoteStatus(null);
      try {
        const payload = {
          noteType: form.noteType,
          visibility: form.visibility,
          body: form.body?.trim() || '',
          nextSteps: form.nextSteps?.trim() || undefined,
          pinned: Boolean(form.pinned)
        };

        const response = form.id
          ? await updateCustomerDisputeNote(form.disputeCaseId, form.id, payload)
          : await createCustomerDisputeNote(form.disputeCaseId, payload);

        const savedNote = normaliseDisputeNote(response.note);

        applyDisputesUpdate((previous) =>
          previous.map((item) => {
            if (item.id !== form.disputeCaseId) {
              return item;
            }
            const notes = form.id
              ? item.notes.map((note) => (note.id === savedNote.id ? savedNote : note))
              : [savedNote, ...item.notes];
            return { ...item, notes };
          })
        );

        setNoteStatus({
          tone: 'success',
          message: form.id ? 'Case note updated.' : 'Case note added.'
        });
        setNoteModalOpen(false);
        setActiveNote(null);
      } catch (caught) {
        setNoteStatus({
          tone: 'error',
          message: caught?.message || 'Unable to save case note.'
        });
      } finally {
        setNoteSaving(false);
      }
    },
    [applyDisputesUpdate]
  );

  const handleDeleteDisputeNote = useCallback(
    async (disputeCaseId, noteId) => {
      setNoteSaving(true);
      setNoteStatus(null);
      try {
        await deleteCustomerDisputeNote(disputeCaseId, noteId);
        applyDisputesUpdate((previous) =>
          previous.map((item) =>
            item.id === disputeCaseId ? { ...item, notes: item.notes.filter((note) => note.id !== noteId) } : item
          )
        );
        setNoteStatus({ tone: 'success', message: 'Case note removed.' });
      } catch (caught) {
        setNoteStatus({
          tone: 'error',
          message: caught?.message || 'Unable to remove case note.'
        });
      } finally {
        setNoteSaving(false);
      }
    },
    [applyDisputesUpdate]
  );

  const openCreateDisputeEvidence = useCallback((disputeCase) => {
    setActiveEvidence({
      ...normaliseDisputeEvidence({ ...disputeEvidenceTemplate, disputeCaseId: disputeCase.id }),
      caseTitle: disputeCase.title
    });
    setEvidenceStatus(null);
    setEvidenceModalOpen(true);
  }, []);

  const openEditDisputeEvidence = useCallback((disputeCase, evidence) => {
    setActiveEvidence({ ...normaliseDisputeEvidence(evidence), caseTitle: disputeCase.title });
    setEvidenceStatus(null);
    setEvidenceModalOpen(true);
  }, []);

  const closeEvidenceModal = useCallback(() => {
    setEvidenceModalOpen(false);
    setActiveEvidence(null);
  }, []);

  const handleDisputeEvidenceSubmit = useCallback(
    async (form) => {
      setEvidenceSaving(true);
      setEvidenceStatus(null);
      try {
        const payload = {
          label: form.label?.trim() || '',
          fileUrl: form.fileUrl?.trim() || '',
          fileType: form.fileType?.trim() || undefined,
          thumbnailUrl: form.thumbnailUrl?.trim() || undefined,
          notes: form.notes?.trim() || undefined
        };

        const response = form.id
          ? await updateCustomerDisputeEvidence(form.disputeCaseId, form.id, payload)
          : await createCustomerDisputeEvidence(form.disputeCaseId, payload);

        const savedEvidence = normaliseDisputeEvidence(response.evidence);

        applyDisputesUpdate((previous) =>
          previous.map((item) => {
            if (item.id !== form.disputeCaseId) {
              return item;
            }
            const evidenceItems = form.id
              ? item.evidence.map((entry) => (entry.id === savedEvidence.id ? savedEvidence : entry))
              : [savedEvidence, ...item.evidence];
            return { ...item, evidence: evidenceItems };
          })
        );

        setEvidenceStatus({
          tone: 'success',
          message: form.id ? 'Evidence updated.' : 'Evidence uploaded.'
        });
        setEvidenceModalOpen(false);
        setActiveEvidence(null);
      } catch (caught) {
        setEvidenceStatus({
          tone: 'error',
          message: caught?.message || 'Unable to save evidence.'
        });
      } finally {
        setEvidenceSaving(false);
      }
    },
    [applyDisputesUpdate]
  );

  const handleDeleteDisputeEvidence = useCallback(
    async (disputeCaseId, evidenceId) => {
      setEvidenceSaving(true);
      setEvidenceStatus(null);
      try {
        await deleteCustomerDisputeEvidence(disputeCaseId, evidenceId);
        applyDisputesUpdate((previous) =>
          previous.map((item) =>
            item.id === disputeCaseId
              ? { ...item, evidence: item.evidence.filter((entry) => entry.id !== evidenceId) }
              : item
          )
        );
        setEvidenceStatus({ tone: 'success', message: 'Evidence removed.' });
      } catch (caught) {
        setEvidenceStatus({
          tone: 'error',
          message: caught?.message || 'Unable to remove evidence.'
        });
      } finally {
        setEvidenceSaving(false);
      }
    },
    [applyDisputesUpdate]
  );

  const personaSummary = useMemo(() => {
    const contactCount = contacts.length;
    const locationCount = locations.length;
    const disputeCount = disputes.length;
    return `${contactCount} team contact${contactCount === 1 ? '' : 's'} • ${locationCount} location${
      locationCount === 1 ? '' : 's'
    } • ${disputeCount} dispute${disputeCount === 1 ? '' : 's'}`;
  }, [contacts.length, locations.length, disputes.length]);

  return {
    state: {
      loading,
      error,
      profile,
      contacts,
      locations,
      personaSummary,
      profileStatus,
      contactStatus,
      locationStatus,
      disputeStatus,
      profileSaving,
      contactSaving,
      locationSaving,
      caseSaving,
      taskSaving,
      noteSaving,
      evidenceSaving,
      disputes,
      disputeMetrics,
      contactModalOpen,
      locationModalOpen,
      activeContact,
      activeLocation,
      caseModalOpen,
      activeCase,
      taskModalOpen,
      activeTask,
      taskStatus,
      noteModalOpen,
      activeNote,
      noteStatus,
      evidenceModalOpen,
      activeEvidence,
      evidenceStatus
    },
    actions: {
      reload,
      handleProfileChange,
      handleProfileCheckbox,
      handleProfileSubmit,
      openCreateContact,
      openEditContact,
      closeContactModal,
      handleContactSubmit,
      handleDeleteContact,
      openCreateLocation,
      openEditLocation,
      closeLocationModal,
      handleLocationSubmit,
      handleDeleteLocation,
      openCreateDisputeCase,
      openEditDisputeCase,
      closeCaseModal,
      handleDisputeCaseSubmit,
      handleDeleteDisputeCase,
      openCreateDisputeTask,
      openEditDisputeTask,
      closeTaskModal,
      handleDisputeTaskSubmit,
      handleDeleteDisputeTask,
      openCreateDisputeNote,
      openEditDisputeNote,
      closeNoteModal,
      handleDisputeNoteSubmit,
      handleDeleteDisputeNote,
      openCreateDisputeEvidence,
      openEditDisputeEvidence,
      closeEvidenceModal,
      handleDisputeEvidenceSubmit,
      handleDeleteDisputeEvidence
    }
  };
};

export default useCustomerControl;
