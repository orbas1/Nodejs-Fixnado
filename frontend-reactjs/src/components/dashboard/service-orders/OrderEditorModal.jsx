import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import TextInput from '../../ui/TextInput.jsx';
import FormField from '../../ui/FormField.jsx';
import AttachmentManager from './AttachmentManager.jsx';
import { APPROVAL_STATES, PRIORITY_OPTIONS, STATUS_LABELS } from './constants.js';
import { formatDateTimeLocal } from './utils.js';

function OrderEditorModal({
  open,
  mode,
  form,
  setForm,
  services,
  servicesLoading,
  error,
  saving,
  onClose,
  onSubmit
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-primary">
                      {mode === 'create' ? 'Create service order' : 'Update service order'}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-600">
                      {mode === 'create'
                        ? 'Set the scope, value, and contacts for this order. You can update milestones and notes at any time.'
                        : 'Update scheduling, contacts, or scope before notifying crews and finance.'}
                    </p>
                  </div>
                  <button type="button" onClick={onClose} className="rounded-full border border-transparent bg-secondary p-2 text-slate-500 hover:bg-secondary/70">
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <form className="mt-6 space-y-6" onSubmit={onSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      label="Order title"
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                      required
                    />
                    <FormField id="service-select" label="Service">
                      <select
                        id="service-select"
                        value={form.serviceId}
                        onChange={(event) => setForm((prev) => ({ ...prev, serviceId: event.target.value }))}
                        className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring focus:ring-accent/40"
                        required
                      >
                        <option value="">Select a service</option>
                        {servicesLoading ? <option>Loading services…</option> : null}
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.title} {service.category ? `• ${service.category}` : ''}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="status-select" label="Status">
                      <select
                        id="status-select"
                        value={form.status}
                        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                        className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring focus:ring-accent/40"
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="priority-select" label="Priority">
                      <select
                        id="priority-select"
                        value={form.priority}
                        onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                        className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring focus:ring-accent/40"
                      >
                        {PRIORITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <TextInput
                      label="Budget / total"
                      type="number"
                      step="0.01"
                      value={form.totalAmount}
                      onChange={(event) => setForm((prev) => ({ ...prev, totalAmount: event.target.value }))}
                      placeholder="0.00"
                    />
                    <TextInput
                      label="Currency"
                      value={form.currency}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase().slice(0, 3) }))
                      }
                      maxLength={3}
                    />
                    <TextInput
                      label="Scheduled start"
                      type="datetime-local"
                      value={formatDateTimeLocal(form.scheduledFor)}
                      onChange={(event) => setForm((prev) => ({ ...prev, scheduledFor: event.target.value }))}
                    />
                  </div>

                  <FormField id="summary" label="Work summary" hint="Share context, site prep, or compliance requirements.">
                    <textarea
                      id="summary"
                      value={form.summary}
                      onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                      className="h-24 w-full rounded-2xl border border-accent/20 bg-secondary px-4 py-3 text-sm text-primary focus:outline-none focus:ring focus:ring-accent/40"
                    />
                  </FormField>

                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      label="Site address or venue"
                      value={form.siteAddress}
                      onChange={(event) => setForm((prev) => ({ ...prev, siteAddress: event.target.value }))}
                    />
                    <TextInput
                      label="Primary contact"
                      value={form.contactName}
                      onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
                    />
                    <TextInput
                      label="Contact phone"
                      value={form.contactPhone}
                      onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                    />
                    <TextInput
                      label="PO or reference"
                      value={form.poNumber}
                      onChange={(event) => setForm((prev) => ({ ...prev, poNumber: event.target.value }))}
                    />
                    <FormField id="approval-status" label="Approval status">
                      <select
                        id="approval-status"
                        value={form.approvalStatus}
                        onChange={(event) => setForm((prev) => ({ ...prev, approvalStatus: event.target.value }))}
                        className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring focus:ring-accent/40"
                      >
                        {APPROVAL_STATES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <TextInput
                      label="Tags"
                      hint="Separate tags with commas (e.g. out-of-hours, permits, key-holder)"
                      value={form.tagsInput}
                      onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))}
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-primary">Attachments</h4>
                    <p className="mt-1 text-xs text-slate-500">Link site plans, RAMS, insurance certificates, or supporting evidence.</p>
                    <AttachmentManager
                      attachments={form.attachments}
                      onChange={(next) => setForm((prev) => ({ ...prev, attachments: next }))}
                    />
                  </div>

                  {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="secondary" type="button" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={saving} icon={CheckCircleIcon}>
                      {mode === 'create' ? 'Create order' : 'Save changes'}
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

OrderEditorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.shape({
    title: PropTypes.string,
    serviceId: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    scheduledFor: PropTypes.string,
    summary: PropTypes.string,
    siteAddress: PropTypes.string,
    contactName: PropTypes.string,
    contactPhone: PropTypes.string,
    poNumber: PropTypes.string,
    approvalStatus: PropTypes.string,
    tagsInput: PropTypes.string,
    attachments: PropTypes.array
  }).isRequired,
  setForm: PropTypes.func.isRequired,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      category: PropTypes.string
    })
  ).isRequired,
  servicesLoading: PropTypes.bool,
  error: PropTypes.string,
  saving: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

OrderEditorModal.defaultProps = {
  servicesLoading: false,
  error: null,
  saving: false
};

export default OrderEditorModal;
