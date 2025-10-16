import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon, PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  fetchBookingAssignments,
  createBookingAssignment,
  updateBookingAssignment as updateAssignmentRequest,
  deleteBookingAssignment as deleteAssignmentRequest
} from '../../api/bookingsClient.js';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Awaiting assignment' },
  { value: 'awaiting_assignment', label: 'Crew review' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress / travel' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' }
];

const TYPE_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled visit' },
  { value: 'on_demand', label: 'On-demand request' }
];

const ASSIGNMENT_ROLE_OPTIONS = [
  { value: 'lead', label: 'Lead technician' },
  { value: 'support', label: 'Support crew' }
];

const ASSIGNMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

const attachmentTypes = [
  { value: 'link', label: 'Link' },
  { value: 'image', label: 'Image' },
  { value: 'document', label: 'Document' },
  { value: 'video', label: 'Video' }
];

function toLocalInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromLocalInputValue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function normaliseAttachment(attachment) {
  return {
    label: attachment.label ?? '',
    url: attachment.url ?? '',
    type: attachment.type ?? 'link'
  };
}

const defaultAttachment = { label: '', url: '', type: 'link' };

function buildInitialState(booking, mode) {
  if (!booking) {
    return {
      title: '',
      status: 'pending',
      type: 'scheduled',
      zoneId: '',
      location: '',
      instructions: '',
      demandLevel: '',
      scheduledStart: '',
      scheduledEnd: '',
      attachments: [normaliseAttachment(defaultAttachment)]
    };
  }

  return {
    title: booking.title ?? '',
    status: booking.status ?? 'pending',
    type: booking.type ?? (mode === 'create' ? 'scheduled' : 'on_demand'),
    zoneId: booking.zoneId ?? '',
    location: booking.location ?? '',
    instructions: booking.instructions ?? '',
    demandLevel: booking.demandLevel ?? '',
    scheduledStart: toLocalInputValue(booking.scheduledStart),
    scheduledEnd: toLocalInputValue(booking.scheduledEnd),
    attachments:
      booking.attachments && booking.attachments.length > 0
        ? booking.attachments.map(normaliseAttachment)
        : [normaliseAttachment(defaultAttachment)]
  };
}

function formatAssignmentTimestamp(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
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

function BookingModal({
  open,
  mode,
  booking,
  zones,
  onClose,
  onSave,
  permissions,
  onAssignmentsChanged
}) {
  const fallbackAssignments = useMemo(
    () => (Array.isArray(booking?.assignments) ? booking.assignments : []),
    [booking]
  );
  const [form, setForm] = useState(() => buildInitialState(booking, mode));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  const [crewAssignments, setCrewAssignments] = useState(fallbackAssignments);
  const [crewLoading, setCrewLoading] = useState(false);
  const [crewError, setCrewError] = useState(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [assignmentSaving, setAssignmentSaving] = useState({});
  const [assignmentDeleting, setAssignmentDeleting] = useState({});
  const [newAssignment, setNewAssignment] = useState({ providerId: '', role: 'support' });
  const [newAssignmentSubmitting, setNewAssignmentSubmitting] = useState(false);
  const [newAssignmentError, setNewAssignmentError] = useState(null);

  const canManageCrew = permissions?.canManageCrew !== false;

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(booking, mode));
      setErrors({});
      setSubmitError(null);
      setSubmitting(false);
      setActiveTab('details');
      setCrewAssignments(fallbackAssignments);
      setCrewError(null);
      setAssignmentDrafts({});
      setAssignmentSaving({});
      setAssignmentDeleting({});
      setNewAssignment({ providerId: '', role: 'support' });
      setNewAssignmentSubmitting(false);
      setNewAssignmentError(null);
    }
  }, [booking, mode, open, fallbackAssignments]);

  const zoneOptions = useMemo(() => {
    if (!Array.isArray(zones)) return [];
    return zones.map((zone) => ({ value: zone.value ?? zone.id, label: zone.label ?? zone.name }));
  }, [zones]);

  const loadAssignments = useCallback(async () => {
    if (!booking?.id || mode !== 'edit') {
      setCrewAssignments(fallbackAssignments);
      return;
    }

    setCrewLoading(true);
    setCrewError(null);
    try {
      const response = await fetchBookingAssignments(booking.id);
      setCrewAssignments(Array.isArray(response) ? response : []);
      setAssignmentDrafts({});
      setAssignmentSaving({});
      setAssignmentDeleting({});
    } catch (error) {
      setCrewError(error?.message || 'Unable to load crew assignments');
    } finally {
      setCrewLoading(false);
    }
  }, [booking?.id, mode, fallbackAssignments]);

  useEffect(() => {
    if (!open || mode !== 'edit') {
      return;
    }
    loadAssignments();
  }, [open, mode, booking?.id, loadAssignments]);

  if (!open) {
    return null;
  }

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = 'Title is required';
    }
    if (!form.type) {
      nextErrors.type = 'Booking type is required';
    }
    if (!form.zoneId) {
      nextErrors.zoneId = 'Zone is required';
    }
    if (form.type === 'scheduled') {
      if (!form.scheduledStart) {
        nextErrors.scheduledStart = 'Start time is required for scheduled visits';
      }
      if (!form.scheduledEnd) {
        nextErrors.scheduledEnd = 'End time is required for scheduled visits';
      }
      if (form.scheduledStart && form.scheduledEnd && form.scheduledStart > form.scheduledEnd) {
        nextErrors.scheduledEnd = 'End time must be after the start time';
      }
    }

    const hasAttachments = form.attachments.some((attachment) => attachment.url.trim());
    if (!hasAttachments && form.attachments.length === 0) {
      setForm((prev) => ({
        ...prev,
        attachments: [normaliseAttachment(defaultAttachment)]
      }));
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttachmentChange = (index, field, value) => {
    setForm((prev) => {
      const attachments = [...prev.attachments];
      attachments[index] = { ...attachments[index], [field]: value };
      return { ...prev, attachments };
    });
  };

  const addAttachmentRow = () => {
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, normaliseAttachment(defaultAttachment)]
    }));
  };

  const removeAttachmentRow = (index) => {
    setForm((prev) => {
      const attachments = prev.attachments.filter((_, attachmentIndex) => attachmentIndex !== index);
      return { ...prev, attachments: attachments.length > 0 ? attachments : [normaliseAttachment(defaultAttachment)] };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      title: form.title.trim(),
      status: form.status,
      type: form.type,
      zoneId: form.zoneId,
      location: form.location.trim() || null,
      instructions: form.instructions.trim() || null,
      demandLevel: form.demandLevel.trim() || null,
      scheduledStart: form.scheduledStart ? fromLocalInputValue(form.scheduledStart) : null,
      scheduledEnd: form.scheduledEnd ? fromLocalInputValue(form.scheduledEnd) : null,
      attachments: form.attachments
        .filter((attachment) => attachment.url.trim())
        .map((attachment) => ({
          label: attachment.label.trim() || 'Attachment',
          url: attachment.url.trim(),
          type: attachment.type || 'link'
        }))
    };

    try {
      await onSave(payload);
      onClose();
    } catch (error) {
      const message = error?.message || 'Unable to save booking';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'crew') {
      loadAssignments();
    }
  };

  const handleAssignmentDraftChange = (assignmentId, field, value) => {
    setAssignmentDrafts((prev) => ({
      ...prev,
      [assignmentId]: { ...(prev[assignmentId] || {}), [field]: value }
    }));
  };

  const hasAssignmentChanges = (assignment) => {
    const draft = assignmentDrafts[assignment.id];
    if (!draft) {
      return false;
    }
    if (draft.role && draft.role !== assignment.role) {
      return true;
    }
    if (draft.status && draft.status !== assignment.status) {
      return true;
    }
    return false;
  };

  const saveAssignment = async (assignment) => {
    if (!booking?.id || !canManageCrew) {
      return;
    }
    const draft = assignmentDrafts[assignment.id];
    if (!draft) {
      return;
    }

    const payload = {};
    if (draft.role && draft.role !== assignment.role) {
      payload.role = draft.role;
    }
    if (draft.status && draft.status !== assignment.status) {
      payload.status = draft.status;
    }

    if (Object.keys(payload).length === 0) {
      setAssignmentDrafts((prev) => {
        const next = { ...prev };
        delete next[assignment.id];
        return next;
      });
      return;
    }

    setAssignmentSaving((prev) => ({ ...prev, [assignment.id]: true }));
    setCrewError(null);
    try {
      await updateAssignmentRequest(booking.id, assignment.id, payload);
      setAssignmentDrafts((prev) => {
        const next = { ...prev };
        delete next[assignment.id];
        return next;
      });
      await loadAssignments();
      if (onAssignmentsChanged) {
        await onAssignmentsChanged();
      }
    } catch (error) {
      setCrewError(error?.message || 'Unable to update assignment');
    } finally {
      setAssignmentSaving((prev) => ({ ...prev, [assignment.id]: false }));
    }
  };

  const removeAssignment = async (assignmentId) => {
    if (!booking?.id || !canManageCrew) {
      return;
    }
    setAssignmentDeleting((prev) => ({ ...prev, [assignmentId]: true }));
    setCrewError(null);
    try {
      await deleteAssignmentRequest(booking.id, assignmentId);
      setAssignmentDrafts((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
      await loadAssignments();
      if (onAssignmentsChanged) {
        await onAssignmentsChanged();
      }
    } catch (error) {
      setCrewError(error?.message || 'Unable to remove assignment');
    } finally {
      setAssignmentDeleting((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleNewAssignmentChange = (field) => (event) => {
    const { value } = event.target;
    setNewAssignment((prev) => ({ ...prev, [field]: value }));
  };

  const submitNewAssignment = async (event) => {
    event.preventDefault();
    if (!booking?.id || !canManageCrew) {
      return;
    }
    if (!newAssignment.providerId.trim()) {
      setNewAssignmentError('Provider ID is required');
      return;
    }

    setNewAssignmentSubmitting(true);
    setNewAssignmentError(null);
    try {
      await createBookingAssignment(booking.id, {
        providerId: newAssignment.providerId.trim(),
        role: newAssignment.role
      });
      setNewAssignment({ providerId: '', role: 'support' });
      await loadAssignments();
      if (onAssignmentsChanged) {
        await onAssignmentsChanged();
      }
    } catch (error) {
      setNewAssignmentError(error?.message || 'Unable to add assignment');
    } finally {
      setNewAssignmentSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              {mode === 'create' ? 'New booking' : 'Edit booking'}
            </p>
            <h2 className="text-xl font-semibold text-primary">
              {mode === 'create' ? 'Create booking' : booking?.title || 'Update booking'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {mode === 'edit' && (
          <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-3">
            <button
              type="button"
              onClick={() => handleTabChange('details')}
              className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                activeTab === 'details'
                  ? 'bg-primary text-white shadow'
                  : 'text-primary hover:bg-primary/10'
              }`}
            >
              Visit details
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('crew')}
              className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                activeTab === 'crew'
                  ? 'bg-primary text-white shadow'
                  : 'text-primary hover:bg-primary/10'
              }`}
            >
              Crew assignments
            </button>
          </div>
        )}

        {activeTab === 'details' ? (
          <>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="booking-title" className="mb-1 block text-sm font-semibold text-primary">
                      Booking title
                    </label>
                    <input
                      id="booking-title"
                      name="title"
                      value={form.title}
                      onChange={handleChange('title')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary/30"
                      placeholder="e.g. HVAC seasonal visit"
                      required
                    />
                    {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="booking-type" className="mb-1 block text-sm font-semibold text-primary">
                        Booking type
                      </label>
                      <select
                        id="booking-type"
                        name="type"
                        value={form.type}
                        onChange={handleChange('type')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                        disabled={mode === 'edit'}
                      >
                        {TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {mode === 'edit' && (
                        <p className="mt-1 text-xs text-slate-500">
                          Booking type is managed from workflow automation.
                        </p>
                      )}
                      {errors.type && <p className="mt-1 text-xs text-rose-600">{errors.type}</p>}
                    </div>

                    <div>
                      <label htmlFor="booking-status" className="mb-1 block text-sm font-semibold text-primary">
                        Status
                      </label>
                      <select
                        id="booking-status"
                        name="status"
                        value={form.status}
                        onChange={handleChange('status')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="booking-zone" className="mb-1 block text-sm font-semibold text-primary">
                      Service zone
                    </label>
                    <select
                      id="booking-zone"
                      name="zoneId"
                      value={form.zoneId}
                      onChange={handleChange('zoneId')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                    >
                      <option value="">Select zone</option>
                      {zoneOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.zoneId && <p className="mt-1 text-xs text-rose-600">{errors.zoneId}</p>}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="booking-start" className="mb-1 block text-sm font-semibold text-primary">
                        Start time
                      </label>
                      <input
                        id="booking-start"
                        type="datetime-local"
                        value={form.scheduledStart}
                        onChange={handleChange('scheduledStart')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                      />
                      {errors.scheduledStart && <p className="mt-1 text-xs text-rose-600">{errors.scheduledStart}</p>}
                    </div>
                    <div>
                      <label htmlFor="booking-end" className="mb-1 block text-sm font-semibold text-primary">
                        End time
                      </label>
                      <input
                        id="booking-end"
                        type="datetime-local"
                        value={form.scheduledEnd}
                        onChange={handleChange('scheduledEnd')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                      />
                      {errors.scheduledEnd && <p className="mt-1 text-xs text-rose-600">{errors.scheduledEnd}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="booking-demand" className="mb-1 block text-sm font-semibold text-primary">
                      Demand level
                    </label>
                    <input
                      id="booking-demand"
                      value={form.demandLevel}
                      onChange={handleChange('demandLevel')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                      placeholder="e.g. High, Normal, Low"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="booking-location" className="mb-1 block text-sm font-semibold text-primary">
                      Location / site
                    </label>
                    <input
                      id="booking-location"
                      value={form.location}
                      onChange={handleChange('location')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                      placeholder="e.g. 18 Market Street, Docklands"
                    />
                  </div>

                  <div>
                    <label htmlFor="booking-instructions" className="mb-1 block text-sm font-semibold text-primary">
                      Visit instructions
                    </label>
                    <textarea
                      id="booking-instructions"
                      value={form.instructions}
                      onChange={handleChange('instructions')}
                      rows={6}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                      placeholder="Access codes, onsite contacts, notes for crew..."
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-primary">Attachments</label>
                      <button
                        type="button"
                        onClick={addAttachmentRow}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                      >
                        <PlusIcon className="h-4 w-4" /> Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {form.attachments.map((attachment, index) => (
                        <div key={`attachment-${index}`} className="grid gap-3 sm:grid-cols-8">
                          <div className="sm:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-primary">Label</label>
                            <input
                              value={attachment.label}
                              onChange={(event) => handleAttachmentChange(index, 'label', event.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/30"
                              placeholder="e.g. Floor plan"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label className="mb-1 block text-xs font-medium text-primary">URL</label>
                            <input
                              value={attachment.url}
                              onChange={(event) => handleAttachmentChange(index, 'url', event.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/30"
                              placeholder="https://"
                              required={!attachment.url.trim() && form.attachments.length === 1}
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="mb-1 block text-xs font-medium text-primary">Type</label>
                            <select
                              value={attachment.type}
                              onChange={(event) => handleAttachmentChange(index, 'type', event.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/30"
                            >
                              {attachmentTypes.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => removeAttachmentRow(index)}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {submitError && <p className="mt-4 text-sm text-rose-600">{submitError}</p>}
            </form>

            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form=""
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                >
                  {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  Save booking
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Crew</p>
                <h3 className="text-lg font-semibold text-primary">Assignments & availability</h3>
                <p className="text-xs text-slate-500">
                  Manage lead technicians and support crew for this booking. Updates apply immediately.
                </p>
              </div>

              {crewLoading && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" /> Refreshing assignments…
                </div>
              )}

              {crewError && <p className="mb-4 text-sm text-rose-600">{crewError}</p>}

              <div className="space-y-4">
                {crewAssignments.length > 0 ? (
                  crewAssignments.map((assignment) => {
                    const draft = assignmentDrafts[assignment.id] || {};
                    const pendingRole = draft.role ?? assignment.role;
                    const pendingStatus = draft.status ?? assignment.status;
                    const isSaving = Boolean(assignmentSaving[assignment.id]);
                    const isDeleting = Boolean(assignmentDeleting[assignment.id]);
                    const dirty = hasAssignmentChanges(assignment);
                    return (
                      <div
                        key={assignment.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-primary">
                              {assignment.providerName || 'Unnamed provider'}
                            </p>
                            {assignment.providerEmail && (
                              <p className="text-xs text-slate-500">{assignment.providerEmail}</p>
                            )}
                            <p className="mt-2 text-xs text-slate-500">
                              Assigned {formatAssignmentTimestamp(assignment.assignedAt)}
                              {assignment.acknowledgedAt
                                ? ` • Acknowledged ${formatAssignmentTimestamp(assignment.acknowledgedAt)}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-medium text-slate-600">Role</label>
                              <select
                                value={pendingRole}
                                onChange={(event) =>
                                  handleAssignmentDraftChange(assignment.id, 'role', event.target.value)
                                }
                                disabled={!canManageCrew || isSaving || isDeleting}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-primary focus:border-primary focus:outline-none focus:ring focus:ring-primary/30"
                              >
                                {ASSIGNMENT_ROLE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-medium text-slate-600">Status</label>
                              <select
                                value={pendingStatus}
                                onChange={(event) =>
                                  handleAssignmentDraftChange(assignment.id, 'status', event.target.value)
                                }
                                disabled={!canManageCrew || isSaving || isDeleting}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-primary focus:border-primary focus:outline-none focus:ring focus:ring-primary/30"
                              >
                                {ASSIGNMENT_STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {canManageCrew && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveAssignment(assignment)}
                                  disabled={!dirty || isSaving || isDeleting}
                                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                                >
                                  {isSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeAssignment(assignment.id)}
                                  disabled={isDeleting}
                                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                                >
                                  {isDeleting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                    No crew have been assigned yet.
                  </div>
                )}
              </div>

              {canManageCrew && (
                <form
                  onSubmit={submitNewAssignment}
                  className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4"
                >
                  <h4 className="text-sm font-semibold text-primary">Add assignment</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Provide a provider identifier to invite them onto this booking.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1">
                      <label htmlFor="assignment-provider" className="mb-1 block text-xs font-medium text-primary">
                        Provider ID
                      </label>
                      <input
                        id="assignment-provider"
                        value={newAssignment.providerId}
                        onChange={handleNewAssignmentChange('providerId')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                        placeholder="UUID or reference"
                      />
                    </div>
                    <div>
                      <label htmlFor="assignment-role" className="mb-1 block text-xs font-medium text-primary">
                        Role
                      </label>
                      <select
                        id="assignment-role"
                        value={newAssignment.role}
                        onChange={handleNewAssignmentChange('role')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary focus:border-primary focus:ring focus:ring-primary/30"
                      >
                        {ASSIGNMENT_ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={newAssignmentSubmitting}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                    >
                      {newAssignmentSubmitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                      Add assignment
                    </button>
                  </div>
                  {newAssignmentError && <p className="mt-2 text-xs text-rose-600">{newAssignmentError}</p>}
                </form>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 text-right">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

BookingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  booking: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    status: PropTypes.string,
    type: PropTypes.string,
    zoneId: PropTypes.string,
    location: PropTypes.string,
    instructions: PropTypes.string,
    demandLevel: PropTypes.string,
    scheduledStart: PropTypes.string,
    scheduledEnd: PropTypes.string,
    attachments: PropTypes.array,
    assignments: PropTypes.array
  }),
  zones: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({ value: PropTypes.string, label: PropTypes.string }),
      PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
    ])
  ),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  permissions: PropTypes.shape({
    canManageCrew: PropTypes.bool
  }),
  onAssignmentsChanged: PropTypes.func
};

BookingModal.defaultProps = {
  booking: null,
  zones: [],
  permissions: null,
  onAssignmentsChanged: null
};

export default BookingModal;
