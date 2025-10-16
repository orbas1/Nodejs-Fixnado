const API_BASE = '/api/panel/provider/onboarding';

const toQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') {
      return;
    }
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
};

const shouldUseFallback = () => {
  const { DEV = false, MODE } = import.meta.env ?? {};
  return Boolean(DEV) && MODE !== 'test';
};

const fallbackWorkspace = {
  data: {
    company: {
      id: 'company-demo',
      name: 'Metro Ops Collective',
      tradingName: 'Metro Ops Collective',
      supportEmail: 'onboarding@metro-ops.example',
      supportPhone: '+44 20 7123 4567',
      stage: 'documents',
      stageLabel: 'Document collection',
      status: 'onboarding',
      statusLabel: 'Onboarding'
    },
    summary: {
      stage: 'documents',
      stageLabel: 'Document collection',
      status: 'onboarding',
      statusLabel: 'Onboarding',
      totals: {
        tasks: 5,
        tasksCompleted: 2,
        tasksBlocked: 1,
        requirements: 4,
        requirementsSatisfied: 1
      },
      progress: {
        ratio: 0.333,
        percentage: 33
      },
      nextDeadline: new Date(Date.now() + 86400000).toISOString(),
      lastUpdated: new Date(Date.now() - 3600000).toISOString()
    },
    tasks: [
      {
        id: 'task-intake-briefing',
        title: 'Kick-off briefing with provider lead',
        description: 'Review success criteria, intake forms, and decision timelines.',
        status: 'completed',
        statusLabel: 'Completed',
        priority: 'medium',
        priorityLabel: 'Medium',
        stage: 'intake',
        stageLabel: 'Intake',
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 43200000).toISOString(),
        owner: { id: 'user-london', name: 'Jasmine Patel', email: 'jasmine@fixnado.example' }
      },
      {
        id: 'task-policy-upload',
        title: 'Upload H&S policies',
        description: 'Collect signed health and safety policy, plus training matrix.',
        status: 'in_progress',
        statusLabel: 'In progress',
        priority: 'high',
        priorityLabel: 'High',
        stage: 'documents',
        stageLabel: 'Document collection',
        dueDate: new Date(Date.now() + 172800000).toISOString(),
        completedAt: null,
        owner: { id: 'user-claire', name: 'Claire Morgan', email: 'claire@fixnado.example' }
      },
      {
        id: 'task-compliance-review',
        title: 'Compliance review sign-off',
        description: 'Review uploaded certification, escalate risks, and approve gating.',
        status: 'blocked',
        statusLabel: 'Blocked',
        priority: 'critical',
        priorityLabel: 'Critical',
        stage: 'compliance',
        stageLabel: 'Compliance review',
        dueDate: new Date(Date.now() + 259200000).toISOString(),
        completedAt: null,
        owner: { id: 'user-ops', name: 'Operations Desk', email: 'ops@fixnado.example' }
      }
    ],
    requirements: [
      {
        id: 'req-insurance',
        name: 'Public liability insurance',
        description: 'Upload certificate with £5m coverage and named insured parties.',
        type: 'insurance',
        typeLabel: 'Insurance',
        status: 'submitted',
        statusLabel: 'Submitted',
        stage: 'documents',
        stageLabel: 'Document collection',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        reviewer: { id: 'user-audit', name: 'Audit Team', email: 'audit@fixnado.example' }
      },
      {
        id: 'req-billing',
        name: 'Billing profile',
        description: 'Complete banking, remittance, and invoicing configuration.',
        type: 'payment',
        typeLabel: 'Payment & billing',
        status: 'pending',
        statusLabel: 'Pending',
        stage: 'go-live',
        stageLabel: 'Go-live preparation',
        dueDate: new Date(Date.now() + 432000000).toISOString(),
        reviewer: { id: 'user-finance', name: 'Finance Ops', email: 'finance@fixnado.example' }
      }
    ],
    notes: [
      {
        id: 'note-latest',
        type: 'update',
        typeLabel: 'Update',
        stage: 'documents',
        stageLabel: 'Document collection',
        visibility: 'shared',
        visibilityLabel: 'Shared with provider',
        summary: 'Insurance uploaded for review',
        body: 'Provider attached the insurance certificate and risk statement. Awaiting compliance sign-off.',
        author: { id: 'user-london', name: 'Jasmine Patel', email: 'jasmine@fixnado.example' },
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'note-risk',
        type: 'risk',
        typeLabel: 'Risk',
        stage: 'compliance',
        stageLabel: 'Compliance review',
        visibility: 'internal',
        visibilityLabel: 'Internal only',
        summary: 'Missing electrical competency evidence',
        body: 'Still awaiting proof for NICEIC certification. Escalated to provider lead for follow-up.',
        author: { id: 'user-ops', name: 'Operations Desk', email: 'ops@fixnado.example' },
        createdAt: new Date(Date.now() - 10800000).toISOString()
      }
    ],
    enums: {
      stages: [
        { value: 'intake', label: 'Intake' },
        { value: 'documents', label: 'Document collection' },
        { value: 'compliance', label: 'Compliance review' },
        { value: 'go-live', label: 'Go-live preparation' },
        { value: 'live', label: 'Live' }
      ],
      taskStatuses: [
        { value: 'not_started', label: 'Not started' },
        { value: 'in_progress', label: 'In progress' },
        { value: 'blocked', label: 'Blocked' },
        { value: 'completed', label: 'Completed' }
      ],
      taskPriorities: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ],
      requirementTypes: [
        { value: 'document', label: 'Document' },
        { value: 'insurance', label: 'Insurance' },
        { value: 'payment', label: 'Payment & billing' },
        { value: 'training', label: 'Training & enablement' },
        { value: 'integration', label: 'Integration' },
        { value: 'other', label: 'Other' }
      ],
      requirementStatuses: [
        { value: 'pending', label: 'Pending' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'waived', label: 'Waived' }
      ],
      noteTypes: [
        { value: 'update', label: 'Update' },
        { value: 'risk', label: 'Risk' },
        { value: 'decision', label: 'Decision' },
        { value: 'note', label: 'Note' }
      ],
      noteVisibilities: [
        { value: 'internal', label: 'Internal only' },
        { value: 'shared', label: 'Shared with provider' }
      ]
    }
  },
  meta: {
    companyId: 'company-demo',
    generatedAt: new Date().toISOString()
  }
};

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const error = new Error(body?.message || 'Provider onboarding request failed');
    error.status = response.status;
    error.code = body?.code ?? body?.message;
    throw error;
  }
  return body;
};

const request = async (path, { method = 'GET', body, signal, companyId } = {}) => {
  const query = companyId ? toQueryString({ companyId }) : '';
  const response = await fetch(`${API_BASE}${path}${query}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });
  return parseJson(response);
};

export const getProviderOnboardingWorkspace = async ({ companyId, signal } = {}) => {
  try {
    return await request('', { companyId, signal });
  } catch (error) {
    if ((error.status === 401 || error.status === 403) && !shouldUseFallback()) {
      throw error;
    }
    if (shouldUseFallback()) {
      console.warn('Falling back to provider onboarding mock workspace', error);
      return fallbackWorkspace;
    }
    throw error;
  }
};

export const createProviderOnboardingTask = (payload, { companyId, signal } = {}) =>
  request('/tasks', { method: 'POST', body: payload, companyId, signal });

export const updateProviderOnboardingTask = (taskId, payload, { companyId, signal } = {}) =>
  request(`/tasks/${taskId}`, { method: 'PUT', body: payload, companyId, signal });

export const updateProviderOnboardingTaskStatus = (taskId, status, { companyId, signal } = {}) =>
  request(`/tasks/${taskId}/status`, { method: 'PATCH', body: { status }, companyId, signal });

export const deleteProviderOnboardingTask = (taskId, { companyId, signal } = {}) =>
  request(`/tasks/${taskId}`, { method: 'DELETE', companyId, signal });

export const createProviderOnboardingRequirement = (payload, { companyId, signal } = {}) =>
  request('/requirements', { method: 'POST', body: payload, companyId, signal });

export const updateProviderOnboardingRequirement = (requirementId, payload, { companyId, signal } = {}) =>
  request(`/requirements/${requirementId}`, { method: 'PUT', body: payload, companyId, signal });

export const updateProviderOnboardingRequirementStatus = (requirementId, status, { companyId, signal } = {}) =>
  request(`/requirements/${requirementId}/status`, { method: 'PATCH', body: { status }, companyId, signal });

export const deleteProviderOnboardingRequirement = (requirementId, { companyId, signal } = {}) =>
  request(`/requirements/${requirementId}`, { method: 'DELETE', companyId, signal });

export const createProviderOnboardingNote = (payload, { companyId, signal } = {}) =>
  request('/notes', { method: 'POST', body: payload, companyId, signal });

export default {
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
};
