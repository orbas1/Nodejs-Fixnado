import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, Card, Spinner, TextInput } from '../../../components/ui/index.js';
import { SEVERITY_OPTIONS, STATUS_OPTIONS } from '../constants.js';
import { formatDate, formatEventType, formatTags } from '../utils.js';

export default function AuditDetailDrawer({
  open,
  onClose,
  detail,
  onSubmit,
  onFieldChange,
  onTagsChange,
  onAttachmentChange,
  onAddAttachment,
  onRemoveAttachment,
  onNoteDraftChange,
  onNoteTagsChange,
  onAddNote,
  onBeginEditNote,
  onCancelEditNote,
  onUpdateNote,
  onDeleteNote
}) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
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
          <div className="flex min-h-full items-stretch justify-end text-left">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-3xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-200 px-8 py-6">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      {formatEventType(detail.audit?.eventType)}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-600">{detail.audit?.summary ?? '—'}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">
                      {formatDate(detail.audit?.occurredAt)}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                </div>

                <div className="max-h-[85vh] overflow-y-auto px-8 py-6">
                  {detail.loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Spinner className="h-6 w-6 text-primary" />
                    </div>
                  ) : null}

                  {!detail.loading && detail.form ? (
                    <form onSubmit={onSubmit} className="space-y-8">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Status</label>
                          <select
                            value={detail.form.status}
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
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Severity</label>
                          <select
                            value={detail.form.severity}
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
                        <TextInput
                          label="Summary"
                          value={detail.form.summary}
                          onChange={(event) => onFieldChange('summary', event.target.value)}
                          className="lg:col-span-2"
                        />
                        <div className="lg:col-span-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Details</label>
                          <textarea
                            value={detail.form.details}
                            onChange={(event) => onFieldChange('details', event.target.value)}
                            rows={4}
                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>
                        <TextInput
                          label="Assignee"
                          value={detail.form.assigneeId}
                          onChange={(event) => onFieldChange('assigneeId', event.target.value)}
                        />
                        <TextInput
                          type="datetime-local"
                          label="Next action"
                          value={detail.form.nextActionAt}
                          onChange={(event) => onFieldChange('nextActionAt', event.target.value)}
                        />
                        <TextInput
                          label="Tags"
                          value={formatTags(detail.form.tags)}
                          onChange={(event) => onTagsChange(event.target.value)}
                          placeholder="Comma separated"
                          className="lg:col-span-2"
                        />
                        <div className="lg:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Attachments</p>
                          <div className="mt-3 space-y-3">
                            {detail.form.attachments.map((attachment, index) => (
                              <div key={`attachment-${index}`} className="flex items-end gap-2">
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
                                  disabled={detail.form.attachments.length === 1}
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
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                        <div className="text-sm text-rose-600">{detail.error ? detail.error.message : null}</div>
                        <Button type="submit" variant="primary" disabled={detail.saving}>
                          {detail.saving ? 'Saving…' : 'Save changes'}
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  {!detail.loading && detail.audit ? (
                    <div className="mt-10 space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Metadata</h3>
                      <dl className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                        <div>
                          <dt className="font-semibold text-slate-500">Zone</dt>
                          <dd>{detail.audit.zoneSnapshot?.name ?? 'Unassigned'}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">Post</dt>
                          <dd>{detail.audit.postSnapshot?.title ?? detail.audit.postId ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">Actor</dt>
                          <dd>
                            {detail.audit.actorSnapshot?.name ?? 'System'} · {detail.audit.actorSnapshot?.role ?? '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">Resource</dt>
                          <dd>
                            {detail.audit.resourceType ?? '—'} · {detail.audit.resourceId ?? '—'}
                          </dd>
                        </div>
                      </dl>
                      {detail.audit.attachments?.length ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Evidence</h4>
                          <ul className="mt-2 space-y-2 text-sm text-primary">
                            {detail.audit.attachments.map((attachment) => (
                              <li key={attachment.url}>
                                <a href={attachment.url} target="_blank" rel="noreferrer" className="underline">
                                  {attachment.label || attachment.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Raw metadata</h4>
                        <pre className="mt-2 max-h-60 overflow-y-auto rounded-lg bg-slate-900/90 p-4 text-xs text-slate-100">
                          {JSON.stringify(detail.audit.metadata ?? {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : null}

                  {!detail.loading && detail.audit ? (
                    <div className="mt-10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Notes</h3>
                        <span className="text-xs text-slate-400">{detail.audit.notes?.length ?? 0} entries</span>
                      </div>
                      <form onSubmit={detail.editingNoteId ? onUpdateNote : onAddNote} className="mt-4 space-y-3">
                        <textarea
                          value={detail.noteDraft}
                          onChange={(event) => onNoteDraftChange(event.target.value)}
                          rows={3}
                          placeholder="Add an audit note"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <TextInput
                          label="Tags"
                          value={detail.noteTagsDraft}
                          onChange={(event) => onNoteTagsChange(event.target.value)}
                          placeholder="Comma separated"
                        />
                        <div className="flex items-center justify-end gap-3">
                          {detail.editingNoteId ? (
                            <Button type="button" variant="secondary" onClick={onCancelEditNote}>
                              Cancel
                            </Button>
                          ) : null}
                          <Button type="submit" variant="primary" disabled={detail.noteSaving || !detail.noteDraft.trim()}>
                            {detail.noteSaving ? 'Saving…' : detail.editingNoteId ? 'Update note' : 'Add note'}
                          </Button>
                        </div>
                      </form>

                      <div className="mt-6 space-y-4">
                        {detail.audit.notes?.map((note) => (
                          <Card key={note.id} className="border border-slate-200 bg-slate-50">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-slate-700">{note.note}</p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {formatDate(note.createdAt)} · {note.authorRole ?? '—'}
                                </p>
                                {note.tags?.length ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {note.tags.map((tag) => (
                                      <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button size="sm" variant="secondary" onClick={() => onBeginEditNote(note)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => onDeleteNote(note.id)}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        {detail.audit.notes?.length === 0 ? (
                          <p className="text-sm text-slate-500">No notes added yet.</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

const attachmentShape = PropTypes.shape({
  url: PropTypes.string,
  label: PropTypes.string
});

const noteShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  note: PropTypes.string,
  createdAt: PropTypes.string,
  authorRole: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string)
});

const auditShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  eventType: PropTypes.string,
  summary: PropTypes.string,
  occurredAt: PropTypes.string,
  zoneSnapshot: PropTypes.shape({ name: PropTypes.string }),
  postSnapshot: PropTypes.shape({ title: PropTypes.string }),
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  actorSnapshot: PropTypes.shape({ name: PropTypes.string, role: PropTypes.string }),
  resourceType: PropTypes.string,
  resourceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  attachments: PropTypes.arrayOf(attachmentShape),
  metadata: PropTypes.object,
  notes: PropTypes.arrayOf(noteShape)
});

AuditDetailDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  detail: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    form: PropTypes.shape({
      status: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
      summary: PropTypes.string,
      details: PropTypes.string,
      assigneeId: PropTypes.string,
      nextActionAt: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      attachments: PropTypes.arrayOf(attachmentShape).isRequired,
      metadata: PropTypes.object
    }),
    audit: auditShape,
    saving: PropTypes.bool.isRequired,
    error: PropTypes.shape({ message: PropTypes.string }),
    editingNoteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    noteDraft: PropTypes.string.isRequired,
    noteTagsDraft: PropTypes.string.isRequired,
    noteSaving: PropTypes.bool.isRequired
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onTagsChange: PropTypes.func.isRequired,
  onAttachmentChange: PropTypes.func.isRequired,
  onAddAttachment: PropTypes.func.isRequired,
  onRemoveAttachment: PropTypes.func.isRequired,
  onNoteDraftChange: PropTypes.func.isRequired,
  onNoteTagsChange: PropTypes.func.isRequired,
  onAddNote: PropTypes.func.isRequired,
  onBeginEditNote: PropTypes.func.isRequired,
  onCancelEditNote: PropTypes.func.isRequired,
  onUpdateNote: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired
};
