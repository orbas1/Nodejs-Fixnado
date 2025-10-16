import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ModalShell from './ModalShell.jsx';
import { InlineBanner, Field, TextInput, SelectField } from './FormControls.jsx';
import { disputeTaskTemplate, disputeTaskStatusOptions } from './constants.js';

const DisputeTaskModal = ({ open, task, onClose, onSubmit, saving, status }) => {
  const [form, setForm] = useState(disputeTaskTemplate);

  useEffect(() => {
    if (task) {
      setForm({ ...disputeTaskTemplate, ...task });
    } else {
      setForm({ ...disputeTaskTemplate });
    }
  }, [task]);

  const handleChange = (field) => (value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={form.id ? 'Edit follow-up task' : 'Add follow-up task'}
      description={task?.caseTitle ? `Case: ${task.caseTitle}` : 'Create structured actions to progress the dispute.'}
      footer={[
        <button
          key="cancel"
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300"
        >
          Cancel
        </button>,
        <button
          key="submit"
          type="submit"
          form="dispute-task-form"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : form.id ? 'Update task' : 'Add task'}
        </button>
      ]}
    >
      <form id="dispute-task-form" className="space-y-4" onSubmit={handleSubmit}>
        <InlineBanner tone={status?.tone} message={status?.message} />
        <Field id="task-label" label="Task label" description="Summarise the required action.">
          <TextInput id="task-label" value={form.label} onChange={handleChange('label')} placeholder="Request provider evidence" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="task-status" label="Status">
            <SelectField id="task-status" value={form.status} onChange={handleChange('status')} options={disputeTaskStatusOptions} />
          </Field>
          <Field id="task-dueAt" label="Due at">
            <TextInput id="task-dueAt" type="datetime-local" value={form.dueAt} onChange={handleChange('dueAt')} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="task-assignedTo" label="Assigned to">
            <TextInput id="task-assignedTo" value={form.assignedTo} onChange={handleChange('assignedTo')} placeholder="Finance queue" />
          </Field>
          <Field id="task-completedAt" label="Completed at">
            <TextInput id="task-completedAt" type="datetime-local" value={form.completedAt} onChange={handleChange('completedAt')} />
          </Field>
        </div>
        <Field id="task-instructions" label="Instructions" description="Provide clear context or links for the assignee.">
          <TextInput
            id="task-instructions"
            value={form.instructions}
            onChange={handleChange('instructions')}
            placeholder="Call customer with findings and log transcript"
          />
        </Field>
      </form>
    </ModalShell>
  );
};

DisputeTaskModal.propTypes = {
  open: PropTypes.bool.isRequired,
  task: PropTypes.shape({
    id: PropTypes.string,
    disputeCaseId: PropTypes.string,
    label: PropTypes.string,
    status: PropTypes.string,
    dueAt: PropTypes.string,
    assignedTo: PropTypes.string,
    instructions: PropTypes.string,
    completedAt: PropTypes.string,
    caseTitle: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({ tone: PropTypes.string, message: PropTypes.string })
};

DisputeTaskModal.defaultProps = {
  task: null,
  saving: false,
  status: null
};

export default DisputeTaskModal;
