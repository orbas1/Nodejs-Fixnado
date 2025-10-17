import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  updateServicemanIdentity,
  createIdentityDocument,
  updateIdentityDocument,
  deleteIdentityDocument,
  createIdentityCheck,
  updateIdentityCheck,
  deleteIdentityCheck,
  addIdentityWatcher,
  updateIdentityWatcher,
  removeIdentityWatcher,
  createIdentityEvent
} from '../../../api/servicemanIdentityClient.js';

const FIELD_CLASS =
  'w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent';

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return '—';
  }
}

function StatusBadge({ label }) {
  const palette = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    in_review: 'bg-blue-100 text-blue-700 border-blue-200',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    suspended: 'bg-orange-100 text-orange-700 border-orange-200',
    expired: 'bg-slate-200 text-slate-700 border-slate-300'
  };
  const normalised = typeof label === 'string' ? label.toLowerCase() : 'pending';
  const styles = palette[normalised] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const display = label ? label.replace(/_/g, ' ') : 'unknown';
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles}`}>{display}</span>;
}

StatusBadge.propTypes = {
  label: PropTypes.string
};

function VerificationSummaryCard({ verification, referenceData, onSave, saving }) {
  const [formState, setFormState] = useState(() => ({
    status: verification.status ?? '',
    riskRating: verification.riskRating ?? '',
    verificationLevel: verification.verificationLevel ?? '',
    reviewerEmail: '',
    reviewerId: '',
    expiresAt: verification.expiresAt ? verification.expiresAt.slice(0, 10) : '',
    notes: verification.notes ?? ''
  }));
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const payload = {
        status: formState.status || undefined,
        riskRating: formState.riskRating || undefined,
        verificationLevel: formState.verificationLevel || undefined,
        reviewerEmail: formState.reviewerEmail || undefined,
        reviewerId: formState.reviewerId || undefined,
        expiresAt: formState.expiresAt || null,
        notes: formState.notes ?? ''
      };
      await onSave(payload);
      setMessage('Verification preferences updated.');
      if (formState.reviewerEmail) {
        setFormState((prev) => ({ ...prev, reviewerEmail: '' }));
      }
      if (formState.reviewerId) {
        setFormState((prev) => ({ ...prev, reviewerId: '' }));
      }
    } catch (submitError) {
      setError(submitError?.message ?? 'Failed to update verification settings.');
    }
  };

  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/50">Identity overview</p>
          <h3 className="mt-2 text-2xl font-semibold text-primary">Verification controls</h3>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Manage the status of crew identity verification, risk tiering, and reviewer ownership. Updates are captured in the
            audit trail automatically.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-primary">
            <StatusBadge label={verification.status} />
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
              {verification.verificationLevel ?? 'standard'}
            </span>
            <span className="text-xs text-slate-500">Risk rating: {verification.riskRating ?? 'medium'}</span>
            <span className="text-xs text-slate-500">Expires: {formatDate(verification.expiresAt)}</span>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Requested</dt>
            <dd className="font-semibold text-primary">{formatDate(verification.requestedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Submitted</dt>
            <dd className="font-semibold text-primary">{formatDate(verification.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Approved</dt>
            <dd className="font-semibold text-primary">{formatDate(verification.approvedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Reviewer</dt>
            <dd className="font-semibold text-primary">{verification.reviewer?.name ?? 'Unassigned'}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-primary">Verification status</span>
          <select name="status" value={formState.status} onChange={handleChange} className={FIELD_CLASS}>
            {(referenceData.statuses ?? []).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-primary">Risk rating</span>
          <select name="riskRating" value={formState.riskRating} onChange={handleChange} className={FIELD_CLASS}>
            {(referenceData.riskRatings ?? []).map((rating) => (
              <option key={rating} value={rating}>
                {rating.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-primary">Verification level</span>
          <select name="verificationLevel" value={formState.verificationLevel} onChange={handleChange} className={FIELD_CLASS}>
            {(referenceData.verificationLevels ?? []).map((level) => (
              <option key={level} value={level}>
                {level.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-primary">Expiry date</span>
          <input
            type="date"
            name="expiresAt"
            value={formState.expiresAt}
            onChange={handleChange}
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-primary">Assign reviewer by email</span>
          <input
            type="email"
            name="reviewerEmail"
            placeholder="reviewer@company.com"
            value={formState.reviewerEmail}
            onChange={handleChange}
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-primary">Assign reviewer by user ID</span>
          <input
            type="text"
            name="reviewerId"
            placeholder="Optional UUID"
            value={formState.reviewerId}
            onChange={handleChange}
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm lg:col-span-2">
          <span className="font-semibold text-primary">Reviewer notes</span>
          <textarea
            name="notes"
            rows={4}
            value={formState.notes}
            onChange={handleChange}
            className={`${FIELD_CLASS} resize-none`}
            placeholder="Add instructions or additional context for reviewers"
          />
        </label>
        <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {message ? <span className="text-sm text-emerald-600">{message}</span> : null}
          {error ? <span className="text-sm text-rose-600">{error}</span> : null}
        </div>
      </form>
    </div>
  );
}

VerificationSummaryCard.propTypes = {
  verification: PropTypes.object.isRequired,
  referenceData: PropTypes.shape({
    statuses: PropTypes.arrayOf(PropTypes.string),
    riskRatings: PropTypes.arrayOf(PropTypes.string),
    verificationLevels: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

VerificationSummaryCard.defaultProps = {
  saving: false
};

function DocumentEditor({ document, referenceData, onSave, onDelete }) {
  const [formState, setFormState] = useState(() => ({
    documentType: document?.documentType ?? referenceData.documentTypes?.[0] ?? 'passport',
    status: document?.status ?? referenceData.documentStatuses?.[0] ?? 'pending',
    documentNumber: document?.documentNumber ?? '',
    issuingCountry: document?.issuingCountry ?? '',
    issuedAt: document?.issuedAt ? document.issuedAt.slice(0, 10) : '',
    expiresAt: document?.expiresAt ? document.expiresAt.slice(0, 10) : '',
    fileUrl: document?.fileUrl ?? '',
    notes: document?.notes ?? ''
  }));
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await onSave(formState);
    } catch (submitError) {
      setError(submitError?.message ?? 'Failed to save document.');
    }
  };

  return (
    <div className="rounded-2xl border border-accent/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-primary">
            {document?.documentType ? document.documentType.replace(/_/g, ' ') : 'New identity document'}
          </h4>
          <p className="text-xs text-slate-500">Status: {document ? <StatusBadge label={document.status} /> : 'draft'}</p>
        </div>
        {document ? (
          <button
            type="button"
            onClick={() => onDelete?.()}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            Remove
          </button>
        ) : null}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-primary">Document type</span>
            <select name="documentType" value={formState.documentType} onChange={handleChange} className={FIELD_CLASS}>
              {(referenceData.documentTypes ?? []).map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium text-primary">Status</span>
            <select name="status" value={formState.status} onChange={handleChange} className={FIELD_CLASS}>
              {(referenceData.documentStatuses ?? []).map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-primary">Document number</span>
            <input
              type="text"
              name="documentNumber"
              value={formState.documentNumber}
              onChange={handleChange}
              className={FIELD_CLASS}
              placeholder="Optional"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium text-primary">Issuing country</span>
            <input
              type="text"
              name="issuingCountry"
              value={formState.issuingCountry}
              onChange={handleChange}
              className={FIELD_CLASS}
              placeholder="e.g. United Kingdom"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-primary">Issued on</span>
            <input type="date" name="issuedAt" value={formState.issuedAt} onChange={handleChange} className={FIELD_CLASS} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium text-primary">Expires on</span>
            <input type="date" name="expiresAt" value={formState.expiresAt} onChange={handleChange} className={FIELD_CLASS} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-primary">Document URL</span>
          <input
            type="url"
            name="fileUrl"
            value={formState.fileUrl}
            onChange={handleChange}
            className={FIELD_CLASS}
            placeholder="https://"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-primary">Notes</span>
          <textarea
            name="notes"
            rows={3}
            value={formState.notes}
            onChange={handleChange}
            className={`${FIELD_CLASS} resize-none`}
            placeholder="Add any reviewer guidance"
          />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary/90"
        >
          {document ? 'Save document' : 'Create document'}
        </button>
      </form>
    </div>
  );
}

DocumentEditor.propTypes = {
  document: PropTypes.object,
  referenceData: PropTypes.shape({
    documentTypes: PropTypes.arrayOf(PropTypes.string),
    documentStatuses: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

DocumentEditor.defaultProps = {
  document: null,
  onDelete: null
};

function ChecksPanel({ checks, referenceData, onCreate, onUpdate, onDelete }) {
  const [newTask, setNewTask] = useState({ label: '', owner: '', dueAt: '' });
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      if (!newTask.label.trim()) {
        setError('A label is required.');
        return;
      }
      await onCreate({ ...newTask, status: referenceData.checkStatuses?.[0] ?? 'not_started' });
      setNewTask({ label: '', owner: '', dueAt: '' });
    } catch (submitError) {
      setError(submitError?.message ?? 'Failed to create checklist entry.');
    }
  };

  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-primary">Verification checklist</h3>
      <p className="mt-1 text-sm text-slate-600">
        Track outstanding verification workstreams, manual reviews, and stakeholder approvals. Update status as tasks progress.
      </p>
      <ul className="mt-4 space-y-4">
        {checks.map((check) => (
          <li key={check.id} className="rounded-2xl border border-accent/10 bg-secondary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{check.label}</p>
                <p className="text-xs text-slate-500">Owner: {check.owner || 'Unassigned'}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-full border border-accent/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
                  value={check.status}
                  onChange={(event) => onUpdate(check.id, { status: event.target.value })}
                >
                  {(referenceData.checkStatuses ?? []).map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onDelete(check.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              <span>Due: {formatDate(check.dueAt)}</span>
              {check.completedAt ? <span className="ml-3">Completed: {formatDate(check.completedAt)}</span> : null}
            </div>
          </li>
        ))}
        {checks.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-accent/30 bg-white/50 p-4 text-sm text-slate-500">
            No checklist entries yet. Add the first one below to orchestrate verification work.
          </li>
        ) : null}
      </ul>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <input
          type="text"
          name="label"
          required
          value={newTask.label}
          onChange={(event) => setNewTask((prev) => ({ ...prev, label: event.target.value }))}
          placeholder="Task label"
          className={FIELD_CLASS}
        />
        <input
          type="text"
          name="owner"
          value={newTask.owner}
          onChange={(event) => setNewTask((prev) => ({ ...prev, owner: event.target.value }))}
          placeholder="Owner"
          className={FIELD_CLASS}
        />
        <input
          type="date"
          name="dueAt"
          value={newTask.dueAt}
          onChange={(event) => setNewTask((prev) => ({ ...prev, dueAt: event.target.value }))}
          className={FIELD_CLASS}
        />
        <div className="sm:col-span-3 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary/90"
          >
            Add checklist item
          </button>
          {error ? <span className="text-xs text-rose-600">{error}</span> : null}
        </div>
      </form>
    </div>
  );
}

ChecksPanel.propTypes = {
  checks: PropTypes.arrayOf(PropTypes.object).isRequired,
  referenceData: PropTypes.shape({
    checkStatuses: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

function WatchersPanel({ watchers, referenceData, onAdd, onUpdateRole, onRemove }) {
  const [formState, setFormState] = useState({ email: '', role: referenceData.watcherRoles?.[0] ?? 'operations_lead' });
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      if (!formState.email.trim()) {
        setError('Email is required.');
        return;
      }
      await onAdd({ email: formState.email.trim(), role: formState.role });
      setFormState({ email: '', role: formState.role });
    } catch (submitError) {
      setError(submitError?.message ?? 'Failed to add watcher.');
    }
  };

  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-primary">Watcher access</h3>
      <p className="mt-1 text-sm text-slate-600">
        Control who is subscribed to verification updates. Watchers receive alerts for document changes and status transitions.
      </p>
      <ul className="mt-4 space-y-3">
        {watchers.map((watcher) => (
          <li key={watcher.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/10 bg-secondary/40 p-4">
            <div>
              <p className="text-sm font-semibold text-primary">{watcher.user?.name ?? watcher.user?.email ?? 'Team member'}</p>
              <p className="text-xs text-slate-500">{watcher.user?.email || 'Email not available'}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={watcher.role}
                onChange={(event) => onUpdateRole(watcher.id, { role: event.target.value })}
                className="rounded-full border border-accent/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
              >
                {(referenceData.watcherRoles ?? []).map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onRemove(watcher.id)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {watchers.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-accent/30 bg-white/50 p-4 text-sm text-slate-500">
            No watchers configured yet. Invite stakeholders below.
          </li>
        ) : null}
      </ul>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 text-sm md:grid-cols-[2fr_1fr_auto]">
        <input
          type="email"
          required
          placeholder="team@company.com"
          value={formState.email}
          onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
          className={FIELD_CLASS}
        />
        <select
          value={formState.role}
          onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value }))}
          className={FIELD_CLASS}
        >
          {(referenceData.watcherRoles ?? []).map((role) => (
            <option key={role} value={role}>
              {role.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary/90"
        >
          Add watcher
        </button>
        {error ? <span className="md:col-span-3 text-xs text-rose-600">{error}</span> : null}
      </form>
    </div>
  );
}

WatchersPanel.propTypes = {
  watchers: PropTypes.arrayOf(PropTypes.object).isRequired,
  referenceData: PropTypes.shape({ watcherRoles: PropTypes.arrayOf(PropTypes.string) }).isRequired,
  onAdd: PropTypes.func.isRequired,
  onUpdateRole: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

function EventsTimeline({ events, onAddEvent, referenceData }) {
  const [formState, setFormState] = useState({ summary: '', eventType: referenceData.eventTypes?.[0] ?? 'note' });
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      if (!formState.summary.trim()) {
        setError('Summary is required.');
        return;
      }
      await onAddEvent({ summary: formState.summary.trim(), eventType: formState.eventType });
      setFormState((prev) => ({ ...prev, summary: '' }));
    } catch (submitError) {
      setError(submitError?.message ?? 'Failed to create audit entry.');
    }
  };

  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-primary">Audit timeline</h3>
      <p className="mt-1 text-sm text-slate-600">
        A chronological history of identity updates, reviewer actions, and automation activity. New notes are visible to other
        authorised teams instantly.
      </p>
      <ol className="mt-4 space-y-3 text-sm">
        {events.map((event) => (
          <li key={event.id} className="rounded-2xl border border-accent/10 bg-secondary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-primary">{event.summary}</span>
              <span className="text-xs text-slate-500">{formatDate(event.occurredAt)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {event.eventType?.replace(/_/g, ' ')} • {event.actor?.name || event.actor?.email || 'System'}
            </p>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-accent/30 bg-white/50 p-4 text-sm text-slate-500">
            No audit events recorded yet. Create the first note below.
          </li>
        ) : null}
      </ol>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 text-sm">
        <textarea
          required
          rows={3}
          value={formState.summary}
          onChange={(event) => setFormState((prev) => ({ ...prev, summary: event.target.value }))}
          className={`${FIELD_CLASS} resize-none`}
          placeholder="Log a note or reminder for compliance reviewers"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={formState.eventType}
            onChange={(event) => setFormState((prev) => ({ ...prev, eventType: event.target.value }))}
            className="rounded-full border border-accent/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
          >
            {(referenceData.eventTypes ?? []).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary/90"
          >
            Add timeline entry
          </button>
          {error ? <span className="text-xs text-rose-600">{error}</span> : null}
        </div>
      </form>
    </div>
  );
}

EventsTimeline.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddEvent: PropTypes.func.isRequired,
  referenceData: PropTypes.shape({ eventTypes: PropTypes.arrayOf(PropTypes.string) }).isRequired
};

export default function IdentityVerificationSection({ section }) {
  const initialData = section?.data ?? {};
  const [snapshot, setSnapshot] = useState(initialData);
  const [savingVerification, setSavingVerification] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const servicemanId = snapshot?.verification?.servicemanId ?? section?.data?.verification?.servicemanId ?? null;
  const referenceData = useMemo(
    () => ({
      statuses: snapshot?.referenceData?.statuses ?? [],
      riskRatings: snapshot?.referenceData?.riskRatings ?? [],
      verificationLevels: snapshot?.referenceData?.verificationLevels ?? [],
      documentTypes: snapshot?.referenceData?.documentTypes ?? [],
      documentStatuses: snapshot?.referenceData?.documentStatuses ?? [],
      checkStatuses: snapshot?.referenceData?.checkStatuses ?? [],
      watcherRoles: snapshot?.referenceData?.watcherRoles ?? [],
      eventTypes: snapshot?.referenceData?.eventTypes ?? []
    }),
    [snapshot?.referenceData]
  );

  const handleResult = useCallback((result) => {
    setSnapshot(result ?? {});
  }, []);

  const handleIdentityUpdate = useCallback(
    async (payload) => {
      if (!servicemanId) {
        throw new Error('Serviceman identifier missing.');
      }
      setSavingVerification(true);
      setMutationError(null);
      try {
        const result = await updateServicemanIdentity(servicemanId, payload);
        handleResult(result);
      } catch (error) {
        setMutationError(error?.message ?? 'Failed to update verification details.');
        throw error;
      } finally {
        setSavingVerification(false);
      }
    },
    [handleResult, servicemanId]
  );

  const handleDocumentCreate = useCallback(
    async (payload) => {
      if (!servicemanId) return;
      const result = await createIdentityDocument(servicemanId, payload);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleDocumentUpdate = useCallback(
    async (documentId, payload) => {
      if (!servicemanId) return;
      const result = await updateIdentityDocument(servicemanId, documentId, payload);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleDocumentDelete = useCallback(
    async (documentId) => {
      if (!servicemanId) return;
      const result = await deleteIdentityDocument(servicemanId, documentId);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleCheckCreate = useCallback(
    async (payload) => {
      if (!servicemanId) return;
      const result = await createIdentityCheck(servicemanId, payload);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleCheckUpdate = useCallback(
    async (checkId, payload) => {
      if (!servicemanId) return;
      const result = await updateIdentityCheck(servicemanId, checkId, payload);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleCheckDelete = useCallback(
    async (checkId) => {
      if (!servicemanId) return;
      const result = await deleteIdentityCheck(servicemanId, checkId);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleWatcherAdd = useCallback(
    async (payload) => {
      if (!servicemanId) return;
      const result = await addIdentityWatcher(servicemanId, payload);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleWatcherRoleUpdate = useCallback(
    async (watcherId, payload) => {
      if (!servicemanId) return;
      const result = await updateIdentityWatcher(servicemanId, watcherId, payload);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleWatcherRemove = useCallback(
    async (watcherId) => {
      if (!servicemanId) return;
      const result = await removeIdentityWatcher(servicemanId, watcherId);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  const handleEventCreate = useCallback(
    async (payload) => {
      if (!servicemanId) return;
      const result = await createIdentityEvent(servicemanId, payload);
      handleResult(result);
    },
    [handleResult, servicemanId]
  );

  if (!snapshot?.verification) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white p-6 text-sm text-slate-600">
        Unable to load identity verification details for this serviceman.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {mutationError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{mutationError}</div> : null}
      <VerificationSummaryCard
        verification={snapshot.verification}
        referenceData={referenceData}
        onSave={handleIdentityUpdate}
        saving={savingVerification}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          {snapshot.documents?.map((document) => (
            <DocumentEditor
              key={document.id}
              document={document}
              referenceData={referenceData}
              onSave={(payload) => handleDocumentUpdate(document.id, payload)}
              onDelete={() => handleDocumentDelete(document.id)}
            />
          ))}
          <DocumentEditor referenceData={referenceData} onSave={handleDocumentCreate} />
        </div>
        <ChecksPanel
          checks={snapshot.checks ?? []}
          referenceData={referenceData}
          onCreate={handleCheckCreate}
          onUpdate={handleCheckUpdate}
          onDelete={handleCheckDelete}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <WatchersPanel
          watchers={snapshot.watchers ?? []}
          referenceData={referenceData}
          onAdd={handleWatcherAdd}
          onUpdateRole={handleWatcherRoleUpdate}
          onRemove={handleWatcherRemove}
        />
        <EventsTimeline events={snapshot.events ?? []} onAddEvent={handleEventCreate} referenceData={referenceData} />
      </div>
    </div>
  );
}

IdentityVerificationSection.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      verification: PropTypes.object,
      referenceData: PropTypes.object
    })
  }).isRequired
};
