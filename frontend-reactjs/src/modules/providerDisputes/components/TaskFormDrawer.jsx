import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, FormField, Select, TextArea, TextInput } from '../../../components/ui/index.js';
import { TASK_STATUS_OPTIONS, toDateTimeInput } from '../utils.js';

function TaskFormDrawer({ open, mode, form, onChange, onSubmit, onClose, saving, error }) {
  const title = mode === 'edit' ? 'Edit task' : 'New task';

  const handleFieldChange = (field) => (event) => {
    onChange({ [field]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-white shadow-xl">
                <form className="flex h-full flex-col" onSubmit={handleSubmit}>
                  <header className="border-b border-slate-200 bg-white/90 px-6 py-5">
                    <Dialog.Title className="text-lg font-semibold text-primary">{title}</Dialog.Title>
                    {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
                  </header>

                  <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    <FormField id="task-label" label="Label">
                      <TextInput value={form.label} onChange={handleFieldChange('label')} required maxLength={160} />
                    </FormField>

                    <FormField id="task-status" label="Status">
                      <Select value={form.status} onChange={handleFieldChange('status')} options={TASK_STATUS_OPTIONS} />
                    </FormField>

                    <FormField id="task-assignee" label="Assignee" optionalLabel="Optional">
                      <TextInput value={form.assignedTo} onChange={handleFieldChange('assignedTo')} maxLength={160} />
                    </FormField>

                    <FormField id="task-due" label="Due" optionalLabel="Optional">
                      <TextInput
                        type="datetime-local"
                        value={toDateTimeInput(form.dueAt)}
                        onChange={handleFieldChange('dueAt')}
                      />
                    </FormField>

                    <FormField id="task-instructions" label="Instructions" optionalLabel="Optional">
                      <TextArea
                        value={form.instructions}
                        onChange={handleFieldChange('instructions')}
                        rows={3}
                        maxLength={2000}
                      />
                    </FormField>
                  </div>

                  <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white/90 px-6 py-5">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={saving}>
                      {mode === 'edit' ? 'Save' : 'Create'}
                    </Button>
                  </footer>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

TaskFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.shape({
    label: PropTypes.string,
    status: PropTypes.string,
    assignedTo: PropTypes.string,
    dueAt: PropTypes.string,
    instructions: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string
};

TaskFormDrawer.defaultProps = {
  saving: false,
  error: null
};

export default TaskFormDrawer;
