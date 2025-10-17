import { useEffect, useMemo, useState } from 'react';
import Button from '../../../../components/ui/Button.jsx';
import Spinner from '../../../../components/ui/Spinner.jsx';
import { useServicemanTax } from '../ServicemanTaxProvider.jsx';
import TaxTaskDrawer from './TaxTaskDrawer.jsx';

const confirmAction = (message) => (typeof window === 'undefined' ? true : window.confirm(message));

const toIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export default function TaxTasksPanel() {
  const {
    tasks,
    tasksLoading,
    tasksError,
    tasksFilters,
    setTasksFilters,
    loadTasks,
    metadata,
    permissions,
    upsertTask,
    changeTaskStatus,
    removeTask,
    filings
  } = useServicemanTax();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const canManageTasks = permissions?.canManageTasks !== false;

  const statusOptions = useMemo(
    () => metadata?.taskStatuses ?? ['planned', 'in_progress', 'blocked', 'completed'],
    [metadata?.taskStatuses]
  );

  const priorityLabel = (priority) => (priority || '').replace(/_/g, ' ');

  const handleCreate = () => {
    setActiveTask(null);
    setDrawerOpen(true);
  };

  const handleEdit = (task) => {
    setActiveTask(task);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setActiveTask(null);
    setActionError(null);
  };

  const handleSave = async (draft) => {
    setSaving(true);
    try {
      const payload = {
        id: draft.id ?? undefined,
        title: draft.title,
        status: draft.status,
        priority: draft.priority,
        dueAt: toIso(draft.dueAt),
        completedAt: toIso(draft.completedAt),
        assignedTo: draft.assignedTo || null,
        filingId: draft.filingId || null,
        instructions: draft.instructions || null,
        checklist: (draft.checklist || [])
          .filter((item) => item.label)
          .map((item) => ({
            id: item.id || undefined,
            label: item.label,
            completed: Boolean(item.completed)
          }))
      };
      await upsertTask(payload);
      await loadTasks();
      handleClose();
    } catch (error) {
      setActionError(error?.message ?? 'Failed to save task');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (draft) => {
    if (!draft?.id) return;
    if (!confirmAction('Delete this task?')) {
      return;
    }
    setSaving(true);
    try {
      await removeTask(draft.id);
      await loadTasks();
      handleClose();
    } catch (error) {
      setActionError(error?.message ?? 'Failed to delete task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    if (!task?.id) return;
    try {
      await changeTaskStatus(task.id, { status });
      await loadTasks();
    } catch (error) {
      setActionError(error?.message ?? 'Failed to update task status');
    }
  };

  const groupedTasks = useMemo(() => {
    const list = tasks?.items ?? [];
    const groups = statusOptions.map((status) => ({
      status,
      label: status.replace(/_/g, ' '),
      items: list.filter((task) => task.status === status)
    }));
    const other = list.filter((task) => !statusOptions.includes(task.status));
    if (other.length) {
      groups.push({ status: 'other', label: 'Other', items: other });
    }
    return groups;
  }, [statusOptions, tasks?.items]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Tax tasks</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Coordinate prep work, reviews, and submissions across finance and compliance stakeholders. Track accountability and
            escalate blockers before deadlines slip.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleCreate} disabled={!canManageTasks}>
            New task
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filter by status
          <select
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={tasksFilters.status}
            onChange={(event) => setTasksFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      {tasksLoading ? (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Spinner className="h-4 w-4 text-primary" /> Loading tasks…
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groupedTasks.map((group) => (
          <div key={group.status} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{group.label}</h3>
                <span className="text-xs text-slate-500">{group.items.length} tasks</span>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {group.items.length ? (
                group.items.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary">{task.title}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-400">{priorityLabel(task.priority)}</p>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => handleEdit(task)} disabled={!canManageTasks}>
                        Edit
                      </Button>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p>Due {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '—'}</p>
                      <p>Assigned to {task.assignedTo || 'Unassigned'}</p>
                      {task.filingId ? <p>Linked filing #{task.filingId}</p> : null}
                    </div>
                    {task.checklist?.length ? (
                      <div className="mt-3 space-y-1">
                        {task.checklist.slice(0, 3).map((item) => (
                          <p key={item.id ?? item.label} className="text-xs text-slate-500">
                            {item.completed ? '✅' : '⬜️'} {item.label}
                          </p>
                        ))}
                        {task.checklist.length > 3 ? (
                          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
                            +{task.checklist.length - 3} more steps
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={task.status}
                        onChange={(event) => handleStatusChange(task, event.target.value)}
                        disabled={!canManageTasks}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => handleDelete(task)}
                        disabled={!canManageTasks}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-xs text-slate-500">
                  No tasks in this state.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {tasksError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {tasksError.message ?? 'Failed to load tasks'}
        </div>
      ) : null}
      {actionError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}
      {!canManageTasks ? (
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">You have read-only access to tasks.</p>
      ) : null}

      <TaxTaskDrawer
        open={drawerOpen}
        task={activeTask}
        metadata={metadata}
        filings={filings?.items ?? []}
        onClose={handleClose}
        onSubmit={handleSave}
        onDelete={handleDelete}
        saving={saving}
        canEdit={canManageTasks}
      />
    </section>
  );
}
