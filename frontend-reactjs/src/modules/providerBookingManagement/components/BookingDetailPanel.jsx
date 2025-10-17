import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import ChecklistEditor from '../../servicemanControl/components/ChecklistEditor.jsx';
import AttachmentEditor from '../../servicemanControl/components/AttachmentEditor.jsx';

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

function formatDate(value) {
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
    minute: '2-digit'
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

function AssignmentsList({ assignments }) {
  if (!assignments?.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
        No crew assignments recorded yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {assignments.map((assignment) => (
        <li key={assignment.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-primary">
              {assignment.provider?.name || 'Crew member'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <StatusPill tone={assignment.status === 'accepted' ? 'positive' : 'info'}>{assignment.status}</StatusPill>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{assignment.role}</span>
              {assignment.assignedAt ? <span>Assigned {formatDate(assignment.assignedAt)}</span> : null}
              {assignment.acknowledgedAt ? <span>Acknowledged {formatDate(assignment.acknowledgedAt)}</span> : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

AssignmentsList.propTypes = {
  assignments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      status: PropTypes.string,
      role: PropTypes.string,
      assignedAt: PropTypes.string,
      acknowledgedAt: PropTypes.string,
      provider: PropTypes.shape({ name: PropTypes.string })
    })
  )
};

AssignmentsList.defaultProps = {
  assignments: []
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
    allowCustomerEdits: true
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
      setDetailsForm({ summary: '', instructions: '', tags: '', autoAssignEnabled: false, allowCustomerEdits: true });
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
      allowCustomerEdits: booking.allowCustomerEdits !== false
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
      {
        label: 'Booking value',
        value:
          booking.financial?.totalAmount != null
            ? new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: booking.financial?.currency || 'GBP'
              }).format(Number(booking.financial.totalAmount))
            : '—'
      },
      {
        label: 'Commission',
        value:
          booking.financial?.commissionAmount != null
            ? new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: booking.financial?.currency || 'GBP'
              }).format(Number(booking.financial.commissionAmount))
            : '—'
      },
      {
        label: 'Assignments',
        value: `${booking.assignments?.length ?? 0} crew`
      },
      {
        label: 'SLA status',
        value: booking.slaStatus === 'at_risk' ? 'At risk' : 'Healthy'
      }
    ];
  }, [booking]);

  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    if (!booking) return;
    setStatusError(null);
    setStatusFeedback(null);
    setStatusSaving(true);
    try {
      await onUpdateStatus({ status: statusForm.status, reason: statusForm.reason });
      setStatusFeedback('Status updated successfully');
      onRefresh();
    } catch (caught) {
      setStatusError(caught?.message ?? 'Failed to update status');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (!booking) return;
    setScheduleError(null);
    setScheduleFeedback(null);
    setScheduleSaving(true);
    try {
      await onUpdateSchedule({
        scheduledStart: parseDateTimeInput(scheduleForm.scheduledStart),
        scheduledEnd: parseDateTimeInput(scheduleForm.scheduledEnd),
        travelMinutes: scheduleForm.travelMinutes ? Number.parseInt(scheduleForm.travelMinutes, 10) : undefined
      });
      setScheduleFeedback('Schedule updated');
      onRefresh();
    } catch (caught) {
      setScheduleError(caught?.message ?? 'Failed to update schedule');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDetailsSubmit = async (event) => {
    event.preventDefault();
    if (!booking) return;
    setDetailsError(null);
    setDetailsFeedback(null);
    setDetailsSaving(true);
    try {
      await onUpdateDetails({
        summary: detailsForm.summary,
        instructions: detailsForm.instructions,
        tags: detailsForm.tags,
        checklist,
        attachments,
        images,
        autoAssignEnabled: detailsForm.autoAssignEnabled,
        allowCustomerEdits: detailsForm.allowCustomerEdits
      });
      setDetailsFeedback('Booking details saved');
      onRefresh();
    } catch (caught) {
      setDetailsError(caught?.message ?? 'Failed to update booking details');
    } finally {
      setDetailsSaving(false);
    }
  };

  const handleNoteSubmit = async (event) => {
    event.preventDefault();
    if (!booking) return;
    setNoteError(null);
    if (!noteForm.body.trim()) {
      setNoteError('Note body is required');
      return;
    }
    setNoteSaving(true);
    try {
      await onCreateNote({ body: noteForm.body, attachments: noteForm.attachments });
      setNoteForm({ body: '', attachments: [] });
      onRefresh();
    } catch (caught) {
      setNoteError(caught?.message ?? 'Failed to record note');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleTimelineSubmit = async (event) => {
    event.preventDefault();
    if (!booking) return;
    setTimelineError(null);
    if (!timelineForm.title.trim()) {
      setTimelineError('Timeline entry requires a title');
      return;
    }
    setTimelineSaving(true);
    try {
      await onCreateTimelineEntry({
        ...timelineForm,
        occurredAt: parseDateTimeInput(timelineForm.occurredAt),
        attachments: timelineAttachments
      });
      setTimelineForm({
        title: '',
        entryType: TIMELINE_TYPES[0].value,
        status: TIMELINE_STATUSES[0].value,
        summary: '',
        occurredAt: ''
      });
      setTimelineAttachments([]);
      onRefresh();
    } catch (caught) {
      setTimelineError(caught?.message ?? 'Failed to record timeline entry');
    } finally {
      setTimelineSaving(false);
    }
  };

  if (!booking) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-500">
        Select a booking to view details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Booking summary</p>
            <h2 className="mt-2 text-2xl font-semibold text-primary">{booking.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <StatusPill tone={booking.status === 'completed' ? 'positive' : 'info'}>{booking.statusLabel}</StatusPill>
              <StatusPill tone={booking.slaStatus === 'at_risk' ? 'warning' : 'success'}>
                SLA {booking.slaStatus === 'at_risk' ? 'at risk' : 'healthy'}
              </StatusPill>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">Timezone • {timezone}</span>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={onRefresh}>
            Refresh booking
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-100 bg-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/60">{card.label}</p>
              <p className="mt-2 text-lg font-semibold text-primary">{card.value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleStatusSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary">Status management</h3>
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
            Reason / note (optional)
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              value={statusForm.reason}
              onChange={(event) => setStatusForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder="Updated after customer confirmation"
            />
          </label>
          {statusError ? (
            <p className="text-xs text-rose-600">{statusError}</p>
          ) : null}
          {statusFeedback ? (
            <p className="text-xs text-emerald-600">{statusFeedback}</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={statusSaving} className="inline-flex items-center gap-2">
              {statusSaving ? (
                <>
                  <Spinner size="1rem" /> Saving
                </>
              ) : (
                'Update status'
              )}
            </Button>
          </div>
        </form>

        <form onSubmit={handleScheduleSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary">Schedule & logistics</h3>
          <div className="grid gap-3 md:grid-cols-2">
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
          </div>
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
          {scheduleError ? (
            <p className="text-xs text-rose-600">{scheduleError}</p>
          ) : null}
          {scheduleFeedback ? (
            <p className="text-xs text-emerald-600">{scheduleFeedback}</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={scheduleSaving} className="inline-flex items-center gap-2">
              {scheduleSaving ? (
                <>
                  <Spinner size="1rem" /> Saving
                </>
              ) : (
                'Update schedule'
              )}
            </Button>
          </div>
        </form>
      </section>

      <form onSubmit={handleDetailsSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-primary">Booking configuration</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium text-primary">
            Summary
            <textarea
              rows="4"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              value={detailsForm.summary}
              onChange={(event) => setDetailsForm((current) => ({ ...current, summary: event.target.value }))}
            />
          </label>
          <label className="text-xs font-medium text-primary">
            Instructions to crew
            <textarea
              rows="4"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              value={detailsForm.instructions}
              onChange={(event) => setDetailsForm((current) => ({ ...current, instructions: event.target.value }))}
            />
          </label>
        </div>
        <TagsInput value={detailsForm.tags} onChange={(value) => setDetailsForm((current) => ({ ...current, tags: value }))} />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-primary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={detailsForm.autoAssignEnabled}
              onChange={(event) => setDetailsForm((current) => ({ ...current, autoAssignEnabled: event.target.checked }))}
            />
            Auto-assign future work to crew
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-primary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={detailsForm.allowCustomerEdits}
              onChange={(event) => setDetailsForm((current) => ({ ...current, allowCustomerEdits: event.target.checked }))}
            />
            Allow customer edits after confirmation
          </label>
        </div>
        <ChecklistEditor items={checklist} onChange={setChecklist} />
        <AttachmentEditor attachments={attachments} onChange={setAttachments} />
        <AttachmentEditor
          attachments={images}
          onChange={setImages}
          label="Site imagery"
          allowTypeSelection={false}
          placeholder="https://cdn.fixnado.com/bookings/IMG_1234.jpg"
        />
        {detailsError ? (
          <p className="text-xs text-rose-600">{detailsError}</p>
        ) : null}
        {detailsFeedback ? (
          <p className="text-xs text-emerald-600">{detailsFeedback}</p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={detailsSaving} className="inline-flex items-center gap-2">
            {detailsSaving ? (
              <>
                <Spinner size="1rem" /> Saving
              </>
            ) : (
              'Save booking details'
            )}
          </Button>
        </div>
      </form>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary">Escalation notes</h3>
          <form onSubmit={handleNoteSubmit} className="space-y-3">
            <label className="text-xs font-medium text-primary">
              Note details
              <textarea
                rows="3"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={noteForm.body}
                onChange={(event) => setNoteForm((current) => ({ ...current, body: event.target.value }))}
                placeholder="Contacted customer to confirm revised ETA."
              />
            </label>
            <AttachmentEditor attachments={noteForm.attachments} onChange={(attachmentsValue) => setNoteForm((current) => ({ ...current, attachments: attachmentsValue }))} />
            {noteError ? <p className="text-xs text-rose-600">{noteError}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" disabled={noteSaving} className="inline-flex items-center gap-2">
                {noteSaving ? (
                  <>
                    <Spinner size="1rem" /> Saving
                  </>
                ) : (
                  'Log note'
                )}
              </Button>
            </div>
          </form>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-primary/60">Recent notes</h4>
            {booking.notes?.length ? (
              <ul className="space-y-3">
                {booking.notes.map((note) => (
                  <li key={note.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-sm text-slate-700">{note.body}</p>
                    <p className="mt-2 text-xs text-slate-500">Recorded {formatDate(note.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
                No notes captured yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-primary">Timeline</h3>
          <form onSubmit={handleTimelineSubmit} className="space-y-3">
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
                  {TIMELINE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
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
                  {TIMELINE_STATUSES.map((statusOption) => (
                    <option key={statusOption.value} value={statusOption.value}>
                      {statusOption.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-xs font-medium text-primary">
              Summary
              <textarea
                rows="3"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={timelineForm.summary}
                onChange={(event) => setTimelineForm((current) => ({ ...current, summary: event.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-primary">
              Occurred at
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={timelineForm.occurredAt}
                onChange={(event) => setTimelineForm((current) => ({ ...current, occurredAt: event.target.value }))}
              />
            </label>
            <AttachmentEditor attachments={timelineAttachments} onChange={setTimelineAttachments} allowTypeSelection />
            {timelineError ? <p className="text-xs text-rose-600">{timelineError}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" disabled={timelineSaving} className="inline-flex items-center gap-2">
                {timelineSaving ? (
                  <>
                    <Spinner size="1rem" /> Saving
                  </>
                ) : (
                  'Log timeline entry'
                )}
              </Button>
            </div>
          </form>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-primary/60">Recent timeline</h4>
            {booking.timeline?.length ? (
              <ul className="space-y-3">
                {booking.timeline.map((entry) => (
                  <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-primary">{entry.title}</p>
                      <StatusPill tone="info">{entry.entryType}</StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(entry.occurredAt)}</p>
                    {entry.summary ? <p className="mt-2 text-sm text-slate-600">{entry.summary}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
                No timeline entries yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-primary">Crew assignments</h3>
        <AssignmentsList assignments={booking.assignments} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-primary">Customer & site context</h3>
        <dl className="grid gap-4 md:grid-cols-2">
          <QuickInfo label="Customer" value={booking.customer?.name ?? '—'} />
          <QuickInfo label="Customer reference" value={booking.customer?.reference ?? '—'} />
          <QuickInfo label="Site contact email" value={booking.customer?.contact?.email ?? '—'} />
          <QuickInfo label="Site contact phone" value={booking.customer?.contact?.phone ?? '—'} />
          <QuickInfo label="Location" value={booking.location ?? '—'} />
          <QuickInfo label="Zone" value={booking.zone?.name ?? '—'} />
          <QuickInfo label="Scheduled start" value={formatDate(booking.scheduledStart)} />
          <QuickInfo label="Scheduled end" value={formatDate(booking.scheduledEnd)} />
        </dl>
      </section>
    </div>
  );
}

BookingDetailPanel.propTypes = {
  booking: PropTypes.shape({
    bookingId: PropTypes.string,
    title: PropTypes.string,
    status: PropTypes.string,
    statusLabel: PropTypes.string,
    statusOptions: PropTypes.arrayOf(
      PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
    ),
    scheduledStart: PropTypes.string,
    scheduledEnd: PropTypes.string,
    slaExpiresAt: PropTypes.string,
    slaStatus: PropTypes.string,
    assignments: PropTypes.array,
    customer: PropTypes.shape({
      name: PropTypes.string,
      reference: PropTypes.string,
      contact: PropTypes.shape({
        email: PropTypes.string,
        phone: PropTypes.string
      })
    }),
    zone: PropTypes.shape({ name: PropTypes.string }),
    summary: PropTypes.string,
    instructions: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    checklist: PropTypes.array,
    attachments: PropTypes.array,
    images: PropTypes.array,
    notes: PropTypes.array,
    timeline: PropTypes.array,
    travelMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    autoAssignEnabled: PropTypes.bool,
    allowCustomerEdits: PropTypes.bool,
    financial: PropTypes.shape({
      totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      commissionAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string
    })
  }),
  timezone: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onUpdateSchedule: PropTypes.func.isRequired,
  onUpdateDetails: PropTypes.func.isRequired,
  onCreateNote: PropTypes.func.isRequired,
  onCreateTimelineEntry: PropTypes.func.isRequired
};

BookingDetailPanel.defaultProps = {
  booking: null,
  timezone: 'UTC'
};
