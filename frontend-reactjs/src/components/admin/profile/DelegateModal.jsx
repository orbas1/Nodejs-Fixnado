import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, StatusPill, TextInput } from '../../ui/index.js';

export default function DelegateModal({
  open,
  mode,
  values,
  statusOptions,
  submitting,
  error,
  onClose,
  onFieldChange,
  onSubmit
}) {
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
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
              enterTo="translate-y-0 opacity-100 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0 opacity-100 sm:scale-100"
              leaveTo="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg space-y-6 rounded-3xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-primary lg:text-xl">
                  {mode === 'edit' ? 'Edit delegate access' : 'Invite delegate access'}
                </Dialog.Title>
                <form className="space-y-4" onSubmit={onSubmit}>
                  <TextInput
                    label="Name"
                    value={values.name}
                    onChange={(event) => onFieldChange('name', event.target.value)}
                    required
                  />
                  <TextInput
                    label="Email"
                    type="email"
                    value={values.email}
                    onChange={(event) => onFieldChange('email', event.target.value)}
                    required
                  />
                  <TextInput
                    label="Role"
                    value={values.role}
                    onChange={(event) => onFieldChange('role', event.target.value)}
                    required
                  />
                  <TextInput
                    label="Avatar URL"
                    value={values.avatarUrl}
                    onChange={(event) => onFieldChange('avatarUrl', event.target.value)}
                  />
                  <TextInput
                    label="Permissions"
                    hint="Comma separated features e.g. Disputes, Finance"
                    value={values.permissionsText}
                    onChange={(event) => onFieldChange('permissionsText', event.target.value)}
                  />
                  <div className="fx-field">
                    <label className="fx-field__label" htmlFor="delegate-status">
                      Status
                    </label>
                    <select
                      id="delegate-status"
                      value={values.status}
                      onChange={(event) => onFieldChange('status', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={submitting}>
                      {mode === 'edit' ? 'Save delegate' : 'Invite delegate'}
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

DelegateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  values: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    avatarUrl: PropTypes.string,
    permissionsText: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  statusOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

DelegateModal.defaultProps = {
  submitting: false,
  error: null
};
