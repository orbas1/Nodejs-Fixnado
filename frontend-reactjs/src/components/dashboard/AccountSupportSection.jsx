import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  createAccountSupportTask,
  updateAccountSupportTask,
  appendAccountSupportTaskUpdate
} from '../../api/accountSupportClient.js';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_external', label: 'Waiting on external' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' }
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const CHANNEL_OPTIONS = [
  { value: 'concierge', label: 'Concierge' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'slack', label: 'Slack' },
  { value: 'self_service', label: 'Self-service' }
];

const STATUS_META = {
  open: { label: 'Open', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  in_progress: { label: 'In progress', tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  waiting_external: { label: 'Waiting external', tone: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  resolved: { label: 'Resolved', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  dismissed: { label: 'Dismissed', tone: 'border-slate-200 bg-slate-50 text-slate-500' }
};

const PRIORITY_META = {
  critical: { label: 'Critical', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  high: { label: 'High', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  medium: { label: 'Medium', tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  low: { label: 'Low', tone: 'border-slate-200 bg-slate-50 text-slate-500' }
};

const CHANNEL_LABELS = {
  concierge: 'Concierge',
  email: 'Email',
  phone: 'Phone',
  slack: 'Slack',
  self_service: 'Self-service'
};

const DEFAULT_FORM_STATE = {
  title: '',
  summary: '',
  priority: 'medium',
  channel: 'concierge',
  dueAt: '',
  assignedTo: '',
  assignedToRole: '',
  createConversation: false
};

function toInputValue(dateValue) {
  if (!dateValue) {
    return '';
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return '—';
  }
  const date = new Date(dateValue);
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
}

function formatRelative(dateValue) {
  if (!dateValue) {
    return '—';
  }
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) {
    return '—';
  }
  const diffMs = Date.now() - target.getTime();
  const inFuture = diffMs < 0;
  const diffMinutes = Math.round(Math.abs(diffMs) / 60000);

  const pluralise = (value, unit) => `${value} ${unit}${value === 1 ? '' : 's'}`;

  if (diffMinutes < 1) {
    return inFuture ? 'in moments' : 'moments ago';
  }
  if (diffMinutes < 60) {
    return inFuture ? `in ${pluralise(diffMinutes, 'minute')}` : `${pluralise(diffMinutes, 'minute')} ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return inFuture ? `in ${pluralise(diffHours, 'hour')}` : `${pluralise(diffHours, 'hour')} ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return inFuture ? `in ${pluralise(diffDays, 'day')}` : `${pluralise(diffDays, 'day')} ago`;
}

function recalculateStats(taskList) {
  return taskList.reduce(
    (acc, task) => {
      const status = task.status || 'open';
      if (status === 'open') acc.open += 1;
      else if (status === 'in_progress') acc.inProgress += 1;
      else if (status === 'waiting_external') acc.waitingExternal += 1;
      else if (status === 'resolved') acc.resolved += 1;
      else if (status === 'dismissed') acc.dismissed += 1;
      return acc;
    },
    { open: 0, inProgress: 0, waitingExternal: 0, resolved: 0, dismissed: 0 }
  );
}

function TaskCard({ task, onSaveDetails, onAddUpdate }) {
  const [details, setDetails] = useState({
    assignedTo: task.assignedTo || '',
    assignedToRole: task.assignedToRole || '',
    dueAt: toInputValue(task.dueAt),
    priority: task.priority || 'medium',
    channel: task.channel || 'concierge'
  });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [noteError, setNoteError] = useState(null);

  const statusMeta = STATUS_META[task.status] || STATUS_META.open;
  const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;

  useEffect(() => {
    setDetails({
      assignedTo: task.assignedTo || '',
      assignedToRole: task.assignedToRole || '',
      dueAt: toInputValue(task.dueAt),
      priority: task.priority || 'medium',
      channel: task.channel || 'concierge'
    });
  }, [task.assignedTo, task.assignedToRole, task.dueAt, task.priority, task.channel]);

  const handleDetailChange = (field) => (event) => {
    setDetails((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const runSave = async (payload) => {
    setSaving(true);
    setDetailsError(null);
    try {
      await onSaveDetails(task.id, payload);
    } catch (error) {
      setDetailsError(error?.message || 'Unable to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDetails = async () => {
    const payload = {
      ...details,
      dueAt: details.dueAt,
      priority: details.priority,
      channel: details.channel,
      assignedTo: details.assignedTo,
      assignedToRole: details.assignedToRole
    };
    await runSave(payload);
  };

  const handleQuickStatus = async (targetStatus) => {
    await runSave({ status: targetStatus });
  };

  const handleAddUpdate = async () => {
    if (!note.trim()) {
      setNoteError('Add a note before submitting');
      return;
    }
    setNoteError(null);
    setNoteSubmitting(true);
    try {
      await onAddUpdate(task.id, {
        body: note,
        status: noteStatus || undefined
      });
      setNote('');
      setNoteStatus('');
    } catch (error) {
      setNoteError(error?.message || 'Unable to record update');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const updates = Array.isArray(task.updates) ? task.updates : [];

  return (
    <article className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-primary">{task.title}</h3>
          <p className="text-sm text-slate-600">{task.summary}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.tone}`}>
              {statusMeta.label}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${priorityMeta.tone}`}>
              Priority: {priorityMeta.label}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <button
            type="button"
            onClick={() => handleQuickStatus('in_progress')}
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 hover:border-sky-300 disabled:opacity-60"
            disabled={saving || task.status === 'in_progress'}
          >
            Move to in progress
          </button>
          <button
            type="button"
            onClick={() => handleQuickStatus('resolved')}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300 disabled:opacity-60"
            disabled={saving || task.status === 'resolved'}
          >
            Mark resolved
          </button>
        </div>
      </header>

      <section className="grid gap-4 text-sm text-slate-600 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignment</p>
            <p className="mt-1 text-primary">{task.assignedTo || 'Unassigned'}</p>
            {task.assignedToRole && <p className="text-xs text-slate-500">Role: {task.assignedToRole}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</p>
            <p className="mt-1 text-primary">{CHANNEL_LABELS[task.channel] || task.channel || 'Concierge'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due</p>
            <p className="mt-1 text-primary">{formatDateLabel(task.dueAt)}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-primary">{formatDateLabel(task.createdAt)}</p>
            <p className="text-xs text-slate-500">{task.createdBy || 'Fixnado concierge'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</p>
            <p className="mt-1 text-primary">{formatDateLabel(task.updatedAt)}</p>
            <p className="text-xs text-slate-500">{formatRelative(task.updatedAt)}</p>
          </div>
          {task.conversationUrl ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversation</p>
              <Link
                to={task.conversationUrl}
                className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-primary"
              >
                Open support thread <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <h4 className="text-sm font-semibold text-primary">Update details</h4>
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Assigned to
            <input
              type="text"
              value={details.assignedTo}
              onChange={handleDetailChange('assignedTo')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
              placeholder="Ops lead"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Role
            <input
              type="text"
              value={details.assignedToRole}
              onChange={handleDetailChange('assignedToRole')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
              placeholder="customer_admin"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Due date
            <input
              type="datetime-local"
              value={details.dueAt}
              onChange={handleDetailChange('dueAt')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Priority
            <select
              value={details.priority}
              onChange={handleDetailChange('priority')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Channel
            <select
              value={details.channel}
              onChange={handleDetailChange('channel')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSaveDetails}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-glow hover:bg-primary/90 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save details'}
          </button>
          {detailsError ? <p className="text-xs font-semibold text-rose-600">{detailsError}</p> : null}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-primary">Activity log</h4>
          {updates.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No updates recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              {updates.map((update) => (
                <li key={update.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-primary">{update.createdBy || 'Team member'}</p>
                      <p className="text-xs text-slate-500">{formatDateLabel(update.createdAt)}</p>
                    </div>
                    {update.status ? (
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        STATUS_META[update.status]?.tone || STATUS_META.open.tone
                      }`}
                      >
                        {STATUS_META[update.status]?.label || update.status}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 leading-relaxed text-slate-700">{update.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h4 className="text-sm font-semibold text-primary">Log an update</h4>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
            placeholder="Share updates, mitigation steps, or context for support."
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Status</span>
              <select
                value={noteStatus}
                onChange={(event) => setNoteStatus(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-primary focus:outline-none"
              >
                <option value="">No change</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              {noteError ? <p className="text-xs font-semibold text-rose-600">{noteError}</p> : null}
              <button
                type="button"
                onClick={handleAddUpdate}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-glow hover:bg-accent/90 disabled:opacity-60"
                disabled={noteSubmitting}
              >
                {noteSubmitting ? 'Recording…' : 'Log update'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    status: PropTypes.string,
    priority: PropTypes.string,
    channel: PropTypes.string,
    dueAt: PropTypes.string,
    assignedTo: PropTypes.string,
    assignedToRole: PropTypes.string,
    createdBy: PropTypes.string,
    updatedAt: PropTypes.string,
    createdAt: PropTypes.string,
    conversationUrl: PropTypes.string,
    updates: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        body: PropTypes.string.isRequired,
        status: PropTypes.string,
        createdBy: PropTypes.string,
        createdAt: PropTypes.string
      })
    )
  }).isRequired,
  onSaveDetails: PropTypes.func.isRequired,
  onAddUpdate: PropTypes.func.isRequired
};

function AccountSupportSection({ section, context = {} }) {
  const initialTasks = Array.isArray(section?.data?.tasks) ? section.data.tasks : [];
  const [tasks, setTasks] = useState(initialTasks);
  const [formState, setFormState] = useState(() => ({ ...DEFAULT_FORM_STATE }));
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const insights = Array.isArray(section?.data?.insights) ? section.data.insights : [];
  const contacts = section?.data?.contacts || {};

  const baseStats = useMemo(() => {
    const provided = section?.data?.stats ?? {};
    const initialTotal =
      typeof provided.total === 'number'
        ? provided.total
        : initialTasks.length;
    return {
      open: provided.open ?? 0,
      inProgress: provided.inProgress ?? 0,
      waitingExternal: provided.waitingExternal ?? 0,
      resolved: provided.resolved ?? 0,
      dismissed: provided.dismissed ?? 0,
      total: initialTotal
    };
  }, [section, initialTasks.length]);

  const actorName = context?.user?.name || context?.user?.email || context?.company?.name || 'Account admin';
  const actorRole = context?.company ? 'customer_admin' : 'customer';

  const stats = useMemo(() => {
    if (tasks.length === 0) {
      return baseStats;
    }
    const computed = recalculateStats(tasks);
    const total = computed.open + computed.inProgress + computed.waitingExternal + computed.resolved + computed.dismissed;
    return { total, ...computed };
  }, [tasks, baseStats]);

  const updateTaskInState = (nextTask) => {
    setTasks((prev) => {
      const existingIndex = prev.findIndex((task) => task.id === nextTask.id);
      if (existingIndex === -1) {
        return [nextTask, ...prev];
      }
      const clone = [...prev];
      clone.splice(existingIndex, 1, nextTask);
      return clone;
    });
  };

  const handleSaveDetails = async (taskId, updates) => {
    const payload = { ...updates, updatedBy: actorName, updatedByRole: actorRole };
    if (payload.dueAt === '') {
      payload.dueAt = null;
    } else if (payload.dueAt) {
      payload.dueAt = new Date(payload.dueAt).toISOString();
    }
    const updatedTask = await updateAccountSupportTask(taskId, payload);
    updateTaskInState(updatedTask);
    return updatedTask;
  };

  const handleAddUpdate = async (taskId, payload) => {
    const updatePayload = {
      ...payload,
      createdBy: actorName,
      createdByRole: actorRole,
      updatedBy: actorName,
      updatedByRole: actorRole
    };
    const updatedTask = await appendAccountSupportTaskUpdate(taskId, updatePayload);
    updateTaskInState(updatedTask);
    return updatedTask;
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!formState.title.trim() || !formState.summary.trim()) {
      setFormError('Provide a title and summary for the task.');
      return;
    }
    setFormError(null);
    setFormSubmitting(true);
    try {
      const payload = {
        title: formState.title.trim(),
        summary: formState.summary.trim(),
        priority: formState.priority,
        channel: formState.channel,
        assignedTo: formState.assignedTo || undefined,
        assignedToRole: formState.assignedToRole || undefined,
        createdBy: actorName,
        createdByRole: actorRole,
        companyId: context?.companyId || context?.company?.id || null,
        userId: context?.userId || context?.user?.id || null,
        createConversation: formState.createConversation,
        companyDisplayName: context?.company?.name,
        userDisplayName: context?.user?.name,
        supportDisplayName: contacts.concierge || 'Fixnado Concierge'
      };
      if (formState.dueAt) {
        payload.dueAt = new Date(formState.dueAt).toISOString();
      }
      if (formState.createConversation) {
        if (payload.companyId) {
          payload.conversationOwner = { id: payload.companyId, type: 'company' };
        } else if (payload.userId) {
          payload.conversationOwner = { id: payload.userId, type: 'user' };
        }
      }
      const createdTask = await createAccountSupportTask(payload);
      setTasks((prev) => [createdTask, ...prev]);
      setFormState({ ...DEFAULT_FORM_STATE });
    } catch (error) {
      setFormError(error?.message || 'Unable to create support task');
    } finally {
      setFormSubmitting(false);
    }
  };

  const activeTasks = (stats.open ?? 0) + (stats.inProgress ?? 0) + (stats.waitingExternal ?? 0);
  const conversationCount =
    context?.totals?.conversations ?? section?.data?.stats?.conversations ?? '—';

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold text-primary">{section?.label || 'Account & Support'}</h2>
        {section?.description ? <p className="text-sm text-slate-600">{section.description}</p> : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-accent/20 bg-white/95 p-6 shadow-glow">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active tasks</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{activeTasks}</p>
          <p className="mt-1 text-xs text-slate-500">Open, in progress, or waiting on external parties.</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Resolved this window</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{stats.resolved}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Dismissed</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{stats.dismissed}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Support conversations</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{conversationCount}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {tasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No support tasks captured yet. Log an action below to coordinate with Fixnado concierge.
            </div>
          ) : (
            <div className="space-y-6">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onSaveDetails={handleSaveDetails} onAddUpdate={handleAddUpdate} />
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">Support contacts</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
                <dd className="mt-1">{contacts.email || 'support@fixnado.com'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</dt>
                <dd className="mt-1">{contacts.phone || '+44 20 4520 9282'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concierge</dt>
                <dd className="mt-1">{contacts.concierge || 'Fixnado concierge support'}</dd>
              </div>
              {contacts.knowledgeBase ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Knowledge base</dt>
                  <dd className="mt-1">
                    <a
                      href={contacts.knowledgeBase}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-accent hover:text-primary"
                    >
                      View documentation →
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">Concierge insights</h3>
            {insights.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No recommendations right now. Check back after new activity.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {insights.map((item) => (
                  <li key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="font-semibold text-primary">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.status}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

      <section className="rounded-3xl border border-accent/20 bg-white p-6 shadow-glow">
        <h3 className="text-sm font-semibold text-primary">Create a support task</h3>
        <p className="mt-2 text-sm text-slate-600">
          Log a follow-up for your team or request concierge assistance. Tasks feed the Account & Support board immediately.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleCreateTask}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                type="text"
                value={formState.title}
                onChange={handleFormChange('title')}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="Prepare concierge rota"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Priority
              <select
                value={formState.priority}
                onChange={handleFormChange('priority')}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Summary
              <textarea
                value={formState.summary}
                onChange={handleFormChange('summary')}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="Share context, SLAs, or escalations for Fixnado to action."
                required
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Channel
              <select
                value={formState.channel}
                onChange={handleFormChange('channel')}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
              >
                {CHANNEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due date
              <input
                type="datetime-local"
                value={formState.dueAt}
                onChange={handleFormChange('dueAt')}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assign to
              <input
                type="text"
                value={formState.assignedTo}
                onChange={handleFormChange('assignedTo')}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="Operations lead"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
              <input
                type="text"
                value={formState.assignedToRole}
                onChange={handleFormChange('assignedToRole')}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                placeholder="customer_admin"
              />
            </label>
          </div>
          <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <input
              type="checkbox"
              checked={formState.createConversation}
              onChange={handleFormChange('createConversation')}
              className="h-4 w-4 rounded border border-slate-300 text-primary focus:ring-primary"
            />
            Open a concierge conversation for this task
          </label>
          {formError ? <p className="text-xs font-semibold text-rose-600">{formError}</p> : null}
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-glow hover:bg-accent/90 disabled:opacity-60"
            disabled={formSubmitting}
          >
            {formSubmitting ? 'Creating…' : 'Create support task'}
          </button>
        </form>
      </section>
    </div>
  );
}

AccountSupportSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      insights: PropTypes.array,
      tasks: PropTypes.array,
      stats: PropTypes.object,
      contacts: PropTypes.object
    })
  }).isRequired,
  context: PropTypes.shape({
    user: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string
    }),
    company: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    }),
    userId: PropTypes.string,
    companyId: PropTypes.string,
    totals: PropTypes.shape({
      conversations: PropTypes.number
    })
  })
};

export default AccountSupportSection;
