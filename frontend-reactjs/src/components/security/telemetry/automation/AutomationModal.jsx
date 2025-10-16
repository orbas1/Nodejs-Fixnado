import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import Button from '../../../ui/Button.jsx';
import TextInput from '../../../ui/TextInput.jsx';
import FormField from '../../../ui/FormField.jsx';

const automationStatusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' }
];

const automationPriorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

function normaliseTask(task) {
  if (!task) {
    return {
      name: '',
      status: 'planned',
      owner: '',
      notes: '',
      runbookUrl: '',
      dueAt: '',
      priority: 'medium',
      signalKey: '',
      isActive: true
    };
  }

  return {
    name: task.name ?? '',
    status: task.status ?? 'planned',
    owner: task.owner ?? '',
    notes: task.notes ?? '',
    runbookUrl: task.runbookUrl ?? '',
    dueAt: task.dueAt ? task.dueAt.slice(0, 16) : '',
    priority: task.priority ?? 'medium',
    signalKey: task.signalKey ?? '',
    isActive: task.isActive !== false
  };
}

export default function AutomationModal({ open, onClose, onSubmit, task, capabilities }) {
  const [form, setForm] = useState(() => normaliseTask(task));

  useEffect(() => {
    if (!open) return;
    setForm(normaliseTask(task));
  }, [task, open]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      status: form.status,
      owner: form.owner,
      notes: form.notes,
      runbookUrl: form.runbookUrl,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      priority: form.priority,
      signalKey: form.signalKey,
      isActive: Boolean(form.isActive)
    });
  };

  const disableActions = !capabilities?.canManageAutomation;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-primary">
                  {task?.id ? 'Edit automation initiative' : 'Create automation initiative'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-600">
                  Track posture remediation work with owners, due dates, and links to supporting documentation.
                </p>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <FormField label="Initiative" htmlFor="automation-name" required>
                    <TextInput
                      id="automation-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Deploy hardware security keys"
                      required
                      disabled={disableActions}
                    />
                  </FormField>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Owner" htmlFor="automation-owner">
                      <TextInput
                        id="automation-owner"
                        name="owner"
                        value={form.owner}
                        onChange={handleChange}
                        placeholder="Security engineering"
                        disabled={disableActions}
                      />
                    </FormField>
                    <FormField label="Related signal" htmlFor="automation-signal">
                      <TextInput
                        id="automation-signal"
                        name="signalKey"
                        value={form.signalKey}
                        onChange={handleChange}
                        placeholder="mfa_adoption"
                        disabled={disableActions}
                      />
                    </FormField>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Status" htmlFor="automation-status">
                      <select
                        id="automation-status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        disabled={disableActions}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {automationStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Priority" htmlFor="automation-priority">
                      <select
                        id="automation-priority"
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                        disabled={disableActions}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {automationPriorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Due date" htmlFor="automation-due">
                      <TextInput
                        id="automation-due"
                        name="dueAt"
                        type="datetime-local"
                        value={form.dueAt}
                        onChange={handleChange}
                        disabled={disableActions}
                      />
                    </FormField>
                    <FormField label="Runbook" htmlFor="automation-runbook">
                      <TextInput
                        id="automation-runbook"
                        name="runbookUrl"
                        value={form.runbookUrl}
                        onChange={handleChange}
                        placeholder="https://runbooks.fixnado.com/security/hardware"
                        disabled={disableActions}
                      />
                    </FormField>
                  </div>
                  <FormField label="Notes" htmlFor="automation-notes" helper="Share context or blockers">
                    <textarea
                      id="automation-notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={4}
                      disabled={disableActions}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </FormField>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        disabled={disableActions}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                      />
                      Active initiative
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} type="button">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={disableActions}>
                      Save initiative
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

AutomationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  task: PropTypes.object,
  capabilities: PropTypes.shape({
    canManageAutomation: PropTypes.bool
  })
};

AutomationModal.defaultProps = {
  task: null,
  capabilities: null
};
