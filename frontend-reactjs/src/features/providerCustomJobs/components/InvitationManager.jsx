import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' }
];

function buildRosterOptions(roster) {
  if (!Array.isArray(roster)) {
    return [];
  }
  return roster.map((contact) => ({
    value: contact.id,
    label: contact.name || contact.email || contact.id
  }));
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export default function InvitationManager({ invitations, roster, loading, updatingInvitationId, onUpdate }) {
  const rosterOptions = useMemo(() => buildRosterOptions(roster), [roster]);
  const [formState, setFormState] = useState({});
  const [errorMap, setErrorMap] = useState({});

  useEffect(() => {
    const nextState = {};
    invitations.forEach((invitation) => {
      nextState[invitation.id] = {
        status: invitation.status,
        note: invitation.metadata?.note || '',
        contactId: invitation.metadata?.contactId || ''
      };
    });
    setFormState(nextState);
    setErrorMap({});
  }, [invitations]);

  const handleChange = (invitationId, patch) => {
    setFormState((current) => ({ ...current, [invitationId]: { ...current[invitationId], ...patch } }));
  };

  const handleSubmit = async (invitation) => {
    const state = formState[invitation.id] || {};
    try {
      await onUpdate(invitation.id, {
        status: state.status,
        note: state.note || undefined,
        contactId: state.contactId || undefined
      });
      setErrorMap((current) => ({ ...current, [invitation.id]: null }));
    } catch (error) {
      setErrorMap((current) => ({ ...current, [invitation.id]: error?.message || 'Unable to update invitation' }));
    }
  };

  if (loading && invitations.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading invitations…</p>
      </section>
    );
  }

  if (!invitations.length) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6">
        <h3 className="text-lg font-semibold text-slate-700">No invitations sent yet</h3>
        <p className="mt-2 text-sm text-slate-500">
          Invitations created from the composer or managed jobs appear here so you can update status or add internal notes.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Invitation tracker</h3>
          <p className="text-sm text-slate-500">Adjust statuses and notes as invitees respond.</p>
        </div>
      </header>
      <div className="space-y-4">
        {invitations.map((invitation) => {
          const state = formState[invitation.id] || {};
          const tone =
            invitation.status === 'accepted'
              ? 'success'
              : invitation.status === 'declined'
              ? 'warning'
              : invitation.status === 'cancelled'
              ? 'neutral'
              : 'info';
          return (
            <article key={invitation.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">
                    {invitation.targetHandle || invitation.targetEmail || 'Invitation pending'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {invitation.targetType} · Sent {formatDate(invitation.createdAt)} · Job: {invitation.job?.title || '—'}
                  </p>
                </div>
                <StatusPill tone={tone}>{invitation.status}</StatusPill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-5">
                <Select
                  label="Status"
                  value={state.status || invitation.status}
                  onChange={(event) => handleChange(invitation.id, { status: event.target.value })}
                  options={STATUS_OPTIONS}
                />
                <Select
                  label="Assign contact"
                  value={state.contactId || ''}
                  onChange={(event) => handleChange(invitation.id, { contactId: event.target.value })}
                  options={[{ value: '', label: '— None —' }, ...rosterOptions]}
                />
                <div className="md:col-span-3">
                  <TextArea
                    label="Internal note"
                    minRows={2}
                    value={state.note || ''}
                    onChange={(event) => handleChange(invitation.id, { note: event.target.value })}
                  />
                </div>
              </div>
              {errorMap[invitation.id] ? (
                <p className="mt-2 text-sm text-rose-600">{errorMap[invitation.id]}</p>
              ) : null}
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSubmit(invitation)}
                  disabled={updatingInvitationId === invitation.id}
                >
                  {updatingInvitationId === invitation.id ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

InvitationManager.propTypes = {
  invitations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      targetHandle: PropTypes.string,
      targetEmail: PropTypes.string,
      targetType: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string,
      job: PropTypes.shape({ id: PropTypes.string, title: PropTypes.string }),
      metadata: PropTypes.object
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
  updatingInvitationId: PropTypes.string,
  onUpdate: PropTypes.func
};

InvitationManager.defaultProps = {
  invitations: [],
  roster: [],
  loading: false,
  updatingInvitationId: null,
  onUpdate: () => {}
};
