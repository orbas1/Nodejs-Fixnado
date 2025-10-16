import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, FormField, TextInput, Checkbox } from '../../ui/index.js';
import { FREQUENCY_LABELS, CONTROL_TYPE_LABELS, CATEGORY_LABELS } from './constants.js';

function ComplianceControlModal({
  open,
  onClose,
  formState,
  onChange,
  onSubmit,
  submitting,
  error,
  filters,
  onEvidenceChange,
  onEvidenceAdd,
  onEvidenceRemove,
  onExceptionChange,
  onExceptionAdd,
  onExceptionRemove
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
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
              <Dialog.Panel className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-xl font-semibold text-primary">
                  {formState.id ? 'Edit compliance control' : 'Create compliance control'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-600">
                  Configure control ownership, cadence, evidence requirements, and escalation policies.
                </p>

                <form className="mt-6 space-y-6" onSubmit={onSubmit}>
                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Control name" required helper="Use a short, action-oriented title">
                      <TextInput value={formState.title} onChange={(event) => onChange('title', event.target.value)} required />
                    </FormField>
                    <FormField label="Owner team" helper="Primary accountability for this control">
                      <TextInput value={formState.ownerTeam} onChange={(event) => onChange('ownerTeam', event.target.value)} />
                    </FormField>
                    <FormField label="Owner email" helper="Alerts and reminders will route here">
                      <TextInput
                        type="email"
                        value={formState.ownerEmail}
                        onChange={(event) => onChange('ownerEmail', event.target.value)}
                      />
                    </FormField>
                    <FormField label="Status">
                      <select
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={formState.status}
                        onChange={(event) => onChange('status', event.target.value)}
                      >
                        {(filters.statuses || []).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Category">
                      <select
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={formState.category}
                        onChange={(event) => onChange('category', event.target.value)}
                      >
                        {(filters.categories || []).map((value) => (
                          <option key={value} value={value}>
                            {CATEGORY_LABELS[value] || value}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Control type">
                      <select
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={formState.controlType}
                        onChange={(event) => onChange('controlType', event.target.value)}
                      >
                        {(filters.controlTypes || []).map((value) => (
                          <option key={value} value={value}>
                            {CONTROL_TYPE_LABELS[value] || value}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Review cadence">
                      <select
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={formState.reviewFrequency}
                        onChange={(event) => onChange('reviewFrequency', event.target.value)}
                      >
                        {(filters.reviewFrequencies || []).map((value) => (
                          <option key={value} value={value}>
                            {FREQUENCY_LABELS[value] || value}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Next review" helper="Schedule when this control should next be tested">
                      <TextInput
                        type="datetime-local"
                        value={formState.nextReviewAt}
                        onChange={(event) => onChange('nextReviewAt', event.target.value)}
                      />
                    </FormField>
                    <FormField label="Last reviewed">
                      <TextInput
                        type="datetime-local"
                        value={formState.lastReviewAt}
                        onChange={(event) => onChange('lastReviewAt', event.target.value)}
                      />
                    </FormField>
                    <FormField label="Documentation URL" helper="Link to runbooks, SOPs, or policies">
                      <TextInput
                        value={formState.documentationUrl}
                        onChange={(event) => onChange('documentationUrl', event.target.value)}
                      />
                    </FormField>
                    <FormField label="Evidence location" helper="Where evidence artefacts should be stored">
                      <TextInput
                        value={formState.evidenceLocation}
                        onChange={(event) => onChange('evidenceLocation', event.target.value)}
                      />
                    </FormField>
                  </div>

                  <FormField>
                    <Checkbox
                      checked={formState.evidenceRequired}
                      onChange={(event) => onChange('evidenceRequired', event.target.checked)}
                    >
                      Evidence required for attestations
                    </Checkbox>
                  </FormField>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Escalation policy" helper="Describe who should be notified when breaches occur">
                      <TextInput
                        value={formState.escalationPolicy}
                        onChange={(event) => onChange('escalationPolicy', event.target.value)}
                      />
                    </FormField>
                    <FormField label="Tags" helper="Comma separated e.g. vendor, gdpr">
                      <TextInput value={formState.tags} onChange={(event) => onChange('tags', event.target.value)} />
                    </FormField>
                    <FormField label="Watchers" helper="Comma separated emails for FYI notifications">
                      <TextInput value={formState.watchers} onChange={(event) => onChange('watchers', event.target.value)} />
                    </FormField>
                    <FormField label="Roles allowed" helper="Restrict editing to specific roles">
                      <TextInput
                        value={formState.rolesAllowed}
                        onChange={(event) => onChange('rolesAllowed', event.target.value)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Control notes">
                    <textarea
                      value={formState.notes}
                      onChange={(event) => onChange('notes', event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </FormField>

                  <div className="space-y-4">
                    <header className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-primary">Evidence checkpoints</h4>
                        <p className="text-xs text-slate-500">Outline each artefact owners must provide.</p>
                      </div>
                      <Button type="button" size="sm" variant="ghost" icon={PlusIcon} onClick={onEvidenceAdd}>
                        Add evidence
                      </Button>
                    </header>
                    <div className="space-y-3">
                      {formState.evidenceCheckpoints.length === 0 ? (
                        <p className="text-xs text-slate-500">No evidence steps defined yet.</p>
                      ) : (
                        formState.evidenceCheckpoints.map((item, index) => (
                          <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                            <div className="grid gap-3 md:grid-cols-2">
                              <TextInput
                                value={item.name}
                                onChange={(event) => onEvidenceChange(index, 'name', event.target.value)}
                                placeholder="Evidence title"
                              />
                              <TextInput
                                value={item.owner}
                                onChange={(event) => onEvidenceChange(index, 'owner', event.target.value)}
                                placeholder="Owner"
                              />
                              <TextInput
                                type="datetime-local"
                                value={item.dueAt}
                                onChange={(event) => onEvidenceChange(index, 'dueAt', event.target.value)}
                              />
                              <select
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={item.status}
                                onChange={(event) => onEvidenceChange(index, 'status', event.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="submitted">Submitted</option>
                                <option value="approved">Approved</option>
                              </select>
                              <TextInput
                                value={item.evidenceUrl}
                                onChange={(event) => onEvidenceChange(index, 'evidenceUrl', event.target.value)}
                                placeholder="Evidence link"
                              />
                              <TextInput
                                value={item.notes}
                                onChange={(event) => onEvidenceChange(index, 'notes', event.target.value)}
                                placeholder="Notes"
                              />
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button type="button" variant="danger" size="sm" icon={TrashIcon} onClick={() => onEvidenceRemove(index)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <header className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-primary">Exceptions &amp; waivers</h4>
                        <p className="text-xs text-slate-500">Track compensating controls or approved deviations.</p>
                      </div>
                      <Button type="button" size="sm" variant="ghost" icon={PlusIcon} onClick={onExceptionAdd}>
                        Add exception
                      </Button>
                    </header>
                    <div className="space-y-3">
                      {formState.exceptionReviews.length === 0 ? (
                        <p className="text-xs text-slate-500">No exceptions recorded.</p>
                      ) : (
                        formState.exceptionReviews.map((item, index) => (
                          <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                            <div className="grid gap-3 md:grid-cols-2">
                              <TextInput
                                value={item.summary}
                                onChange={(event) => onExceptionChange(index, 'summary', event.target.value)}
                                placeholder="Exception summary"
                              />
                              <TextInput
                                value={item.owner}
                                onChange={(event) => onExceptionChange(index, 'owner', event.target.value)}
                                placeholder="Owner"
                              />
                              <select
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={item.status}
                                onChange={(event) => onExceptionChange(index, 'status', event.target.value)}
                              >
                                <option value="open">Open</option>
                                <option value="monitoring">Monitoring</option>
                                <option value="closed">Closed</option>
                              </select>
                              <TextInput
                                type="datetime-local"
                                value={item.expiresAt}
                                onChange={(event) => onExceptionChange(index, 'expiresAt', event.target.value)}
                              />
                              <TextInput
                                className="md:col-span-2"
                                value={item.notes}
                                onChange={(event) => onExceptionChange(index, 'notes', event.target.value)}
                                placeholder="Notes"
                              />
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button type="button" variant="danger" size="sm" icon={TrashIcon} onClick={() => onExceptionRemove(index)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? 'Saving…' : formState.id ? 'Save changes' : 'Create control'}
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

ComplianceControlModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formState: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    ownerTeam: PropTypes.string,
    ownerEmail: PropTypes.string,
    status: PropTypes.string,
    category: PropTypes.string,
    controlType: PropTypes.string,
    reviewFrequency: PropTypes.string,
    nextReviewAt: PropTypes.string,
    lastReviewAt: PropTypes.string,
    documentationUrl: PropTypes.string,
    evidenceLocation: PropTypes.string,
    evidenceRequired: PropTypes.bool,
    escalationPolicy: PropTypes.string,
    tags: PropTypes.string,
    watchers: PropTypes.string,
    rolesAllowed: PropTypes.string,
    notes: PropTypes.string,
    evidenceCheckpoints: PropTypes.arrayOf(PropTypes.object),
    exceptionReviews: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  filters: PropTypes.shape({
    statuses: PropTypes.arrayOf(PropTypes.string),
    categories: PropTypes.arrayOf(PropTypes.string),
    controlTypes: PropTypes.arrayOf(PropTypes.string),
    reviewFrequencies: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onEvidenceChange: PropTypes.func.isRequired,
  onEvidenceAdd: PropTypes.func.isRequired,
  onEvidenceRemove: PropTypes.func.isRequired,
  onExceptionChange: PropTypes.func.isRequired,
  onExceptionAdd: PropTypes.func.isRequired,
  onExceptionRemove: PropTypes.func.isRequired
};

export default ComplianceControlModal;
