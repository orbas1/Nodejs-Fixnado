import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import ChecklistEditor from './ChecklistEditor.jsx';
import AttachmentEditor from './AttachmentEditor.jsx';

const TIMELINE_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'status_update', label: 'Status update' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'handoff', label: 'Handoff' },
  { value: 'document', label: 'Document' }
];

const TIMELINE_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
}

function toDateTimeInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function parseDateTimeInput(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function TagsInput({ value, onChange }) {
  return (
    <label className="text-xs font-medium text-primary">
      Tags (comma separated)
      <input
        type="text"
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="emergency, hvac, permits"
      />
    </label>
  );
}

TagsInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

function QuickInfo({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-primary/60">{label}</dt>
      <dd className="mt-1 text-sm text-slate-700">{value ?? '—'}</dd>
    </div>
  );
}

QuickInfo.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node
};

QuickInfo.defaultProps = {
  value: '—'
};

export default function BookingDetailPanel({
  booking,
  timezone,
  onRefresh,
  onUpdateStatus,
  onUpdateSchedule,
  onUpdateDetails,
  onCreateNote,
  onCreateTimelineEntry
}) {
  const [statusForm, setStatusForm] = useState({ status: '', reason: '' });
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    scheduledStart: '',
    scheduledEnd: '',
    travelMinutes: ''
  });
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);

  const [detailsForm, setDetailsForm] = useState({
    summary: '',
    instructions: '',
    tags: '',
    autoAssignEnabled: false,
    allowCustomerEdits: false
  });
  const [checklist, setChecklist] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [images, setImages] = useState([]);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsFeedback, setDetailsFeedback] = useState(null);
  const [detailsError, setDetailsError] = useState(null);

  const [noteForm, setNoteForm] = useState({ body: '', attachments: [] });
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const [timelineForm, setTimelineForm] = useState({
    title: '',
    entryType: TIMELINE_TYPES[0].value,
    status: TIMELINE_STATUSES[0].value,
    summary: '',
    occurredAt: ''
  });
  const [timelineSaving, setTimelineSaving] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
  const [timelineAttachments, setTimelineAttachments] = useState([]);

  useEffect(() => {
    if (!booking) {
      setStatusForm({ status: '', reason: '' });
      setScheduleForm({ scheduledStart: '', scheduledEnd: '', travelMinutes: '' });
      setDetailsForm({ summary: '', instructions: '', tags: '', autoAssignEnabled: false, allowCustomerEdits: false });
      setChecklist([]);
      setAttachments([]);
      setImages([]);
      setNoteForm({ body: '', attachments: [] });
      return;
    }

    setStatusForm({ status: booking.status ?? '', reason: '' });
    setScheduleForm({
      scheduledStart: toDateTimeInputValue(booking.scheduledStart),
      scheduledEnd: toDateTimeInputValue(booking.scheduledEnd),
      travelMinutes: booking.travelMinutes != null ? String(booking.travelMinutes) : ''
    });
    setDetailsForm({
      summary: booking.summary ?? '',
      instructions: booking.instructions ?? '',
      tags: Array.isArray(booking.tags) ? booking.tags.join(', ') : '',
      autoAssignEnabled: booking.autoAssignEnabled === true,
      allowCustomerEdits: booking.allowCustomerEdits === true
    });
    setChecklist(Array.isArray(booking.checklist) ? booking.checklist : []);
    setAttachments(Array.isArray(booking.attachments) ? booking.attachments : []);
    setImages(Array.isArray(booking.images) ? booking.images : []);
    setNoteForm({ body: '', attachments: [] });
    setTimelineForm({
      title: '',
      entryType: TIMELINE_TYPES[0].value,
      status: TIMELINE_STATUSES[0].value,
      summary: '',
      occurredAt: ''
    });
    setTimelineAttachments([]);
    setStatusFeedback(null);
    setStatusError(null);
    setScheduleFeedback(null);
    setScheduleError(null);
    setDetailsFeedback(null);
    setDetailsError(null);
    setNoteError(null);
    setTimelineError(null);
  }, [booking]);

  const summaryCards = useMemo(() => {
    if (!booking) {
      return [];
    }
    return [
      { label: 'Status', value: booking.statusLabel ?? booking.status },
      { label: 'Demand level', value: booking.demandLevel ?? '—' },
      { label: 'SLA', value: booking.slaStatus ? booking.slaStatus.replace(/_/g, ' ') : '—' },
      { label: 'Commission', value: booking.commissionAmount != null ? `${booking.currency ?? 'GBP'} ${booking.commissionAmount}` : '—' }
    ];
  }, [booking]);

  if (!booking) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-sm text-slate-500">
        Select a booking to manage its lifecycle, notes, and documentation.
      </div>
    );
  }

  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    setStatusSaving(true);
    setStatusFeedback(null);
    setStatusError(null);
    try {
      await onUpdateStatus({
        status: statusForm.status,
        reason: statusForm.reason ? statusForm.reason.trim() : undefined
      });
      setStatusFeedback('Status updated successfully.');
      setStatusForm((current) => ({ ...current, reason: '' }));
    } catch (error) {
      setStatusError(error?.message ?? 'Failed to update status');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    setScheduleSaving(true);
    setScheduleFeedback(null);
    setScheduleError(null);
    try {
      await onUpdateSchedule({
        scheduledStart: parseDateTimeInput(scheduleForm.scheduledStart),
        scheduledEnd: parseDateTimeInput(scheduleForm.scheduledEnd),
        travelMinutes:
          scheduleForm.travelMinutes === '' ? undefined : Number.parseInt(scheduleForm.travelMinutes, 10)
      });
      setScheduleFeedback('Schedule updated');
    } catch (error) {
      setScheduleError(error?.message ?? 'Failed to update schedule');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDetailsSubmit = async (event) => {
    event.preventDefault();
    setDetailsSaving(true);
    setDetailsFeedback(null);
    setDetailsError(null);
    try {
      const payload = {
        summary: detailsForm.summary,
        instructions: detailsForm.instructions,
        tags: detailsForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        checklist,
        attachments: attachments.filter((item) => item.url),
        images: images.filter((item) => item.url),
        autoAssignEnabled: detailsForm.autoAssignEnabled,
        allowCustomerEdits: detailsForm.allowCustomerEdits
      };
      await onUpdateDetails(payload);
      setDetailsFeedback('Booking details saved');
    } catch (error) {
      setDetailsError(error?.message ?? 'Failed to save details');
    } finally {
      setDetailsSaving(false);
    }
  };

  const handleNoteSubmit = async (event) => {
    event.preventDefault();
    if (!noteForm.body.trim()) {
      setNoteError('Add a note before saving');
      return;
    }
    setNoteSaving(true);
    setNoteError(null);
    try {
      await onCreateNote({
        body: noteForm.body,
        attachments: noteForm.attachments.filter((attachment) => attachment.url)
      });
      setNoteForm({ body: '', attachments: [] });
    } catch (error) {
      setNoteError(error?.message ?? 'Failed to save note');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleTimelineSubmit = async (event) => {
    event.preventDefault();
    setTimelineSaving(true);
    setTimelineError(null);
    try {
      await onCreateTimelineEntry({
        title: timelineForm.title || 'Timeline update',
        entryType: timelineForm.entryType,
        status: timelineForm.status,
        summary: timelineForm.summary || undefined,
        occurredAt: parseDateTimeInput(timelineForm.occurredAt),
        attachments: timelineAttachments.filter((attachment) => attachment.url)
      });
      setTimelineForm({
        title: '',
        entryType: TIMELINE_TYPES[0].value,
        status: TIMELINE_STATUSES[0].value,
        summary: '',
        occurredAt: ''
      });
      setTimelineAttachments([]);
    } catch (error) {
      setTimelineError(error?.message ?? 'Failed to add timeline entry');
    } finally {
      setTimelineSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">{booking.title}</h2>
            <p className="text-sm text-slate-600">
              {booking.customer?.name ? `${booking.customer.name} • ` : ''}
              {booking.location ?? 'Location pending'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {booking.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-semibold text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <a
              href={booking.links?.orderWorkspace}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 font-semibold text-primary transition hover:border-primary/40"
            >
              Open order workspace
            </a>
            <a
              href={booking.links?.bookingApi}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              Booking API payload
            </a>
            <Button type="button" size="sm" variant="ghost" onClick={onRefresh}>
              Refresh booking data
            </Button>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <QuickInfo key={item.label} label={item.label} value={item.value} />
          ))}
          <QuickInfo label="Scheduled start" value={formatDate(booking.scheduledStart)} />
          <QuickInfo label="Scheduled end" value={formatDate(booking.scheduledEnd)} />
          <QuickInfo label="SLA deadline" value={formatDate(booking.slaExpiresAt)} />
          <QuickInfo label="Travel buffer" value={booking.travelMinutes ? `${booking.travelMinutes} mins` : '—'} />
        </dl>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/60">Site contact</p>
            <p className="mt-2 font-medium text-primary">{booking.siteContact?.name ?? 'Not provided'}</p>
            <p>{booking.siteContact?.phone ?? '—'}</p>
            <p>{booking.siteContact?.email ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/60">Customer reference</p>
            <p className="mt-2 font-medium text-primary">{booking.customer?.reference ?? '—'}</p>
            <p className="mt-1 text-xs text-slate-500">Timezone: {timezone}</p>
          </div>
        </div>
      </article>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleStatusSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary">Update status</h3>
            <StatusPill tone={booking.slaStatus === 'at_risk' ? 'warning' : 'info'}>
              SLA {booking.slaStatus?.replace(/_/g, ' ') ?? 'unknown'}
            </StatusPill>
          </div>
          <p className="mt-2 text-sm text-slate-600">Transition bookings through allowed states and record audit reasons.</p>
          <div className="mt-4 space-y-3">
            <label className="text-xs font-medium text-primary">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={statusForm.status}
                onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}
              >
                {booking.statusOptions?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-primary">
              Reason (optional)
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={statusForm.reason}
                onChange={(event) => setStatusForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Reached site, work started"
              />
            </label>
          </div>
          {statusError ? <p className="mt-3 text-sm text-rose-600">{statusError}</p> : null}
          {statusFeedback ? <p className="mt-3 text-sm text-emerald-600">{statusFeedback}</p> : null}
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={statusSaving}>
              {statusSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="1rem" /> Saving
                </span>
              ) : (
                'Save status'
              )}
            </Button>
          </div>
        </form>

        <form onSubmit={handleScheduleSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary">Schedule & travel</h3>
          <p className="mt-2 text-sm text-slate-600">
            Update arrival windows and travel buffers to keep routing accurate.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-medium text-primary">
              Scheduled start
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={scheduleForm.scheduledStart}
                onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledStart: event.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-primary">
              Scheduled end
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={scheduleForm.scheduledEnd}
                onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledEnd: event.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-primary">
              Travel buffer (minutes)
              <input
                type="number"
                min="0"
                max="480"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={scheduleForm.travelMinutes}
                onChange={(event) => setScheduleForm((current) => ({ ...current, travelMinutes: event.target.value }))}
              />
            </label>
          </div>
          {scheduleError ? <p className="mt-3 text-sm text-rose-600">{scheduleError}</p> : null}
          {scheduleFeedback ? <p className="mt-3 text-sm text-emerald-600">{scheduleFeedback}</p> : null}
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={scheduleSaving}>
              {scheduleSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="1rem" /> Saving
                </span>
              ) : (
                'Save schedule'
              )}
            </Button>
          </div>
        </form>
      </section>

      <form onSubmit={handleDetailsSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-primary">Job brief & resources</h3>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <label className="inline-flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                checked={detailsForm.autoAssignEnabled}
                onChange={(event) =>
                  setDetailsForm((current) => ({ ...current, autoAssignEnabled: event.target.checked }))
                }
              />
              Auto-assign eligible crew
            </label>
            <label className="inline-flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                checked={detailsForm.allowCustomerEdits}
                onChange={(event) =>
                  setDetailsForm((current) => ({ ...current, allowCustomerEdits: event.target.checked }))
                }
              />
              Allow customer edits
            </label>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-medium text-primary">
            Summary
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              rows={4}
              value={detailsForm.summary}
              onChange={(event) => setDetailsForm((current) => ({ ...current, summary: event.target.value }))}
              placeholder="High level context for the crew"
            />
          </label>
          <label className="text-xs font-medium text-primary">
            Instructions
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              rows={4}
              value={detailsForm.instructions}
              onChange={(event) => setDetailsForm((current) => ({ ...current, instructions: event.target.value }))}
              placeholder="Detailed onsite instructions, permits, safety notes"
            />
          </label>
        </div>
        <TagsInput value={detailsForm.tags} onChange={(value) => setDetailsForm((current) => ({ ...current, tags: value }))} />
        <ChecklistEditor items={checklist} onChange={setChecklist} />
        <AttachmentEditor
          title="Reference documents"
          items={attachments}
          onChange={setAttachments}
          emptyLabel="Upload RAMS, permits, or diagrams to keep teams aligned."
        />
        <AttachmentEditor
          title="Site images & media"
          items={images}
          onChange={setImages}
          emptyLabel="Add pre/post work images to share with the crew."
        />
        {detailsError ? <p className="text-sm text-rose-600">{detailsError}</p> : null}
        {detailsFeedback ? <p className="text-sm text-emerald-600">{detailsFeedback}</p> : null}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={detailsSaving}>
            {detailsSaving ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="1rem" /> Saving
              </span>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleNoteSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary">Crew note</h3>
          <p className="mt-2 text-sm text-slate-600">Capture quick updates or reminders for technicians.</p>
          <label className="mt-4 block text-xs font-medium text-primary">
            Note body
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              rows={4}
              value={noteForm.body}
              onChange={(event) => setNoteForm((current) => ({ ...current, body: event.target.value }))}
              placeholder="Document access codes, lockbox details, or customer requests"
            />
          </label>
          <AttachmentEditor
            title="Attachments"
            items={noteForm.attachments}
            onChange={(items) => setNoteForm((current) => ({ ...current, attachments: items }))}
            emptyLabel="Add optional links or files for this note."
          />
          {noteError ? <p className="mt-3 text-sm text-rose-600">{noteError}</p> : null}
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={noteSaving}>
              {noteSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="1rem" /> Saving
                </span>
              ) : (
                'Post note'
              )}
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {booking.notes?.map((note) => (
              <article key={note.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(note.createdAt)}</span>
                  <span className="uppercase tracking-wide">{note.authorType ?? 'serviceman'}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-primary">{note.body}</p>
                {note.attachments?.length ? (
                  <ul className="mt-3 space-y-2 text-xs">
                    {note.attachments.map((attachment, index) => (
                      <li key={`${attachment.url}-${index}`}>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-primary underline"
                        >
                          {attachment.label ?? attachment.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
            {!booking.notes?.length ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                Notes will appear here once added.
              </p>
            ) : null}
          </div>
        </form>

        <form onSubmit={handleTimelineSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary">Timeline & milestones</h3>
          <p className="mt-2 text-sm text-slate-600">Record handoffs, documents, or status checkpoints.</p>
          <div className="mt-4 space-y-3">
            <label className="text-xs font-medium text-primary">
              Title
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={timelineForm.title}
                onChange={(event) => setTimelineForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Crew dispatched"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-primary">
                Type
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={timelineForm.entryType}
                  onChange={(event) => setTimelineForm((current) => ({ ...current, entryType: event.target.value }))}
                >
                  {TIMELINE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-primary">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={timelineForm.status}
                  onChange={(event) => setTimelineForm((current) => ({ ...current, status: event.target.value }))}
                >
                  {TIMELINE_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-xs font-medium text-primary">
              Summary (optional)
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                rows={3}
                value={timelineForm.summary}
                onChange={(event) => setTimelineForm((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Include next steps or required documents"
              />
            </label>
            <label className="text-xs font-medium text-primary">
              Occurred at (optional)
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={timelineForm.occurredAt}
                onChange={(event) => setTimelineForm((current) => ({ ...current, occurredAt: event.target.value }))}
              />
            </label>
          </div>
          <AttachmentEditor
            title="Supporting documents"
            items={timelineAttachments}
            onChange={setTimelineAttachments}
            emptyLabel="Attach handover forms, permits, or documents related to this event."
          />
          {timelineError ? <p className="mt-3 text-sm text-rose-600">{timelineError}</p> : null}
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={timelineSaving}>
              {timelineSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="1rem" /> Saving
                </span>
              ) : (
                'Add timeline entry'
              )}
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {booking.timeline?.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{entry.title}</p>
                    <p className="text-xs uppercase tracking-wide text-primary/60">
                      {entry.entryType?.replace(/_/g, ' ')} • {entry.status?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(entry.occurredAt)}</span>
                </div>
                {entry.summary ? <p className="mt-2 text-sm text-slate-600">{entry.summary}</p> : null}
                {entry.attachments?.length ? (
                  <ul className="mt-3 space-y-2 text-xs">
                    {entry.attachments.map((attachment, index) => (
                      <li key={`${attachment.url}-${index}`}>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-primary underline"
                        >
                          {attachment.label ?? attachment.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
            {!booking.timeline?.length ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                Timeline events will appear here after you add them.
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}

BookingDetailPanel.propTypes = {
  booking: PropTypes.shape({
    bookingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    statusLabel: PropTypes.string,
    statusOptions: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
      })
    ),
    scheduledStart: PropTypes.string,
    scheduledEnd: PropTypes.string,
    slaExpiresAt: PropTypes.string,
    slaStatus: PropTypes.string,
    travelMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    demandLevel: PropTypes.string,
    commissionAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    customer: PropTypes.shape({
      name: PropTypes.string,
      reference: PropTypes.string
    }),
    siteContact: PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string,
      email: PropTypes.string
    }),
    location: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    checklist: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        mandatory: PropTypes.bool
      })
    ),
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string
      })
    ),
    images: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string
      })
    ),
    instructions: PropTypes.string,
    summary: PropTypes.string,
    autoAssignEnabled: PropTypes.bool,
    allowCustomerEdits: PropTypes.bool,
    notes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        body: PropTypes.string,
        createdAt: PropTypes.string,
        authorType: PropTypes.string,
        attachments: PropTypes.arrayOf(
          PropTypes.shape({
            url: PropTypes.string,
            label: PropTypes.string
          })
        )
      })
    ),
    timeline: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        entryType: PropTypes.string,
        status: PropTypes.string,
        summary: PropTypes.string,
        occurredAt: PropTypes.string,
        attachments: PropTypes.arrayOf(
          PropTypes.shape({
            url: PropTypes.string,
            label: PropTypes.string
          })
        )
      })
    ),
    links: PropTypes.shape({
      orderWorkspace: PropTypes.string,
      bookingApi: PropTypes.string
    })
  }),
  timezone: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onUpdateSchedule: PropTypes.func.isRequired,
  onUpdateDetails: PropTypes.func.isRequired,
  onCreateNote: PropTypes.func.isRequired,
  onCreateTimelineEntry: PropTypes.func.isRequired
};

BookingDetailPanel.defaultProps = {
  booking: null
};
