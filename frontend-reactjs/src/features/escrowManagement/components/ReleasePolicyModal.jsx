import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, Checkbox, FormField, StatusPill, TextInput } from '../../../components/ui/index.js';

const EMPTY_POLICY = {
  name: '',
  description: '',
  autoReleaseDays: '',
  requiresDualApproval: false,
  maxAmount: '',
  notifyRoles: '',
  documentChecklist: '',
  releaseConditions: ''
};

function normaliseArrayInput(value = '', delimiter = ',') {
  if (Array.isArray(value)) {
    return value.join(delimiter === '\n' ? '\n' : ', ');
  }
  if (typeof value !== 'string') {
    return '';
  }
  return value;
}

export default function ReleasePolicyModal({
  open,
  mode,
  initialPolicy,
  onClose,
  onSubmit,
  submitting,
  error
}) {
  const [form, setForm] = useState(EMPTY_POLICY);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_POLICY);
      setLocalError(null);
      return;
    }
    if (initialPolicy) {
      setForm({
        name: initialPolicy.name ?? '',
        description: initialPolicy.description ?? '',
        autoReleaseDays:
          initialPolicy.autoReleaseDays === undefined || initialPolicy.autoReleaseDays === null
            ? ''
            : String(initialPolicy.autoReleaseDays),
        requiresDualApproval: Boolean(initialPolicy.requiresDualApproval),
        maxAmount:
          initialPolicy.maxAmount === undefined || initialPolicy.maxAmount === null
            ? ''
            : String(initialPolicy.maxAmount),
        notifyRoles: normaliseArrayInput(initialPolicy.notifyRoles),
        documentChecklist: normaliseArrayInput(initialPolicy.documentChecklist),
        releaseConditions: normaliseArrayInput(initialPolicy.releaseConditions, '\n')
      });
    } else {
      setForm(EMPTY_POLICY);
    }
    setLocalError(null);
  }, [open, initialPolicy]);

  const title = useMemo(() => {
    if (mode === 'edit' && initialPolicy?.name) {
      return `Edit ${initialPolicy.name}`;
    }
    return mode === 'edit' ? 'Edit release policy' : 'Create release policy';
  }, [mode, initialPolicy]);

  const handleFieldChange = (field) => (event) => {
    const target = event?.target;
    const value = target?.type === 'checkbox' ? target.checked : target?.value ?? '';
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setLocalError('Policy name is required.');
      return;
    }
    const parsedAutoRelease =
      form.autoReleaseDays === '' ? undefined : Number.parseInt(form.autoReleaseDays, 10);
    const parsedMaxAmount =
      form.maxAmount === '' || form.maxAmount === null
        ? null
        : Number.parseFloat(form.maxAmount);

    const payload = {
      name: trimmedName,
      description: form.description.trim(),
      autoReleaseDays: Number.isNaN(parsedAutoRelease) ? undefined : parsedAutoRelease,
      requiresDualApproval: Boolean(form.requiresDualApproval),
      maxAmount: Number.isNaN(parsedMaxAmount) ? null : parsedMaxAmount,
      notifyRoles: form.notifyRoles
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean),
      documentChecklist: form.documentChecklist
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      releaseConditions: form.releaseConditions
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    };

    await onSubmit?.(payload);
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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-1">
                    <Dialog.Title className="text-xl font-semibold text-primary">{title}</Dialog.Title>
                    <p className="text-sm text-slate-600">
                      Define approval thresholds and evidence requirements before release instructions are sent to treasury.
                    </p>
                  </div>

                  {localError ? <StatusPill tone="danger">{localError}</StatusPill> : null}
                  {!localError && error ? <StatusPill tone="danger">{error}</StatusPill> : null}

                  <TextInput
                    label="Policy name"
                    value={form.name}
                    onChange={handleFieldChange('name')}
                    required
                  />

                  <FormField id="policy-description" label="Description" hint="Visible to operations and finance teams">
                    <textarea
                      id="policy-description"
                      className="min-h-[96px] w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={form.description}
                      onChange={handleFieldChange('description')}
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextInput
                      label="Auto release days"
                      type="number"
                      min="0"
                      value={form.autoReleaseDays}
                      onChange={handleFieldChange('autoReleaseDays')}
                      hint="Number of days after funding before auto release"
                    />
                    <TextInput
                      label="Maximum amount (optional)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.maxAmount}
                      onChange={handleFieldChange('maxAmount')}
                      hint="Set a threshold that requires this policy"
                    />
                  </div>

                  <Checkbox
                    checked={form.requiresDualApproval}
                    onChange={handleFieldChange('requiresDualApproval')}
                    label="Requires dual approval"
                  />

                  <TextInput
                    label="Notify roles"
                    hint="Comma-separated roles notified when funds are ready"
                    value={form.notifyRoles}
                    onChange={handleFieldChange('notifyRoles')}
                  />

                  <TextInput
                    label="Document checklist"
                    hint="Comma-separated list of documents required before release"
                    value={form.documentChecklist}
                    onChange={handleFieldChange('documentChecklist')}
                  />

                  <FormField
                    id="policy-conditions"
                    label="Release conditions"
                    hint="One condition per line (e.g. Client sign-off, Compliance review)"
                  >
                    <textarea
                      id="policy-conditions"
                      className="min-h-[120px] w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={form.releaseConditions}
                      onChange={handleFieldChange('releaseConditions')}
                    />
                  </FormField>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={submitting}>
                      {mode === 'edit' ? 'Save changes' : 'Create policy'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

ReleasePolicyModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  initialPolicy: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    autoReleaseDays: PropTypes.number,
    requiresDualApproval: PropTypes.bool,
    maxAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    notifyRoles: PropTypes.arrayOf(PropTypes.string),
    documentChecklist: PropTypes.arrayOf(PropTypes.string),
    releaseConditions: PropTypes.arrayOf(PropTypes.string)
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  error: PropTypes.string
};

ReleasePolicyModal.defaultProps = {
  mode: 'create',
  initialPolicy: null,
  onSubmit: undefined,
  submitting: false,
  error: null
};
