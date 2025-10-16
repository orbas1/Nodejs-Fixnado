import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, TextInput } from '../../../components/ui/index.js';
import { EVENT_TYPES, SEVERITY_OPTIONS, STATUS_OPTIONS } from '../constants.js';
import { formatTags } from '../utils.js';

export default function CreateAuditDialog({
  open,
  creation,
  onClose,
  onSubmit,
  onFieldChange,
  onTagsChange,
  onAttachmentChange,
  onAddAttachment,
  onRemoveAttachment
}) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-40">
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
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto px-4">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transform transition ease-in duration-150"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-xl font-semibold text-slate-900">Log manual audit event</Dialog.Title>
              <p className="mt-1 text-sm text-slate-600">
                Create a manual audit entry to capture findings, manual interventions, or external evidence.
              </p>
              <form onSubmit={onSubmit} className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Event type</label>
                    <select
                      value={creation.form.eventType}
                      onChange={(event) => onFieldChange('eventType', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {EVENT_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Severity</label>
                    <select
                      value={creation.form.severity}
                      onChange={(event) => onFieldChange('severity', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {SEVERITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Status</label>
                    <select
                      value={creation.form.status}
                      onChange={(event) => onFieldChange('status', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <TextInput
                    label="Summary"
                    value={creation.form.summary}
                    onChange={(event) => onFieldChange('summary', event.target.value)}
                    className="md:col-span-2"
                  />
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Details</label>
                    <textarea
                      value={creation.form.details}
                      onChange={(event) => onFieldChange('details', event.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <TextInput
                    label="Zone"
                    value={creation.form.zoneId}
                    onChange={(event) => onFieldChange('zoneId', event.target.value)}
                  />
                  <TextInput
                    label="Post"
                    value={creation.form.postId}
                    onChange={(event) => onFieldChange('postId', event.target.value)}
                  />
                  <TextInput
                    label="Assignee"
                    value={creation.form.assigneeId}
                    onChange={(event) => onFieldChange('assigneeId', event.target.value)}
                  />
                  <TextInput
                    type="datetime-local"
                    label="Next action"
                    value={creation.form.nextActionAt}
                    onChange={(event) => onFieldChange('nextActionAt', event.target.value)}
                  />
                  <TextInput
                    label="Tags"
                    value={formatTags(creation.form.tags)}
                    onChange={(event) => onTagsChange(event.target.value)}
                    className="md:col-span-2"
                  />
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Attachments</p>
                    <div className="mt-3 space-y-3">
                      {creation.form.attachments.map((attachment, index) => (
                        <div key={`create-attachment-${index}`} className="flex items-end gap-2">
                          <TextInput
                            label="URL"
                            value={attachment.url}
                            onChange={(event) => onAttachmentChange(index, 'url', event.target.value)}
                            className="flex-1"
                          />
                          <TextInput
                            label="Label"
                            value={attachment.label}
                            onChange={(event) => onAttachmentChange(index, 'label', event.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onRemoveAttachment(index)}
                            disabled={creation.form.attachments.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" onClick={onAddAttachment}>
                        Add attachment
                      </Button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Metadata (JSON)</label>
                    <textarea
                      value={creation.form.metadataText}
                      onChange={(event) => onFieldChange('metadataText', event.target.value)}
                      rows={4}
                      placeholder='{"key": "value"}'
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                {creation.error ? <p className="text-sm text-rose-600">{creation.error.message}</p> : null}
                <div className="flex items-center justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={creation.saving}>
                    {creation.saving ? 'Saving…' : 'Create audit event'}
                  </Button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

CreateAuditDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  creation: PropTypes.shape({
    form: PropTypes.shape({
      eventType: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      summary: PropTypes.string,
      details: PropTypes.string,
      zoneId: PropTypes.string,
      postId: PropTypes.string,
      assigneeId: PropTypes.string,
      nextActionAt: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      attachments: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string,
          label: PropTypes.string
        })
      ).isRequired,
      metadataText: PropTypes.string
    }).isRequired,
    saving: PropTypes.bool.isRequired,
    error: PropTypes.shape({ message: PropTypes.string })
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onTagsChange: PropTypes.func.isRequired,
  onAttachmentChange: PropTypes.func.isRequired,
  onAddAttachment: PropTypes.func.isRequired,
  onRemoveAttachment: PropTypes.func.isRequired
};
