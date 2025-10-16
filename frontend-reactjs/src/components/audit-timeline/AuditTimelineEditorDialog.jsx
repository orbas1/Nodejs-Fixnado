import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, FormField, TextInput } from '../ui/index.js';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from './constants.js';

const AuditTimelineEditorDialog = ({
  state,
  formData,
  formErrors,
  onFieldChange,
  onAttachmentChange,
  onAddAttachment,
  onRemoveAttachment,
  onClose,
  onSave,
  saving
}) => (
  <Transition appear show={state.open} as={Fragment}>
    <Dialog as="div" className="relative z-30" onClose={onClose}>
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
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <Dialog.Panel className="w-full max-w-3xl transform rounded-3xl border border-accent/10 bg-white p-6 text-left shadow-2xl transition-all">
              <Dialog.Title className="text-xl font-semibold text-primary">
                {state.mode === 'create' ? 'Create audit entry' : 'Edit audit entry'}
              </Dialog.Title>
              <p className="mt-1 text-sm text-slate-600">
                Provide a clear title, owner, and context so other administrators can trace the action.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Title"
                  value={formData.title}
                  onChange={(event) => onFieldChange('title', event.target.value)}
                  error={formErrors.title}
                />
                <TextInput
                  label="Owner"
                  value={formData.ownerName}
                  onChange={(event) => onFieldChange('ownerName', event.target.value)}
                  error={formErrors.ownerName}
                />
                <TextInput
                  label="Owner team"
                  value={formData.ownerTeam}
                  onChange={(event) => onFieldChange('ownerTeam', event.target.value)}
                />
                <div>
                  <label className="fx-field__label" htmlFor="audit-category">
                    Category
                  </label>
                  <select
                    id="audit-category"
                    className="fx-text-input"
                    value={formData.category}
                    onChange={(event) => onFieldChange('category', event.target.value)}
                  >
                    {CATEGORY_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fx-field__label" htmlFor="audit-status">
                    Status
                  </label>
                  <select
                    id="audit-status"
                    className="fx-text-input"
                    value={formData.status}
                    onChange={(event) => onFieldChange('status', event.target.value)}
                  >
                    {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <TextInput
                  label="Start time"
                  type="datetime-local"
                  value={formData.occurredAt}
                  onChange={(event) => onFieldChange('occurredAt', event.target.value)}
                  error={formErrors.occurredAt}
                />
                <TextInput
                  label="Due by (optional)"
                  type="datetime-local"
                  value={formData.dueAt}
                  onChange={(event) => onFieldChange('dueAt', event.target.value)}
                />
              </div>

              <FormField id="audit-summary" label="Summary" className="mt-4">
                <textarea
                  id="audit-summary"
                  className="fx-text-input min-h-[120px]"
                  value={formData.summary}
                  onChange={(event) => onFieldChange('summary', event.target.value)}
                  placeholder="Describe what changed, evidence collected, or next actions."
                />
              </FormField>

              <FormField id="audit-note" label="Internal note" optionalLabel="optional">
                <textarea
                  id="audit-note"
                  className="fx-text-input min-h-[80px]"
                  value={formData.note}
                  onChange={(event) => onFieldChange('note', event.target.value)}
                  placeholder="Visible to administrators only."
                />
              </FormField>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-primary">Attachments</h3>
                  <Button variant="tertiary" size="sm" onClick={onAddAttachment}>
                    Add attachment
                  </Button>
                </div>
                {formErrors.attachments ? (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.attachments}</p>
                ) : null}
                <div className="mt-3 space-y-3">
                  {formData.attachments.map((attachment, index) => (
                    <div key={`attachment-${index}`} className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
                      <TextInput
                        label="Label"
                        value={attachment.label}
                        onChange={(event) => onAttachmentChange(index, 'label', event.target.value)}
                      />
                      <TextInput
                        label="URL"
                        value={attachment.url}
                        onChange={(event) => onAttachmentChange(index, 'url', event.target.value)}
                        placeholder="https://"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveAttachment(index)}
                        disabled={formData.attachments.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {formErrors.submit ? (
                <p className="mt-4 text-sm text-rose-600">{formErrors.submit}</p>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={onSave} loading={saving}>
                  {state.mode === 'create' ? 'Create entry' : 'Save changes'}
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

AuditTimelineEditorDialog.propTypes = {
  state: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    mode: PropTypes.oneOf(['create', 'edit']).isRequired
  }).isRequired,
  formData: PropTypes.shape({
    title: PropTypes.string,
    summary: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string,
    ownerName: PropTypes.string,
    ownerTeam: PropTypes.string,
    occurredAt: PropTypes.string,
    dueAt: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string
      })
    ),
    note: PropTypes.string
  }).isRequired,
  formErrors: PropTypes.object.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onAttachmentChange: PropTypes.func.isRequired,
  onAddAttachment: PropTypes.func.isRequired,
  onRemoveAttachment: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired
};

export default AuditTimelineEditorDialog;
