import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import TextInput from '../../components/ui/TextInput.jsx';
import TextArea from '../../components/ui/TextArea.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Card from '../../components/ui/Card.jsx';
import { useProviderOnboarding } from './ProviderOnboardingProvider.jsx';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function ProgressBar({ percentage }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${clamped}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

ProgressBar.propTypes = {
  percentage: PropTypes.number
};

function SummaryCard({ label, value, tone = 'neutral', icon: Icon }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        {Icon ? <Icon className="h-5 w-5 text-primary" aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <StatusPill tone={tone}>{tone === 'success' ? 'Healthy' : tone === 'warning' ? 'Attention' : 'Tracking'}</StatusPill>
    </Card>
  );
}

SummaryCard.defaultProps = {
  tone: 'neutral',
  icon: null
};

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tone: PropTypes.string,
  icon: PropTypes.elementType
};

function TaskForm({ enums, draft, onChange, onSubmit, onCancel, saving, editing }) {
  const handleChange = useCallback(
    (field) => (event) => {
      const value = event?.target?.value ?? '';
      onChange((current) => ({ ...current, [field]: value }));
    },
    [onChange]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-qa="provider-onboarding-task-form">
      <div className="space-y-2">
        <label htmlFor="onboarding-task-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Task title
        </label>
        <TextInput
          id="onboarding-task-title"
          value={draft.title}
          onChange={handleChange('title')}
          placeholder="Collect documentation package"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="onboarding-task-description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Description
        </label>
        <TextArea
          id="onboarding-task-description"
          value={draft.description}
          onChange={handleChange('description')}
          rows={4}
          placeholder="Outline the required files, reviewers, and due dates."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="onboarding-task-stage" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Stage
          </label>
          <Select
            id="onboarding-task-stage"
            value={draft.stage}
            onChange={handleChange('stage')}
            options={[{ label: 'Select stage', value: '' }, ...(enums.stages ?? [])]}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="onboarding-task-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <Select
            id="onboarding-task-status"
            value={draft.status}
            onChange={handleChange('status')}
            options={[{ label: 'Select status', value: '' }, ...(enums.taskStatuses ?? [])]}
            required
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="onboarding-task-priority" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Priority
          </label>
          <Select
            id="onboarding-task-priority"
            value={draft.priority}
            onChange={handleChange('priority')}
            options={[{ label: 'Select priority', value: '' }, ...(enums.taskPriorities ?? [])]}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="onboarding-task-due" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Due date (optional)
          </label>
          <TextInput
            id="onboarding-task-due"
            type="date"
            value={draft.dueDate}
            onChange={handleChange('dueDate')}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="onboarding-task-owner" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Owner user ID (optional)
        </label>
        <TextInput
          id="onboarding-task-owner"
          value={draft.ownerId}
          onChange={handleChange('ownerId')}
          placeholder="UUID of the assignee"
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={saving} loading={saving} icon={CheckCircleIcon}>
          {editing ? 'Update task' : 'Create task'}
        </Button>
        {editing ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel edit
          </Button>
        ) : null}
      </div>
    </form>
  );
}

TaskForm.propTypes = {
  enums: PropTypes.shape({
    stages: PropTypes.array,
    taskStatuses: PropTypes.array,
    taskPriorities: PropTypes.array
  }).isRequired,
  draft: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    stage: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    ownerId: PropTypes.string,
    dueDate: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  saving: PropTypes.bool,
  editing: PropTypes.bool
};

TaskForm.defaultProps = {
  onCancel: undefined,
  saving: false,
  editing: false
};

function RequirementForm({ enums, draft, onChange, onSubmit, onCancel, saving, editing }) {
  const handleChange = useCallback(
    (field) => (event) => {
      const value = event?.target?.value ?? '';
      onChange((current) => ({ ...current, [field]: value }));
    },
    [onChange]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-qa="provider-onboarding-requirement-form">
      <div className="space-y-2">
        <label htmlFor="onboarding-requirement-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Requirement name
        </label>
        <TextInput
          id="onboarding-requirement-name"
          value={draft.name}
          onChange={handleChange('name')}
          placeholder="Insurance certificate"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="onboarding-requirement-description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Description
        </label>
        <TextArea
          id="onboarding-requirement-description"
          value={draft.description}
          onChange={handleChange('description')}
          rows={4}
          placeholder="Provide the coverage summary, policy number, and expiry."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="onboarding-requirement-type" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Type
          </label>
          <Select
            id="onboarding-requirement-type"
            value={draft.type}
            onChange={handleChange('type')}
            options={[{ label: 'Select type', value: '' }, ...(enums.requirementTypes ?? [])]}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="onboarding-requirement-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <Select
            id="onboarding-requirement-status"
            value={draft.status}
            onChange={handleChange('status')}
            options={[{ label: 'Select status', value: '' }, ...(enums.requirementStatuses ?? [])]}
            required
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="onboarding-requirement-stage" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Stage
          </label>
          <Select
            id="onboarding-requirement-stage"
            value={draft.stage}
            onChange={handleChange('stage')}
            options={[{ label: 'Select stage', value: '' }, ...(enums.stages ?? [])]}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="onboarding-requirement-due" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Due date (optional)
          </label>
          <TextInput
            id="onboarding-requirement-due"
            type="date"
            value={draft.dueDate}
            onChange={handleChange('dueDate')}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="onboarding-requirement-reviewer" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Reviewer user ID (optional)
        </label>
        <TextInput
          id="onboarding-requirement-reviewer"
          value={draft.reviewerId}
          onChange={handleChange('reviewerId')}
          placeholder="UUID of reviewer"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="onboarding-requirement-link" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          External URL (optional)
        </label>
        <TextInput
          id="onboarding-requirement-link"
          value={draft.externalUrl}
          onChange={handleChange('externalUrl')}
          placeholder="https://documents.example.com/policy.pdf"
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={saving} loading={saving} icon={DocumentCheckIcon}>
          {editing ? 'Update requirement' : 'Add requirement'}
        </Button>
        {editing ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel edit
          </Button>
        ) : null}
      </div>
    </form>
  );
}

RequirementForm.propTypes = {
  enums: PropTypes.shape({
    stages: PropTypes.array,
    requirementTypes: PropTypes.array,
    requirementStatuses: PropTypes.array
  }).isRequired,
  draft: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    status: PropTypes.string,
    stage: PropTypes.string,
    reviewerId: PropTypes.string,
    documentId: PropTypes.string,
    externalUrl: PropTypes.string,
    dueDate: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  saving: PropTypes.bool,
  editing: PropTypes.bool
};

RequirementForm.defaultProps = {
  onCancel: undefined,
  saving: false,
  editing: false
};

function NoteForm({ enums, draft, onChange, onSubmit, saving }) {
  const handleChange = useCallback(
    (field) => (event) => {
      const value = event?.target?.value ?? '';
      onChange((current) => ({ ...current, [field]: value }));
    },
    [onChange]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-qa="provider-onboarding-note-form">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="onboarding-note-type" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Entry type
          </label>
          <Select
            id="onboarding-note-type"
            value={draft.type}
            onChange={handleChange('type')}
            options={[{ label: 'Select type', value: '' }, ...(enums.noteTypes ?? [])]}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="onboarding-note-visibility" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Visibility
          </label>
          <Select
            id="onboarding-note-visibility"
            value={draft.visibility}
            onChange={handleChange('visibility')}
            options={[{ label: 'Select visibility', value: '' }, ...(enums.noteVisibilities ?? [])]}
            required
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="onboarding-note-stage" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Stage
          </label>
          <Select
            id="onboarding-note-stage"
            value={draft.stage}
            onChange={handleChange('stage')}
            options={[{ label: 'Select stage', value: '' }, ...(enums.stages ?? [])]}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="onboarding-note-follow-up" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Follow-up date (optional)
          </label>
          <TextInput
            id="onboarding-note-follow-up"
            type="datetime-local"
            value={draft.followUpAt}
            onChange={handleChange('followUpAt')}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="onboarding-note-summary" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Summary
        </label>
        <TextInput
          id="onboarding-note-summary"
          value={draft.summary}
          onChange={handleChange('summary')}
          placeholder="Sent policy pack for legal review"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="onboarding-note-body" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Detail (optional)
        </label>
        <TextArea
          id="onboarding-note-body"
          value={draft.body}
          onChange={handleChange('body')}
          rows={3}
          placeholder="Include context, next steps, and blocking issues."
        />
      </div>
      <div className="pt-2">
        <Button type="submit" icon={PlusIcon} disabled={saving} loading={saving}>
          Log timeline entry
        </Button>
      </div>
    </form>
  );
}

NoteForm.propTypes = {
  enums: PropTypes.shape({
    stages: PropTypes.array,
    noteTypes: PropTypes.array,
    noteVisibilities: PropTypes.array
  }).isRequired,
  draft: PropTypes.shape({
    summary: PropTypes.string,
    body: PropTypes.string,
    type: PropTypes.string,
    visibility: PropTypes.string,
    stage: PropTypes.string,
    followUpAt: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

NoteForm.defaultProps = {
  saving: false
};

export default function OnboardingManagementWorkspace() {
  const {
    data,
    meta,
    loading,
    refreshing,
    error,
    saving,
    filters,
    setFilters,
    drafts,
    setTaskDraft,
    resetTaskDraft,
    setRequirementDraft,
    resetRequirementDraft,
    setNoteDraft,
    resetNoteDraft,
    lists,
    actions
  } = useProviderOnboarding();

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingRequirementId, setEditingRequirementId] = useState(null);

  const enums = data?.enums ?? {};
  const summary = data?.summary ?? null;
  const company = data?.company ?? null;

  const handleRefresh = useCallback(() => {
    actions.refresh().catch(() => {});
  }, [actions]);

  const handleTaskSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const payload = {
        ...drafts.task,
        ownerId: drafts.task.ownerId || undefined,
        dueDate: drafts.task.dueDate || undefined
      };
      const operation = editingTaskId
        ? actions.updateTask(editingTaskId, payload)
        : actions.createTask(payload);
      operation
        .then(() => {
          resetTaskDraft();
          setEditingTaskId(null);
        })
        .catch(() => {});
    },
    [actions, drafts.task, editingTaskId, resetTaskDraft]
  );

  const handleRequirementSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const payload = {
        ...drafts.requirement,
        reviewerId: drafts.requirement.reviewerId || undefined,
        documentId: drafts.requirement.documentId || undefined,
        externalUrl: drafts.requirement.externalUrl || undefined,
        dueDate: drafts.requirement.dueDate || undefined
      };
      const operation = editingRequirementId
        ? actions.updateRequirement(editingRequirementId, payload)
        : actions.createRequirement(payload);
      operation
        .then(() => {
          resetRequirementDraft();
          setEditingRequirementId(null);
        })
        .catch(() => {});
    },
    [actions, drafts.requirement, editingRequirementId, resetRequirementDraft]
  );

  const handleNoteSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const payload = {
        ...drafts.note,
        followUpAt: drafts.note.followUpAt || undefined,
        body: drafts.note.body || undefined
      };
      actions
        .createNote(payload)
        .then(() => {
          resetNoteDraft();
        })
        .catch(() => {});
    },
    [actions, drafts.note, resetNoteDraft]
  );

  const stageOptions = useMemo(() => [{ label: 'All stages', value: 'all' }, ...(enums.stages ?? [])], [enums.stages]);
  const taskStatusOptions = useMemo(
    () => [{ label: 'All statuses', value: 'all' }, ...(enums.taskStatuses ?? [])],
    [enums.taskStatuses]
  );
  const requirementStatusOptions = useMemo(
    () => [{ label: 'All statuses', value: 'all' }, ...(enums.requirementStatuses ?? [])],
    [enums.requirementStatuses]
  );

  const stageBadgeTone = summary?.stage === 'live' ? 'success' : summary?.stage === 'go-live' ? 'info' : 'neutral';
  const statusTone = summary?.status === 'onboarding' ? 'warning' : summary?.status === 'active' ? 'success' : 'neutral';

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="provider-onboarding-management">
      <PageHeader
        eyebrow="Provider control centre"
        title="Onboarding management"
        description="Coordinate SME onboarding tasks, compliance requirements, and launch readiness milestones."
        breadcrumbs={[
          { label: 'Dashboards', to: '/dashboards' },
          { label: 'Provider operations studio', to: '/dashboards/provider' },
          { label: 'Onboarding management' }
        ]}
        actions={[
          {
            label: 'Refresh data',
            icon: ArrowPathIcon,
            variant: 'secondary',
            loading: refreshing,
            onClick: handleRefresh
          }
        ]}
        meta={{
          lastUpdatedLabel: meta?.generatedAt
            ? `Last updated ${formatDateTime(meta.generatedAt)}`
            : 'No onboarding records yet'
        }}
      />

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-10 px-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-600" role="alert">
            <p className="font-semibold">Unable to load onboarding data</p>
            <p className="mt-1 text-rose-500">{error.message}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
            <Spinner className="h-6 w-6 text-primary" />
            <span className="ml-3 text-sm text-slate-600">Loading onboarding workspace…</span>
          </div>
        ) : null}

        {summary ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-label="Onboarding summary">
            <Card className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Current stage</p>
                  <h2 className="text-2xl font-semibold text-slate-900">{summary.stageLabel}</h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill tone={stageBadgeTone}>{summary.stageLabel}</StatusPill>
                  <StatusPill tone={statusTone}>{summary.statusLabel}</StatusPill>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Completion progress</span>
                  <span className="font-semibold text-slate-900">{summary.progress?.percentage ?? 0}%</span>
                </div>
                <ProgressBar percentage={summary.progress?.percentage ?? 0} />
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Tasks</dt>
                  <dd className="mt-1 text-sm text-slate-600">
                    {summary.totals?.tasks ?? 0} total · {summary.totals?.tasksCompleted ?? 0} completed ·{' '}
                    {summary.totals?.tasksBlocked ?? 0} blocked
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Requirements</dt>
                  <dd className="mt-1 text-sm text-slate-600">
                    {summary.totals?.requirements ?? 0} tracked · {summary.totals?.requirementsSatisfied ?? 0} satisfied
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Next deadline</dt>
                  <dd className="mt-1 text-sm text-slate-600">{formatDateTime(summary.nextDeadline)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Last update</dt>
                  <dd className="mt-1 text-sm text-slate-600">{formatDateTime(summary.lastUpdated)}</dd>
                </div>
              </dl>
            </Card>
            <div className="grid gap-4">
              <SummaryCard
                label="Live tasks"
                value={`${summary.totals?.tasks ?? 0}`}
                tone={summary.totals?.tasksBlocked ? 'warning' : 'info'}
                icon={ClipboardDocumentListIcon}
              />
              <SummaryCard
                label="Outstanding requirements"
                value={`${(summary.totals?.requirements ?? 0) - (summary.totals?.requirementsSatisfied ?? 0)}`}
                tone={(summary.totals?.requirements ?? 0) === (summary.totals?.requirementsSatisfied ?? 0) ? 'success' : 'warning'}
                icon={DocumentCheckIcon}
              />
            </div>
          </section>
        ) : null}

        <section className="space-y-6" aria-label="Onboarding filters">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="onboarding-filter-stage" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stage filter
              </label>
              <Select
                id="onboarding-filter-stage"
                value={filters.stage}
                onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value }))}
                options={stageOptions}
              />
            </div>
            <div>
              <label htmlFor="onboarding-filter-task" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Task status filter
              </label>
              <Select
                id="onboarding-filter-task"
                value={filters.taskStatus}
                onChange={(event) => setFilters((current) => ({ ...current, taskStatus: event.target.value }))}
                options={taskStatusOptions}
              />
            </div>
            <div>
              <label
                htmlFor="onboarding-filter-requirement"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Requirement status filter
              </label>
              <Select
                id="onboarding-filter-requirement"
                value={filters.requirementStatus}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, requirementStatus: event.target.value }))
                }
                options={requirementStatusOptions}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]" aria-label="Onboarding tasks">
          <Card className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Tasks</p>
                <h3 className="text-lg font-semibold text-slate-900">{editingTaskId ? 'Edit task' : 'Create task'}</h3>
              </div>
              {editingTaskId ? (
                <StatusPill tone="info">Editing</StatusPill>
              ) : (
                <StatusPill tone="neutral">New entry</StatusPill>
              )}
            </div>
            <TaskForm
              enums={enums}
              draft={drafts.task}
              onChange={setTaskDraft}
              onSubmit={handleTaskSubmit}
              onCancel={() => {
                setEditingTaskId(null);
                resetTaskDraft();
              }}
              saving={saving.task}
              editing={Boolean(editingTaskId)}
            />
          </Card>
          <Card className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Task backlog</h3>
              <StatusPill tone="info">{lists.tasks.length} items</StatusPill>
            </div>
            <div className="space-y-4">
              {lists.tasks.length === 0 ? (
                <p className="text-sm text-slate-600">No tasks match the current filters.</p>
              ) : (
                lists.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:border-primary/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Stage: {task.stageLabel}</p>
                        <p className="mt-1 text-xs text-slate-500">Status: {task.statusLabel}</p>
                        {task.owner?.name ? (
                          <p className="mt-1 text-xs text-slate-500">Owner: {task.owner.name}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
                        <span>Due {formatDate(task.dueDate)}</span>
                        <StatusPill tone={task.status === 'completed' ? 'success' : task.status === 'blocked' ? 'warning' : 'neutral'}>
                          {task.priorityLabel}
                        </StatusPill>
                      </div>
                    </div>
                    {task.description ? (
                      <p className="mt-3 text-sm text-slate-600">{task.description}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {task.status !== 'completed' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          icon={CheckCircleIcon}
                          onClick={() => actions.updateTaskStatus(task.id, 'completed').catch(() => {})}
                          disabled={saving.task}
                        >
                          Mark complete
                        </Button>
                      ) : null}
                      {task.status !== 'in_progress' && task.status !== 'completed' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => actions.updateTaskStatus(task.id, 'in_progress').catch(() => {})}
                          disabled={saving.task}
                        >
                          Move to in progress
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        icon={PencilSquareIcon}
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setTaskDraft({
                            title: task.title || '',
                            description: task.description || '',
                            stage: task.stage || 'documents',
                            status: task.status || 'not_started',
                            priority: task.priority || 'medium',
                            ownerId: task.owner?.id || '',
                            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        icon={TrashIcon}
                        onClick={() => actions.deleteTask(task.id).catch(() => {})}
                        disabled={saving.task}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]" aria-label="Onboarding requirements">
          <Card className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Requirements</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingRequirementId ? 'Edit requirement' : 'Add requirement'}
                </h3>
              </div>
              {editingRequirementId ? <StatusPill tone="info">Editing</StatusPill> : <StatusPill tone="neutral">New</StatusPill>}
            </div>
            <RequirementForm
              enums={enums}
              draft={drafts.requirement}
              onChange={setRequirementDraft}
              onSubmit={handleRequirementSubmit}
              onCancel={() => {
                setEditingRequirementId(null);
                resetRequirementDraft();
              }}
              saving={saving.requirement}
              editing={Boolean(editingRequirementId)}
            />
          </Card>
          <Card className="space-y-5 p-6 overflow-x-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Compliance checklist</h3>
              <StatusPill tone="info">{lists.requirements.length} tracked</StatusPill>
            </div>
            <div className="min-w-full overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Requirement</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Reviewer</th>
                    <th className="px-4 py-3" aria-label="Actions">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {lists.requirements.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                        No requirements match the current filters.
                      </td>
                    </tr>
                  ) : (
                    lists.requirements.map((requirement) => (
                      <tr key={requirement.id}>
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-slate-900">{requirement.name}</p>
                          {requirement.description ? (
                            <p className="mt-1 text-xs text-slate-500">{requirement.description}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-500">{requirement.stageLabel}</td>
                        <td className="px-4 py-4 align-top">
                          <Select
                            value={requirement.status}
                            onChange={(event) =>
                              actions
                                .updateRequirementStatus(requirement.id, event.target.value)
                                .catch(() => {})
                            }
                            options={enums.requirementStatuses ?? []}
                          />
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-500">{formatDate(requirement.dueDate)}</td>
                        <td className="px-4 py-4 align-top text-xs text-slate-500">
                          {requirement.reviewer?.name ?? '—'}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              icon={PencilSquareIcon}
                              onClick={() => {
                                setEditingRequirementId(requirement.id);
                                setRequirementDraft({
                                  name: requirement.name || '',
                                  description: requirement.description || '',
                                  type: requirement.type || 'document',
                                  status: requirement.status || 'pending',
                                  stage: requirement.stage || 'documents',
                                  reviewerId: requirement.reviewer?.id || '',
                                  documentId: requirement.documentId || '',
                                  externalUrl: requirement.externalUrl || '',
                                  dueDate: requirement.dueDate ? requirement.dueDate.slice(0, 10) : '',
                                  metadata: requirement.metadata || {}
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              icon={TrashIcon}
                              onClick={() => actions.deleteRequirement(requirement.id).catch(() => {})}
                              disabled={saving.requirement}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]" aria-label="Onboarding notes">
          <Card className="space-y-6 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Timeline</p>
              <h3 className="text-lg font-semibold text-slate-900">Log update</h3>
            </div>
            <NoteForm enums={enums} draft={drafts.note} onChange={setNoteDraft} onSubmit={handleNoteSubmit} saving={saving.note} />
          </Card>
          <Card className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Activity log</h3>
              <StatusPill tone="info">{lists.notes.length} entries</StatusPill>
            </div>
            <div className="space-y-4">
              {lists.notes.length === 0 ? (
                <p className="text-sm text-slate-600">No timeline entries recorded yet.</p>
              ) : (
                lists.notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{note.summary}</p>
                        <p className="text-xs text-slate-500">
                          {note.typeLabel} · {note.stageLabel} · {note.visibilityLabel}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</span>
                    </div>
                    {note.body ? <p className="mt-3 text-sm text-slate-600">{note.body}</p> : null}
                    <p className="mt-3 text-xs text-slate-500">Recorded by {note.author?.name ?? 'Unknown user'}</p>
                    {note.followUpAt ? (
                      <p className="mt-2 text-xs font-semibold text-amber-600">
                        Follow up {formatDateTime(note.followUpAt)}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        {company ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600" aria-label="Provider context">
            <h3 className="text-lg font-semibold text-slate-900">Provider context</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Trading name</p>
                <p className="mt-1 text-sm text-slate-700">{company.tradingName || company.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Support email</p>
                <p className="mt-1 text-sm text-slate-700">{company.supportEmail || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Support phone</p>
                <p className="mt-1 text-sm text-slate-700">{company.supportPhone || '—'}</p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
