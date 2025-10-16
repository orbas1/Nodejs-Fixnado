import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  XMarkIcon,
  PlusIcon,
  PaperClipIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  BookmarkIcon,
  BookmarkSlashIcon
} from '@heroicons/react/24/outline';
import {
  fetchBookingNotes,
  createBookingNote,
  updateBookingNote,
  deleteBookingNote
} from '../../api/bookingsClient.js';

const attachmentTypes = [
  { value: 'link', label: 'Link' },
  { value: 'image', label: 'Image' },
  { value: 'document', label: 'Document' }
];

function createAttachment() {
  return { label: '', url: '', type: 'link' };
}

function mapNoteAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return [createAttachment()];
  }
  return attachments.map((attachment) => ({
    label: attachment.label || '',
    url: attachment.url || '',
    type: attachment.type || 'link'
  }));
}

function formatDate(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return value;
  }
}

function BookingNotesPanel({ booking, open, onClose, permissions, onChanged }) {
  const bookingId = booking?.id;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noteForm, setNoteForm] = useState({ body: '', isPinned: false, attachments: [createAttachment()] });
  const [submitting, setSubmitting] = useState(false);
  const [editState, setEditState] = useState({ noteId: null, body: '', attachments: [createAttachment()], saving: false });

  const canManageNotes = permissions?.canManageNotes !== false;

  const resetForm = () => {
    setNoteForm({ body: '', isPinned: false, attachments: [createAttachment()] });
  };

  const loadNotes = async () => {
    if (!bookingId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchBookingNotes(bookingId);
      setNotes(response || []);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Unable to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    loadNotes();
  }, [open, bookingId]);

  useEffect(() => {
    if (!open) {
      resetForm();
      setEditState({ noteId: null, body: '', attachments: [createAttachment()], saving: false });
      setNotes([]);
    }
  }, [open]);

  const handleFormChange = (field) => (event) => {
    const { value, checked, type } = event.target;
    setNoteForm((prev) => ({
      ...prev,
      [field]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAttachmentChange = (index, field, value) => {
    setNoteForm((prev) => {
      const attachments = [...prev.attachments];
      attachments[index] = { ...attachments[index], [field]: value };
      return { ...prev, attachments };
    });
  };

  const addAttachmentField = () => {
    setNoteForm((prev) => ({ ...prev, attachments: [...prev.attachments, createAttachment()] }));
  };

  const removeAttachmentField = (index) => {
    setNoteForm((prev) => {
      const attachments = prev.attachments.filter((_, idx) => idx !== index);
      return { ...prev, attachments: attachments.length > 0 ? attachments : [createAttachment()] };
    });
  };

  const submitNote = async (event) => {
    event.preventDefault();
    if (!bookingId || !noteForm.body.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createBookingNote(bookingId, {
        body: noteForm.body.trim(),
        isPinned: noteForm.isPinned,
        attachments: noteForm.attachments
          .filter((attachment) => attachment.url.trim())
          .map((attachment) => ({
            label: attachment.label.trim() || 'Attachment',
            url: attachment.url.trim(),
            type: attachment.type || 'link'
          }))
      });
      resetForm();
      await loadNotes();
      onChanged();
    } catch (err) {
      setError(err?.message || 'Unable to create note');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (note) => {
    setEditState({ noteId: note.id, body: note.body || '', attachments: mapNoteAttachments(note.attachments), saving: false });
  };

  const cancelEdit = () => {
    setEditState({ noteId: null, body: '', attachments: [createAttachment()], saving: false });
  };

  const handleEditAttachmentChange = (index, field, value) => {
    setEditState((prev) => {
      const attachments = [...prev.attachments];
      attachments[index] = { ...attachments[index], [field]: value };
      return { ...prev, attachments };
    });
  };

  const addEditAttachmentField = () => {
    setEditState((prev) => ({ ...prev, attachments: [...prev.attachments, createAttachment()] }));
  };

  const removeEditAttachmentField = (index) => {
    setEditState((prev) => {
      const attachments = prev.attachments.filter((_, idx) => idx !== index);
      return { ...prev, attachments: attachments.length > 0 ? attachments : [createAttachment()] };
    });
  };

  const saveEdit = async () => {
    if (!bookingId || !editState.noteId || !editState.body.trim()) {
      return;
    }
    setEditState((prev) => ({ ...prev, saving: true }));
    setError(null);
    try {
      await updateBookingNote(bookingId, editState.noteId, {
        body: editState.body.trim(),
        attachments: editState.attachments
          .filter((attachment) => attachment.url.trim())
          .map((attachment) => ({
            label: attachment.label.trim() || 'Attachment',
            url: attachment.url.trim(),
            type: attachment.type || 'link'
          }))
      });
      cancelEdit();
      await loadNotes();
      onChanged();
    } catch (err) {
      setError(err?.message || 'Unable to update note');
      setEditState((prev) => ({ ...prev, saving: false }));
    }
  };

  const togglePin = async (note) => {
    if (!bookingId || !note?.id) return;
    setError(null);
    try {
      await updateBookingNote(bookingId, note.id, { isPinned: !note.isPinned });
      await loadNotes();
      onChanged();
    } catch (err) {
      setError(err?.message || 'Unable to update note');
    }
  };

  const removeNote = async (note) => {
    if (!bookingId || !note?.id) return;
    if (!window.confirm('Delete this note? This action cannot be undone.')) {
      return;
    }
    setError(null);
    try {
      await deleteBookingNote(bookingId, note.id);
      await loadNotes();
      onChanged();
    } catch (err) {
      setError(err?.message || 'Unable to delete note');
    }
  };

  const noteCount = notes?.length || 0;
  const pinnedNotes = useMemo(() => notes.filter((note) => note.isPinned), [notes]);
  const regularNotes = useMemo(() => notes.filter((note) => !note.isPinned), [notes]);

  if (!open || !bookingId) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-primary/10 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Booking notes</p>
          <h2 className="text-lg font-semibold text-primary">{booking?.title || 'Selected booking'}</h2>
          <p className="text-xs text-slate-500">{noteCount} note{noteCount === 1 ? '' : 's'} total</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <span className="sr-only">Close notes</span>
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-secondary px-4 py-3 text-sm text-slate-600">
            <ArrowPathIcon className="h-5 w-5 animate-spin text-primary" />
            Loading notes…
          </div>
        )}
        {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {canManageNotes && (
          <form onSubmit={submitNote} className="mb-8 space-y-4 rounded-3xl border border-primary/10 bg-secondary p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Add internal note</p>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                <input
                  type="checkbox"
                  checked={noteForm.isPinned}
                  onChange={handleFormChange('isPinned')}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                />
                Pin to top
              </label>
            </div>
            <textarea
              value={noteForm.body}
              onChange={handleFormChange('body')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/20"
              rows={4}
              placeholder="Shift handover notes, customer updates, crew actions…"
              required
            />

            <div className="space-y-3">
              {noteForm.attachments.map((attachment, index) => (
                <div key={`new-attachment-${index}`} className="rounded-2xl border border-dashed border-slate-300 p-3">
                  <div className="grid gap-3 sm:grid-cols-5 sm:items-center">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Label</label>
                      <input
                        value={attachment.label}
                        onChange={(event) => handleAttachmentChange(index, 'label', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/20"
                        placeholder="e.g. Escalation brief"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">URL</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                          <PaperClipIcon className="h-4 w-4" />
                        </span>
                        <input
                          value={attachment.url}
                          onChange={(event) => handleAttachmentChange(index, 'url', event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/20"
                          placeholder="https://"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <select
                      value={attachment.type}
                      onChange={(event) => handleAttachmentChange(index, 'type', event.target.value)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/20"
                    >
                      {attachmentTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeAttachmentField(index)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <TrashIcon className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={addAttachmentField}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                <PlusIcon className="h-4 w-4" /> Add attachment
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-primary/50"
              >
                {submitting ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </form>
        )}

        {[pinnedNotes, regularNotes].map((collection, index) => (
          <div key={index} className="space-y-4">
            {collection.map((note) => {
              const isEditing = editState.noteId === note.id;
              const attachmentList = isEditing ? editState.attachments : mapNoteAttachments(note.attachments ?? []);

              return (
                <article
                  key={note.id}
                  className={`rounded-3xl border ${note.isPinned ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-white'} p-4 shadow-sm`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-primary">{note.authorType || 'Internal team'}</p>
                      <p className="text-xs text-slate-500">{formatDate(note.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageNotes && (
                        <button
                          type="button"
                          onClick={() => togglePin(note)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${note.isPinned ? 'border-primary/30 text-primary hover:bg-primary/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {note.isPinned ? <BookmarkSlashIcon className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
                          {note.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                      )}
                      {canManageNotes && (
                        <button
                          type="button"
                          onClick={() => (isEditing ? cancelEdit() : startEditing(note))}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      )}
                      {canManageNotes && (
                        <button
                          type="button"
                          onClick={() => removeNote(note)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <TrashIcon className="h-4 w-4" /> Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={editState.body}
                        onChange={(event) => setEditState((prev) => ({ ...prev, body: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/20"
                        rows={4}
                      />
                      <div className="space-y-3">
                        {attachmentList.map((attachment, attachmentIndex) => (
                          <div key={`edit-attachment-${note.id}-${attachmentIndex}`} className="rounded-2xl border border-dashed border-slate-300 p-3">
                            <div className="grid gap-3 sm:grid-cols-5 sm:items-center">
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Label</label>
                                <input
                                  value={attachment.label}
                                  onChange={(event) => handleEditAttachmentChange(attachmentIndex, 'label', event.target.value)}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/20"
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">URL</label>
                                <div className="relative">
                                  <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                                    <PaperClipIcon className="h-4 w-4" />
                                  </span>
                                  <input
                                    value={attachment.url}
                                    onChange={(event) => handleEditAttachmentChange(attachmentIndex, 'url', event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/20"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <select
                                value={attachment.type}
                                onChange={(event) => handleEditAttachmentChange(attachmentIndex, 'type', event.target.value)}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/20"
                              >
                                {attachmentTypes.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeEditAttachmentField(attachmentIndex)}
                                className="inline-flex items-center gap-1 rounded-full border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                              >
                                <TrashIcon className="h-4 w-4" /> Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={addEditAttachmentField}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                        >
                          <PlusIcon className="h-4 w-4" /> Add attachment
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={editState.saving}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-primary/50"
                        >
                          {editState.saving ? 'Saving…' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3 text-sm text-slate-700">
                      <p className="whitespace-pre-line leading-relaxed">{note.body}</p>
                      {note.attachments && note.attachments.length > 0 && (
                        <div className="space-y-2">
                          {note.attachments.map((attachment, attachmentIndex) => (
                            <a
                              key={`${note.id}-attachment-${attachmentIndex}`}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs font-semibold text-primary underline underline-offset-2"
                            >
                              <PaperClipIcon className="h-4 w-4" />
                              {attachment.label || attachment.url}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

BookingNotesPanel.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string
  }),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  permissions: PropTypes.shape({
    canManageNotes: PropTypes.bool
  }),
  onChanged: PropTypes.func
};

BookingNotesPanel.defaultProps = {
  booking: null,
  permissions: { canManageNotes: true },
  onChanged: () => {}
};

export default BookingNotesPanel;
