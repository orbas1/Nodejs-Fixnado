import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../components/ui/Button.jsx';
import TaxSideSheet from './TaxSideSheet.jsx';

const makeChecklistItem = () => ({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), label: '', completed: false });

const defaultTaskDraft = {
  id: null,
  title: '',
  status: 'planned',
  priority: 'normal',
  dueAt: '',
  completedAt: '',
  assignedTo: '',
  filingId: '',
  instructions: '',
  checklist: []
};

export default function TaxTaskDrawer({ open, task, metadata, filings, onClose, onSubmit, onDelete, saving, canEdit }) {
  const [draft, setDraft] = useState(defaultTaskDraft);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      const nextDraft = task
        ? {
            id: task.id ?? null,
            title: task.title ?? '',
            status: task.status ?? 'planned',
            priority: task.priority ?? 'normal',
            dueAt: task.dueAt ? task.dueAt.slice(0, 10) : '',
            completedAt: task.completedAt ? task.completedAt.slice(0, 10) : '',
            assignedTo: task.assignedTo ?? '',
            filingId: task.filingId ?? '',
            instructions: task.instructions ?? '',
            checklist: Array.isArray(task.checklist)
              ? task.checklist.map((item) => ({
                  id: item.id ?? makeChecklistItem().id,
                  label: item.label ?? '',
                  completed: Boolean(item.completed)
                }))
              : []
          }
        : { ...defaultTaskDraft };
      setDraft(nextDraft);
      setError(null);
    }
  }, [open, task]);

  const statusOptions = useMemo(() => {
    const statuses = metadata?.taskStatuses?.length ? metadata.taskStatuses : ['planned', 'in_progress', 'blocked', 'completed'];
    return statuses.map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [metadata?.taskStatuses]);

  const priorityOptions = useMemo(() => {
    const priorities = metadata?.taskPriorities?.length ? metadata.taskPriorities : ['low', 'normal', 'high', 'urgent'];
    return priorities.map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [metadata?.taskPriorities]);

  const filingOptions = useMemo(() => {
    const available = Array.isArray(filings) ? filings : [];
    return available.map((filing) => ({ value: filing.id, label: `${filing.taxYear} ${filing.period ? `- ${filing.period}` : ''}`.trim() }));
  }, [filings]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleChecklistChange = (id, field, value) => {
    setDraft((current) => ({
      ...current,
      checklist: current.checklist.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    }));
  };

  const addChecklistItem = () => {
    setDraft((current) => ({ ...current, checklist: [...current.checklist, makeChecklistItem()] }));
  };

  const removeChecklistItem = (id) => {
    setDraft((current) => ({ ...current, checklist: current.checklist.filter((item) => item.id !== id) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError('Task title is required');
      return;
    }
    try {
      await onSubmit(draft);
      setError(null);
    } catch (caught) {
      setError(caught?.message ?? 'Failed to save task');
    }
  };

  const footer = (
    <div className="flex flex-wrap justify-between gap-3">
      <div className="text-sm text-slate-500">Tasks power reminders and accountability. Assign to a filing to keep context.</div>
      <div className="flex flex-wrap gap-2">
        {draft.id && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="text-rose-600 hover:text-rose-700"
            onClick={() => onDelete(draft)}
            disabled={!canEdit || saving}
          >
            Delete
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" form="serviceman-tax-task-form" disabled={!canEdit || saving}>
          {saving ? 'Saving…' : 'Save task'}
        </Button>
      </div>
    </div>
  );

  return (
    <TaxSideSheet
      open={open}
      title={draft.id ? 'Edit tax task' : 'Create tax task'}
      description="Plan review steps, call-outs, and escalation actions for tax compliance."
      onClose={onClose}
      footer={footer}
    >
      <form id="serviceman-tax-task-form" className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title *</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              placeholder="Prepare VAT return"
              disabled={!canEdit || saving}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.status}
              onChange={(event) => handleFieldChange('status', event.target.value)}
              disabled={!canEdit || saving}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.priority}
              onChange={(event) => handleFieldChange('priority', event.target.value)}
              disabled={!canEdit || saving}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due date</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.dueAt}
              onChange={(event) => handleFieldChange('dueAt', event.target.value)}
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.completedAt}
              onChange={(event) => handleFieldChange('completedAt', event.target.value)}
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned to (user ID)</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.assignedTo}
              onChange={(event) => handleFieldChange('assignedTo', event.target.value)}
              placeholder="Optional assignee"
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked filing</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.filingId}
              onChange={(event) => handleFieldChange('filingId', event.target.value)}
              disabled={!canEdit || saving}
            >
              <option value="">Not linked</option>
              {filingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instructions</span>
          <textarea
            rows={4}
            className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={draft.instructions}
            onChange={(event) => handleFieldChange('instructions', event.target.value)}
            placeholder="Detail required actions, context, or stakeholder notes."
            disabled={!canEdit || saving}
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Checklist</h3>
              <p className="text-xs text-slate-500">Use checklist items to break down the task into auditable steps.</p>
            </div>
            <Button type="button" variant="ghost" onClick={addChecklistItem} disabled={!canEdit || saving}>
              Add checklist item
            </Button>
          </div>
          {draft.checklist.length ? (
            <div className="space-y-3">
              {draft.checklist.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      checked={item.completed}
                      onChange={(event) => handleChecklistChange(item.id, 'completed', event.target.checked)}
                      disabled={!canEdit || saving}
                    />
                    <input
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={item.label}
                      onChange={(event) => handleChecklistChange(item.id, 'label', event.target.value)}
                      placeholder="Checklist item"
                      disabled={!canEdit || saving}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700"
                    onClick={() => removeChecklistItem(item.id)}
                    disabled={!canEdit || saving}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-sm text-slate-500">
              No checklist items yet. Add steps to provide clarity and track completion.
            </p>
          )}
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </TaxSideSheet>
  );
}

TaxTaskDrawer.propTypes = {
  open: PropTypes.bool,
  task: PropTypes.object,
  metadata: PropTypes.object,
  filings: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  saving: PropTypes.bool,
  canEdit: PropTypes.bool
};

TaxTaskDrawer.defaultProps = {
  open: false,
  task: null,
  metadata: {},
  filings: [],
  onDelete: null,
  saving: false,
  canEdit: true
};
