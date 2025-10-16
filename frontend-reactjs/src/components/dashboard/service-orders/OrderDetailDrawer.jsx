import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import Spinner from '../../ui/Spinner.jsx';
import StatusPill from '../../ui/StatusPill.jsx';
import AttachmentManager from './AttachmentManager.jsx';
import NotesTimeline from './NotesTimeline.jsx';
import AttachmentIcon from './AttachmentIcon.jsx';
import { APPROVAL_STATES, PRIORITY_OPTIONS, STATUS_LABELS, STATUS_TONES } from './constants.js';
import { formatCurrency, formatDate } from './utils.js';

function OrderDetailDrawer({
  open,
  detail,
  loading,
  error,
  onClose,
  onEdit,
  onStatusChange,
  noteDraft,
  setNoteDraft,
  noteAttachments,
  setNoteAttachments,
  noteSaving,
  onNoteSubmit,
  onNoteDelete
}) {
  const detailHasData = Boolean(detail);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-screen max-w-2xl">
                <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                  <div className="flex items-start justify-between border-b border-accent/10 px-6 py-4">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-primary">
                        {detail ? detail.title : 'Loading order'}
                      </Dialog.Title>
                      <p className="mt-1 text-xs text-slate-500">Manage milestones, documents, and communications.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {detail ? (
                        <Button variant="secondary" size="sm" onClick={() => onEdit(detail)} icon={PencilSquareIcon}>
                          Edit
                        </Button>
                      ) : null}
                      <button type="button" onClick={onClose} className="rounded-full border border-transparent bg-secondary p-2 text-slate-500 hover:bg-secondary/70">
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex flex-1 items-center justify-center">
                      <Spinner />
                    </div>
                  ) : detailHasData ? (
                    <div className="flex-1 space-y-6 px-6 py-6">
                      {error ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                          <div className="flex items-start gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                            <p className="text-sm">{error}</p>
                          </div>
                        </div>
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-primary">Status</h3>
                          <label className="flex items-center gap-3 text-xs font-medium text-slate-500">
                            <span className="text-slate-600">Pipeline stage</span>
                            <select
                              value={detail.status}
                              onChange={(event) => onStatusChange(detail, event.target.value)}
                              className="rounded-full border border-accent/30 bg-secondary px-3 py-1 text-xs font-semibold text-primary focus:outline-none focus:ring focus:ring-accent/40"
                            >
                              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <StatusPill tone={STATUS_TONES[detail.status] || 'neutral'}>
                            {STATUS_LABELS[detail.status] || detail.status}
                          </StatusPill>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-primary">Priority</h3>
                          <p className="text-sm text-slate-600">
                            {PRIORITY_OPTIONS.find((option) => option.value === detail.priority)?.label || 'Medium'}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-accent/10 bg-secondary/50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Service & value</p>
                          <p className="mt-2 text-sm font-semibold text-primary">{detail.service?.title || 'Service pending'}</p>
                          <p className="mt-1 text-sm text-slate-600">{formatCurrency(detail.totalAmount, detail.currency)}</p>
                        </div>
                        <div className="rounded-2xl border border-accent/10 bg-secondary/50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Schedule</p>
                          <p className="mt-2 text-sm font-semibold text-primary">{formatDate(detail.scheduledFor)}</p>
                          <p className="mt-1 text-xs text-slate-500">Last updated {detail.updatedAt ? new Date(detail.updatedAt).toLocaleString() : 'recently'}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-primary">Summary</h3>
                        <p className="rounded-2xl border border-accent/10 bg-white px-4 py-3 text-sm text-slate-600">
                          {detail.summary || 'No summary provided yet.'}
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-primary">Site & contacts</h3>
                          <ul className="space-y-2 text-sm text-slate-600">
                            <li>
                              <span className="font-semibold text-primary">Site:</span> {detail.metadata?.siteAddress || 'Not set'}
                            </li>
                            <li>
                              <span className="font-semibold text-primary">Contact:</span> {detail.metadata?.contactName || 'Not set'}
                            </li>
                            <li>
                              <span className="font-semibold text-primary">Phone:</span> {detail.metadata?.contactPhone || 'Not set'}
                            </li>
                            <li>
                              <span className="font-semibold text-primary">PO / Ref:</span> {detail.metadata?.poNumber || 'Not set'}
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-primary">Approvals</h3>
                          <p className="rounded-2xl border border-accent/10 bg-white px-4 py-3 text-sm text-slate-600">
                            {APPROVAL_STATES.find((option) => option.value === detail.metadata?.approvalStatus)?.label || 'Not requested'}
                          </p>
                          <Button variant="ghost" size="sm" as="a" href={`/finance/orders/${detail.id}/timeline`} target="_blank" rel="noreferrer">
                            Open finance timeline
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-primary">Attachments</h3>
                        {Array.isArray(detail.attachments) && detail.attachments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {detail.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 text-xs font-semibold text-primary hover:border-accent/40"
                              >
                                <AttachmentIcon type={attachment.type} />
                                {attachment.label}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-2xl border border-dashed border-accent/30 bg-secondary/60 px-4 py-3 text-sm text-slate-500">
                            No attachments uploaded yet.
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-primary">Notes & field updates</h3>
                        <form className="space-y-3" onSubmit={onNoteSubmit}>
                          <textarea
                            value={noteDraft}
                            onChange={(event) => setNoteDraft(event.target.value)}
                            placeholder="Log approvals, crew updates, or inspection results."
                            className="h-24 w-full rounded-2xl border border-accent/20 bg-secondary px-4 py-3 text-sm text-primary focus:outline-none focus:ring focus:ring-accent/40"
                          />
                          <AttachmentManager
                            attachments={noteAttachments}
                            onChange={setNoteAttachments}
                            emptyMessage="No supporting files attached yet. Upload evidence, permits, or photos."
                            addLabel="Attach to note"
                          />
                          <div className="flex items-center justify-end gap-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              type="submit"
                              loading={noteSaving}
                              disabled={!noteDraft.trim()}
                            >
                              Add note
                            </Button>
                          </div>
                        </form>
                        <NotesTimeline notes={detail.notes} onDelete={onNoteDelete} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-sm text-slate-500">No order selected.</p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

OrderDetailDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  detail: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  noteDraft: PropTypes.string.isRequired,
  setNoteDraft: PropTypes.func.isRequired,
  noteAttachments: PropTypes.arrayOf(PropTypes.object).isRequired,
  setNoteAttachments: PropTypes.func.isRequired,
  noteSaving: PropTypes.bool,
  onNoteSubmit: PropTypes.func.isRequired,
  onNoteDelete: PropTypes.func.isRequired
};

OrderDetailDrawer.defaultProps = {
  detail: null,
  loading: false,
  error: null,
  noteSaving: false
};

export default OrderDetailDrawer;
