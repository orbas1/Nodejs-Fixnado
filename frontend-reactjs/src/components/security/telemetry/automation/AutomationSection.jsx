import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../../../ui/Button.jsx';
import SegmentedControl from '../../../ui/SegmentedControl.jsx';
import StatusPill from '../../../ui/StatusPill.jsx';
import AutomationModal from './AutomationModal.jsx';

function AutomationRow({ task, onEdit, onArchive, capabilities }) {
  const archived = task.isActive === false;
  return (
    <tr className={`border-b border-slate-200 last:border-b-0 ${archived ? 'bg-secondary/40 text-slate-500' : ''}`}>
      <td className="px-4 py-3 align-top">
        <div className="font-semibold text-primary">{task.name}</div>
        <div className="text-xs text-slate-500">Status: {task.status}</div>
      </td>
      <td className="px-4 py-3 align-top text-sm text-slate-600">{task.notes || 'No notes provided.'}</td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={task.tone ?? 'info'}>
            {task.priority ? `Priority ${task.priority}` : 'Monitor'}
          </StatusPill>
          {archived ? <StatusPill tone="warning">Archived</StatusPill> : null}
        </div>
        {task.owner ? <div className="mt-2 text-xs text-slate-500">Owner: {task.owner}</div> : null}
        {task.dueAt ? <div className="mt-1 text-xs text-slate-500">Due: {task.dueAt}</div> : null}
        {task.signalKey ? <div className="mt-1 text-xs text-slate-500">Signal: {task.signalKey}</div> : null}
        {task.runbookUrl ? (
          <Button
            as="a"
            href={task.runbookUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
            icon={ArrowTopRightOnSquareIcon}
            iconPosition="end"
            className="mt-2 text-xs"
          >
            Open runbook
          </Button>
        ) : null}
      </td>
      <td className="px-4 py-3 align-top text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="tertiary"
            size="sm"
            icon={PencilSquareIcon}
            onClick={() => onEdit(task)}
            disabled={!capabilities?.canManageAutomation}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={TrashIcon}
            onClick={() => onArchive(task)}
            disabled={!capabilities?.canManageAutomation || !task?.id}
          >
            Archive
          </Button>
        </div>
      </td>
    </tr>
  );
}

AutomationRow.propTypes = {
  task: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  capabilities: PropTypes.shape({
    canManageAutomation: PropTypes.bool
  })
};

export default function AutomationSection({ automationTasks, capabilities, onSave, onArchive }) {
  const [filter, setFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const filteredTasks = useMemo(
    () =>
      (automationTasks ?? []).filter((task) =>
        filter === 'archived' ? task.isActive === false : task.isActive !== false
      ),
    [automationTasks, filter]
  );

  const handleEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    await onSave(payload, editingTask?.id ?? null);
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleArchive = async (task) => {
    if (!task?.id) return;
    await onArchive(task.id);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-primary">Automation backlog</h4>
          <p className="text-sm text-slate-600">AI and automation initiatives with their current readiness state.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            name="automation-visibility"
            value={filter}
            onChange={setFilter}
            size="sm"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' }
            ]}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={!capabilities?.canManageAutomation}
          >
            Log initiative
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Initiative</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <AutomationRow
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onArchive={handleArchive}
                capabilities={capabilities}
              />
            ))}
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                  {filter === 'archived'
                    ? 'No archived initiatives yet. Archive tasks to keep history without crowding the board.'
                    : 'The automation backlog is currently empty. Add an initiative to capture ownership and due dates.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <AutomationModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        task={editingTask}
        capabilities={capabilities}
      />
    </div>
  );
}

AutomationSection.propTypes = {
  automationTasks: PropTypes.arrayOf(PropTypes.object),
  capabilities: PropTypes.shape({
    canManageAutomation: PropTypes.bool
  }),
  onSave: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired
};

AutomationSection.defaultProps = {
  automationTasks: [],
  capabilities: null
};
