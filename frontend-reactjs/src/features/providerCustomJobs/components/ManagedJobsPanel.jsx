import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';

const STATUS_TONES = {
  open: { tone: 'info', label: 'Open' },
  assigned: { tone: 'warning', label: 'Assigned' },
  completed: { tone: 'success', label: 'Completed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' }
};

const INVITE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'provider', label: 'Provider' },
  { value: 'serviceman', label: 'Serviceman' }
];

const INITIAL_INVITE_FORM = { type: 'user', targetHandle: '', targetEmail: '', contactId: '', note: '' };

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

function buildRosterOptions(roster) {
  if (!Array.isArray(roster)) {
    return [];
  }
  return roster.map((contact) => ({
    value: contact.id,
    label: contact.name || contact.email || contact.id,
    meta: contact
  }));
}

export default function ManagedJobsPanel({ jobs, invitations, roster, loading, invitingJobId, onInvite }) {
  const rosterOptions = useMemo(() => buildRosterOptions(roster), [roster]);
  const [activeJobId, setActiveJobId] = useState(null);
  const [form, setForm] = useState(INITIAL_INVITE_FORM);
  const [error, setError] = useState(null);

  const openInviteForm = useCallback(
    (jobId) => {
      if (activeJobId === jobId) {
        setActiveJobId(null);
        setForm(INITIAL_INVITE_FORM);
      } else {
        setActiveJobId(jobId);
        setForm(INITIAL_INVITE_FORM);
      }
      setError(null);
    },
    [activeJobId]
  );

  const handleRosterSelect = useCallback(
    (contactId) => {
      const option = rosterOptions.find((entry) => entry.value === contactId);
      if (!option) {
        setForm((current) => ({ ...current, contactId: '', targetHandle: '', targetEmail: '' }));
        return;
      }
      const contact = option.meta || {};
      const inferredType = /crew|serviceman/i.test(contact.role ?? '') ? 'serviceman' : 'provider';
      setForm((current) => ({
        ...current,
        contactId: contact.id,
        targetHandle: contact.name || contact.id || '',
        targetEmail: contact.email || '',
        type: current.type || inferredType
      }));
    },
    [rosterOptions]
  );

  const handleSubmit = useCallback(
    async (event, jobId) => {
      event.preventDefault();
      if (!jobId || jobId === invitingJobId) {
        return;
      }
      const payload = {
        type: form.type,
        targetHandle: form.targetHandle || undefined,
        targetEmail: form.targetEmail || undefined,
        contactId: form.contactId || undefined,
        note: form.note || undefined
      };
      if (!payload.targetHandle && !payload.targetEmail && !payload.contactId) {
        setError('Provide an account handle, email, or select a contact.');
        return;
      }
      try {
        await onInvite(jobId, payload);
        setActiveJobId(null);
        setForm(INITIAL_INVITE_FORM);
        setError(null);
      } catch (err) {
        setError(err?.message || 'Unable to send invitation');
      }
    },
    [form, invitingJobId, onInvite]
  );

  if (loading && jobs.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading managed jobs…</p>
      </section>
    );
  }

  if (!jobs.length) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6">
        <h3 className="text-lg font-semibold text-slate-700">No provider-authored jobs yet</h3>
        <p className="mt-2 text-sm text-slate-500">
          Use the composer above to publish bespoke briefs for partners or servicemen. They’ll appear here for quick access and
          invitation tracking.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Managed custom jobs</h3>
          <p className="text-sm text-slate-500">Jobs created by your team. Send targeted invitations or monitor responses.</p>
        </div>
      </header>
      <div className="space-y-4">
        {jobs.map((job) => {
          const tone = STATUS_TONES[job.status] || { tone: 'info', label: job.status };
          const jobInvites = invitations.filter((invitation) => invitation.postId === job.id);
          return (
            <article key={job.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h4 className="text-lg font-semibold text-slate-800">{job.title}</h4>
                  <p className="text-sm text-slate-500">
                    Created {formatDate(job.createdAt)} · Deadline {formatDate(job.bidDeadline)}
                  </p>
                  {job.description ? <p className="text-sm text-slate-600">{job.description}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill tone={tone.tone}>{tone.label}</StatusPill>
                  <Button type="button" size="sm" variant="secondary" onClick={() => openInviteForm(job.id)}>
                    {activeJobId === job.id ? 'Close invite form' : 'Invite participant'}
                  </Button>
                </div>
              </div>
              {jobInvites.length ? (
                <div className="mt-4 space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Invitations</h5>
                  <ul className="space-y-2">
                    {jobInvites.map((invite) => (
                      <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {invite.targetHandle || invite.targetEmail || 'Pending recipient'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {invite.targetType} · Sent {formatDate(invite.createdAt)}
                          </p>
                        </div>
                        <StatusPill tone={invite.status === 'accepted' ? 'success' : invite.status === 'pending' ? 'info' : 'warning'}>
                          {invite.status}
                        </StatusPill>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeJobId === job.id ? (
                <form className="mt-4 space-y-3" onSubmit={(event) => handleSubmit(event, job.id)}>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select
                      label="Invite type"
                      value={form.type}
                      onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                      options={INVITE_OPTIONS}
                    />
                    <Select
                      label="From roster"
                      value={form.contactId}
                      onChange={(event) => handleRosterSelect(event.target.value)}
                      options={[{ value: '', label: '— Select contact —' }, ...rosterOptions]}
                    />
                    <TextInput
                      label="Account handle"
                      value={form.targetHandle}
                      onChange={(event) => setForm((current) => ({ ...current, targetHandle: event.target.value }))}
                    />
                    <TextInput
                      label="Email"
                      type="email"
                      value={form.targetEmail}
                      onChange={(event) => setForm((current) => ({ ...current, targetEmail: event.target.value }))}
                    />
                  </div>
                  <TextArea
                    label="Internal note"
                    minRows={2}
                    value={form.note}
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  />
                  {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setActiveJobId(null);
                        setForm(INITIAL_INVITE_FORM);
                        setError(null);
                      }}
                      disabled={invitingJobId === job.id}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={invitingJobId === job.id}>
                      {invitingJobId === job.id ? 'Sending…' : 'Send invitation'}
                    </Button>
                  </div>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

ManagedJobsPanel.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string,
      bidDeadline: PropTypes.string
    })
  ),
  invitations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      postId: PropTypes.string,
      targetHandle: PropTypes.string,
      targetEmail: PropTypes.string,
      targetType: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string
    })
  ),
  roster: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
      role: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  invitingJobId: PropTypes.string,
  onInvite: PropTypes.func
};

ManagedJobsPanel.defaultProps = {
  jobs: [],
  invitations: [],
  roster: [],
  loading: false,
  invitingJobId: null,
  onInvite: () => {}
};
