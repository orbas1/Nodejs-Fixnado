import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Button, FormField, TextInput } from '../../../ui/index.js';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '../constants.js';

function EditUserModal({ open, form, onClose, onChange, onSubmit, saving, formError }) {
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-4 opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-4 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
                <div>
                  <Dialog.Title className="text-xl font-semibold text-primary">Edit user</Dialog.Title>
                  <p className="mt-1 text-sm text-slate-600">Update profile, status, and two-factor settings.</p>
                </div>
                {formError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{formError}</div>
                ) : null}
                {form ? (
                  <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput
                        label="First name"
                        value={form.firstName}
                        onChange={(event) => onChange('firstName', event.target.value)}
                        required
                      />
                      <TextInput
                        label="Last name"
                        value={form.lastName}
                        onChange={(event) => onChange('lastName', event.target.value)}
                        required
                      />
                    </div>
                    <TextInput
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(event) => onChange('email', event.target.value)}
                      required
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600">Role</label>
                        <select
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                          value={form.role}
                          onChange={(event) => onChange('role', event.target.value)}
                        >
                          {ROLE_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600">Status</label>
                        <select
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                          value={form.status}
                          onChange={(event) => onChange('status', event.target.value)}
                        >
                          {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput
                        label="Job title"
                        value={form.jobTitle}
                        onChange={(event) => onChange('jobTitle', event.target.value)}
                      />
                      <TextInput
                        label="Department"
                        value={form.department}
                        onChange={(event) => onChange('department', event.target.value)}
                      />
                    </div>
                    <FormField id="edit-labels" label="Labels">
                      <textarea
                        id="edit-labels"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        rows={2}
                        value={form.labels}
                        onChange={(event) => onChange('labels', event.target.value)}
                      />
                    </FormField>
                    <FormField id="edit-notes" label="Admin notes">
                      <textarea
                        id="edit-notes"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        rows={3}
                        value={form.notes}
                        onChange={(event) => onChange('notes', event.target.value)}
                      />
                    </FormField>
                    <TextInput
                      label="Avatar URL"
                      value={form.avatarUrl}
                      onChange={(event) => onChange('avatarUrl', event.target.value)}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={form.twoFactorEmail}
                          onChange={(event) => onChange('twoFactorEmail', event.target.checked)}
                        />
                        Email MFA enabled
                      </label>
                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={form.twoFactorApp}
                          onChange={(event) => onChange('twoFactorApp', event.target.checked)}
                        />
                        Authenticator app enabled
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button type="submit" icon={PencilSquareIcon} loading={saving}>
                        Save changes
                      </Button>
                    </div>
                  </form>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

EditUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  form: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    status: PropTypes.string,
    jobTitle: PropTypes.string,
    department: PropTypes.string,
    labels: PropTypes.string,
    notes: PropTypes.string,
    avatarUrl: PropTypes.string,
    twoFactorEmail: PropTypes.bool,
    twoFactorApp: PropTypes.bool
  }),
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  formError: PropTypes.string
};

EditUserModal.defaultProps = {
  form: null,
  saving: false,
  formError: null
};

export default EditUserModal;
