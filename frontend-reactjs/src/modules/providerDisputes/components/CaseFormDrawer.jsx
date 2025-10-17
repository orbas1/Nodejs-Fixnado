import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, Checkbox, FormField, Select, TextArea, TextInput } from '../../../components/ui/index.js';
import {
  CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
  STATUS_OPTIONS,
  toDateTimeInput
} from '../utils.js';

function CaseFormDrawer({ open, mode, form, onChange, onSubmit, onClose, saving, error }) {
  const title = mode === 'edit' ? 'Edit case' : 'New case';

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
              <Dialog.Panel className="pointer-events-auto w-screen max-w-xl bg-white shadow-xl">
                <form className="flex h-full flex-col" onSubmit={handleSubmit}>
                  <header className="border-b border-slate-200 bg-white/90 px-8 py-6">
                    <Dialog.Title className="text-xl font-semibold text-primary">{title}</Dialog.Title>
                    {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
                  </header>

                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="grid gap-5">
                      <FormField id="case-title" label="Title">
                        <TextInput value={form.title} onChange={handleFieldChange('title')} required maxLength={200} />
                      </FormField>

                      <div className="grid gap-5 md:grid-cols-2">
                        <FormField id="case-status" label="Status">
                          <Select
                            value={form.status}
                            onChange={handleFieldChange('status')}
                            options={STATUS_OPTIONS}
                          />
                        </FormField>
                        <FormField id="case-severity" label="Severity">
                          <Select
                            value={form.severity}
                            onChange={handleFieldChange('severity')}
                            options={SEVERITY_OPTIONS}
                          />
                        </FormField>
                      </div>

                      <FormField id="case-category" label="Category">
                        <Select
                          value={form.category}
                          onChange={handleFieldChange('category')}
                          options={CATEGORY_OPTIONS}
                        />
                      </FormField>

                      <div className="grid gap-5 md:grid-cols-2">
                        <FormField id="case-amount" label="Amount">
                          <TextInput
                            value={form.amountDisputed}
                            onChange={handleFieldChange('amountDisputed')}
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </FormField>
                        <FormField id="case-currency" label="Currency">
                          <TextInput value={form.currency} onChange={handleFieldChange('currency')} maxLength={12} />
                        </FormField>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <FormField id="case-due" label="Due">
                          <TextInput
                            type="datetime-local"
                            value={toDateTimeInput(form.dueAt)}
                            onChange={handleFieldChange('dueAt')}
                          />
                        </FormField>
                        <FormField id="case-sla" label="SLA">
                          <TextInput
                            type="datetime-local"
                            value={toDateTimeInput(form.slaDueAt)}
                            onChange={handleFieldChange('slaDueAt')}
                          />
                        </FormField>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <FormField id="case-team" label="Team">
                          <TextInput value={form.assignedTeam} onChange={handleFieldChange('assignedTeam')} maxLength={160} />
                        </FormField>
                        <FormField id="case-owner" label="Owner">
                          <TextInput
                            value={form.assignedOwner}
                            onChange={handleFieldChange('assignedOwner')}
                            maxLength={160}
                          />
                        </FormField>
                      </div>

                      <FormField id="case-summary" label="Summary">
                        <TextArea value={form.summary} onChange={handleFieldChange('summary')} rows={3} maxLength={4000} />
                      </FormField>

                      <FormField id="case-next" label="Next step">
                        <TextArea value={form.nextStep} onChange={handleFieldChange('nextStep')} rows={3} maxLength={2000} />
                      </FormField>

                      <FormField id="case-resolution" label="Resolution notes" optionalLabel="Optional">
                        <TextArea
                          value={form.resolutionNotes}
                          onChange={handleFieldChange('resolutionNotes')}
                          rows={3}
                          maxLength={4000}
                        />
                      </FormField>

                      <FormField id="case-reference" label="Reference" optionalLabel="Optional">
                        <TextInput
                          value={form.externalReference}
                          onChange={handleFieldChange('externalReference')}
                          maxLength={160}
                        />
                      </FormField>

                      <FormField id="case-number" label="Case number" optionalLabel="Optional">
                        <TextInput
                          value={form.caseNumber}
                          onChange={handleFieldChange('caseNumber')}
                          maxLength={32}
                        />
                      </FormField>

                      <Checkbox checked={form.requiresFollowUp} onChange={handleCheckboxChange('requiresFollowUp')}>
                        Follow-up needed
                      </Checkbox>
                    </div>
                  </div>

                  <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white/90 px-8 py-6">
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

CaseFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.shape({
    title: PropTypes.string,
    status: PropTypes.string,
    severity: PropTypes.string,
    category: PropTypes.string,
    amountDisputed: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    dueAt: PropTypes.string,
    slaDueAt: PropTypes.string,
    assignedTeam: PropTypes.string,
    assignedOwner: PropTypes.string,
    summary: PropTypes.string,
    nextStep: PropTypes.string,
    resolutionNotes: PropTypes.string,
    externalReference: PropTypes.string,
    caseNumber: PropTypes.string,
    requiresFollowUp: PropTypes.bool
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string
};

CaseFormDrawer.defaultProps = {
  saving: false,
  error: null
};

export default CaseFormDrawer;
