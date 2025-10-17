import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getProviderOnboardingWorkspace,
  createProviderOnboardingTask,
  updateProviderOnboardingTask,
  updateProviderOnboardingTaskStatus,
  deleteProviderOnboardingTask,
  createProviderOnboardingRequirement,
  updateProviderOnboardingRequirement,
  updateProviderOnboardingRequirementStatus,
  deleteProviderOnboardingRequirement,
  createProviderOnboardingNote
} from '../../../api/providerOnboardingClient.js';

const createEmptyTaskDraft = (defaults = {}) => ({
  title: '',
  description: '',
  stage: 'documents',
  status: 'not_started',
  priority: 'medium',
  ownerId: '',
  dueDate: '',
  ...defaults
});

const createEmptyRequirementDraft = (defaults = {}) => ({
  name: '',
  description: '',
  type: 'document',
  status: 'pending',
  stage: 'documents',
  reviewerId: '',
  documentId: '',
  externalUrl: '',
  dueDate: '',
  metadata: {},
  ...defaults
});

const createEmptyNoteDraft = (defaults = {}) => ({
  summary: '',
  body: '',
  type: 'update',
  visibility: 'internal',
  stage: 'documents',
  followUpAt: '',
  ...defaults
});

export function useProviderOnboardingState({ companyId: initialCompanyId = null } = {}) {
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [workspace, setWorkspace] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({ task: false, requirement: false, note: false });
  const [filters, setFilters] = useState({ stage: 'all', taskStatus: 'all', requirementStatus: 'all' });

  const [taskDraft, setTaskDraft] = useState(() => createEmptyTaskDraft());
  const [requirementDraft, setRequirementDraft] = useState(() => createEmptyRequirementDraft());
  const [noteDraft, setNoteDraft] = useState(() => createEmptyNoteDraft());

  const loadWorkspace = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        const response = await getProviderOnboardingWorkspace({ companyId });
        setWorkspace(response?.data ?? null);
        setMeta(response?.meta ?? null);
        setError(null);
        return response;
      } catch (error_) {
        setError(error_ instanceof Error ? error_ : new Error('Unable to load onboarding workspace'));
        throw error_;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [companyId]
  );

  useEffect(() => {
    loadWorkspace().catch(() => {});
  }, [loadWorkspace]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadWorkspace({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadWorkspace]);

  const withSavingState = useCallback(
    (key, fn) =>
      async (...args) => {
        setSaving((current) => ({ ...current, [key]: true }));
        try {
          const result = await fn(...args);
          await refresh();
          return result;
        } catch (error_) {
          setError(error_ instanceof Error ? error_ : new Error('Onboarding update failed'));
          throw error_;
        } finally {
          setSaving((current) => ({ ...current, [key]: false }));
        }
      },
    [refresh]
  );

  const createTask = useMemo(
    () =>
      withSavingState('task', async (payload) => {
        const response = await createProviderOnboardingTask(payload, { companyId });
        return response?.data ?? null;
      }),
    [companyId, withSavingState]
  );

  const updateTask = useMemo(
    () =>
      withSavingState('task', async (taskId, payload) => {
        const response = await updateProviderOnboardingTask(taskId, payload, { companyId });
        return response?.data ?? null;
      }),
    [companyId, withSavingState]
  );

  const updateTaskStatus = useMemo(
    () =>
      withSavingState('task', async (taskId, status) => {
        const response = await updateProviderOnboardingTaskStatus(taskId, status, { companyId });
        return response?.data ?? null;
      }),
    [companyId, withSavingState]
  );

  const deleteTask = useMemo(
    () =>
      withSavingState('task', async (taskId) => {
        await deleteProviderOnboardingTask(taskId, { companyId });
        return { status: 'deleted' };
      }),
    [companyId, withSavingState]
  );

  const createRequirement = useMemo(
    () =>
      withSavingState('requirement', async (payload) => {
        const response = await createProviderOnboardingRequirement(payload, { companyId });
        return response?.data ?? null;
      }),
    [companyId, withSavingState]
  );

  const updateRequirement = useMemo(
    () =>
      withSavingState('requirement', async (requirementId, payload) => {
        const response = await updateProviderOnboardingRequirement(requirementId, payload, { companyId });
        return response?.data ?? null;
      }),
    [companyId, withSavingState]
  );

  const updateRequirementStatus = useMemo(
    () =>
      withSavingState('requirement', async (requirementId, status) => {
        const response = await updateProviderOnboardingRequirementStatus(requirementId, status, { companyId });
        return response?.data ?? null;
      }),
    [companyId, withSavingState]
  );

  const deleteRequirement = useMemo(
    () =>
      withSavingState('requirement', async (requirementId) => {
        await deleteProviderOnboardingRequirement(requirementId, { companyId });
        return { status: 'deleted' };
      }),
    [companyId, withSavingState]
  );

  const createNote = useMemo(
    () =>
      withSavingState('note', async (payload) => {
        const response = await createProviderOnboardingNote(payload, { companyId });
        return response?.data ?? null;
      }),
    [companyId, withSavingState]
  );

  const resetTaskDraft = useCallback(() => {
    setTaskDraft(createEmptyTaskDraft());
  }, []);

  const resetRequirementDraft = useCallback(() => {
    setRequirementDraft(createEmptyRequirementDraft());
  }, []);

  const resetNoteDraft = useCallback(() => {
    setNoteDraft(createEmptyNoteDraft());
  }, []);

  const tasks = useMemo(() => workspace?.tasks ?? [], [workspace?.tasks]);
  const requirements = useMemo(() => workspace?.requirements ?? [], [workspace?.requirements]);
  const notes = useMemo(() => workspace?.notes ?? [], [workspace?.notes]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatch = filters.taskStatus === 'all' || task.status === filters.taskStatus;
      const stageMatch = filters.stage === 'all' || task.stage === filters.stage;
      return statusMatch && stageMatch;
    });
  }, [tasks, filters.stage, filters.taskStatus]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter((requirement) => {
      const statusMatch =
        filters.requirementStatus === 'all' || requirement.status === filters.requirementStatus;
      const stageMatch = filters.stage === 'all' || requirement.stage === filters.stage;
      return statusMatch && stageMatch;
    });
  }, [requirements, filters.requirementStatus, filters.stage]);

  return {
    companyId,
    setCompanyId,
    data: workspace,
    meta,
    loading,
    refreshing,
    error,
    saving,
    filters,
    setFilters,
    drafts: {
      task: taskDraft,
      requirement: requirementDraft,
      note: noteDraft
    },
    setTaskDraft,
    resetTaskDraft,
    setRequirementDraft,
    resetRequirementDraft,
    setNoteDraft,
    resetNoteDraft,
    lists: {
      tasks: filteredTasks,
      requirements: filteredRequirements,
      notes
    },
    actions: {
      refresh,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      createRequirement,
      updateRequirement,
      updateRequirementStatus,
      deleteRequirement,
      createNote
    }
  };
}

export default useProviderOnboardingState;
