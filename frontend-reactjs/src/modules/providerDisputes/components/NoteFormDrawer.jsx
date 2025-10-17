import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, Checkbox, FormField, Select, TextArea } from '../../../components/ui/index.js';
import { NOTE_TYPE_OPTIONS, NOTE_VISIBILITY_OPTIONS } from '../utils.js';

function NoteFormDrawer({ open, mode, form, onChange, onSubmit, onClose, saving, error }) {
  const title = mode === 'edit' ? 'Edit note' : 'New note';

  const handleFieldChange = (field) => (event) => {
    onChange({ [field]: event.target.value });
  };

  const handleCheckboxChange = (field) => (event) => {
    onChange({ [field]: event.target.checked });
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
                    <FormField id="note-type" label="Type">
                      <Select value={form.noteType} onChange={handleFieldChange('noteType')} options={NOTE_TYPE_OPTIONS} />
                    </FormField>

                    <FormField id="note-visibility" label="Visibility">
                      <Select
                        value={form.visibility}
                        onChange={handleFieldChange('visibility')}
                        options={NOTE_VISIBILITY_OPTIONS}
                      />
                    </FormField>

                    <FormField id="note-body" label="Body">
                      <TextArea value={form.body} onChange={handleFieldChange('body')} rows={4} required maxLength={4000} />
                    </FormField>

                    <FormField id="note-next" label="Next steps" optionalLabel="Optional">
                      <TextArea value={form.nextSteps} onChange={handleFieldChange('nextSteps')} rows={3} maxLength={2000} />
                    </FormField>

                    <Checkbox checked={form.pinned} onChange={handleCheckboxChange('pinned')}>
                      Pin note
                    </Checkbox>
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

NoteFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.shape({
    noteType: PropTypes.string,
    visibility: PropTypes.string,
    body: PropTypes.string,
    nextSteps: PropTypes.string,
    pinned: PropTypes.bool
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string
};

NoteFormDrawer.defaultProps = {
  saving: false,
  error: null
};

export default NoteFormDrawer;
