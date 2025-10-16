import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Select from '../../../components/ui/Select.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

const INVITE_TYPES = [
  { value: 'user', label: 'User' },
  { value: 'provider', label: 'Provider' },
  { value: 'serviceman', label: 'Serviceman' }
];

const CURRENCY_OPTIONS = [
  { value: 'GBP', label: 'GBP' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' }
];

function buildInviteRow() {
  return {
    type: 'user',
    targetHandle: '',
    targetEmail: '',
    contactId: '',
    note: ''
  };
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

export default function CustomJobComposer({ zones, roster, submitting, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    zoneId: '',
    budgetAmount: '',
    currency: 'GBP',
    bidDeadline: '',
    allowOutOfZone: false,
    allowOpenBidding: true,
    inviteMessage: ''
  });
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState(null);
  const rosterOptions = useMemo(() => buildRosterOptions(roster), [roster]);

  const handleChange = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleInviteChange = useCallback((index, patch) => {
    setInvites((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const handleSelectRoster = useCallback(
    (index, contactId) => {
      const option = rosterOptions.find((entry) => entry.value === contactId);
      if (!option) {
        handleInviteChange(index, { contactId: '', targetHandle: '', targetEmail: '', type: invites[index]?.type || 'user' });
        return;
      }
      const contact = option.meta || {};
      const inferredType = /crew|serviceman/i.test(contact.role ?? '') ? 'serviceman' : 'provider';
      handleInviteChange(index, {
        contactId: contact.id,
        targetHandle: contact.name || contact.id || '',
        targetEmail: contact.email || '',
        type: invites[index]?.type || inferredType
      });
    },
    [handleInviteChange, invites, rosterOptions]
  );

  const addInviteRow = useCallback(() => {
    setInvites((current) => [...current, buildInviteRow()]);
  }, []);

  const removeInviteRow = useCallback((index) => {
    setInvites((current) => current.filter((_, idx) => idx !== index));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      title: '',
      description: '',
      zoneId: '',
      budgetAmount: '',
      currency: 'GBP',
      bidDeadline: '',
      allowOutOfZone: false,
      allowOpenBidding: true,
      inviteMessage: ''
    });
    setInvites([]);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (submitting) {
        return;
      }
      setError(null);
      const payload = {
        ...form,
        zoneId: form.zoneId || undefined,
        budgetAmount: form.budgetAmount ? Number.parseFloat(form.budgetAmount) : undefined,
        invites: invites
          .map((invite) => ({
            type: invite.type,
            targetHandle: invite.targetHandle || undefined,
            targetEmail: invite.targetEmail || undefined,
            contactId: invite.contactId || undefined,
            note: invite.note || undefined
          }))
          .filter((invite) => invite.targetHandle || invite.targetEmail || invite.contactId)
      };
      if (!payload.allowOpenBidding) {
        payload.allowOpenBidding = false;
      }
      try {
        await onSubmit(payload);
        resetForm();
      } catch (err) {
        setError(err?.message || 'Unable to create custom job');
      }
    },
    [form, invites, onSubmit, resetForm, submitting]
  );

  const zoneOptions = useMemo(
    () => [{ value: '', label: 'Select a delivery zone' }, ...(zones ?? [])],
    [zones]
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Create a bespoke job</h3>
          <p className="text-sm text-slate-500">
            Generate a custom brief for a specific user, provider, or serviceman. Invitations can be sent immediately after
            publishing.
          </p>
        </div>
        <StatusPill tone="info">Draft &amp; invite</StatusPill>
      </header>
      <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Job title"
            placeholder="e.g. Emergency boiler repair for Riverside campus"
            required
            value={form.title}
            onChange={(event) => handleChange('title', event.target.value)}
          />
          <Select
            label="Service zone"
            value={form.zoneId}
            onChange={(event) => handleChange('zoneId', event.target.value)}
            options={zoneOptions}
          />
          <TextInput
            label="Budget amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="5000"
            value={form.budgetAmount}
            onChange={(event) => handleChange('budgetAmount', event.target.value)}
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(event) => handleChange('currency', event.target.value)}
            options={CURRENCY_OPTIONS}
          />
          <TextInput
            label="Bid deadline"
            type="date"
            value={form.bidDeadline}
            onChange={(event) => handleChange('bidDeadline', event.target.value)}
          />
          <TextInput
            label="Invitation message"
            placeholder="Optional note included in invitations"
            value={form.inviteMessage}
            onChange={(event) => handleChange('inviteMessage', event.target.value)}
          />
        </div>
        <TextArea
          label="Brief details"
          minRows={4}
          placeholder="Outline scope, access instructions, and materials required."
          value={form.description}
          onChange={(event) => handleChange('description', event.target.value)}
        />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Checkbox
            label="Allow providers outside your zone to bid"
            checked={form.allowOpenBidding}
            onChange={(event) => handleChange('allowOpenBidding', event.target.checked)}
          />
          <Checkbox
            label="Allow out-of-zone delivery"
            checked={form.allowOutOfZone}
            onChange={(event) => handleChange('allowOutOfZone', event.target.checked)}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Invitations</h4>
            <Button type="button" size="sm" variant="secondary" onClick={addInviteRow}>
              Add invitation
            </Button>
          </div>
          {invites.length === 0 ? (
            <p className="text-sm text-slate-500">
              Optional: pre-select users, providers, or servicemen to receive private invitations for this job.
            </p>
          ) : null}
          <div className="space-y-4">
            {invites.map((invite, index) => (
              <div key={`invite-${index}`} className="rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-5">
                  <Select
                    label="Invite type"
                    value={invite.type}
                    onChange={(event) => handleInviteChange(index, { type: event.target.value })}
                    options={INVITE_TYPES}
                  />
                  <Select
                    label="From roster"
                    value={invite.contactId || ''}
                    onChange={(event) => handleSelectRoster(index, event.target.value)}
                    options={[{ value: '', label: '— Select contact —' }, ...rosterOptions]}
                  />
                  <TextInput
                    label="Account handle"
                    placeholder="e.g. janedoe92"
                    value={invite.targetHandle}
                    onChange={(event) => handleInviteChange(index, { targetHandle: event.target.value })}
                  />
                  <TextInput
                    label="Email"
                    type="email"
                    placeholder="Optional"
                    value={invite.targetEmail}
                    onChange={(event) => handleInviteChange(index, { targetEmail: event.target.value })}
                  />
                  <TextInput
                    label="Internal note"
                    placeholder="Visible to your team"
                    value={invite.note}
                    onChange={(event) => handleInviteChange(index, { note: event.target.value })}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeInviteRow(index)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={resetForm} disabled={submitting}>
            Reset
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish custom job'}
          </Button>
        </div>
      </form>
    </section>
  );
}

CustomJobComposer.propTypes = {
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired
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
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func
};

CustomJobComposer.defaultProps = {
  zones: [],
  roster: [],
  submitting: false,
  onSubmit: () => {}
};
