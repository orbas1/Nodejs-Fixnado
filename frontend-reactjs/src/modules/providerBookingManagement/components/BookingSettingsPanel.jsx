import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import AttachmentEditor from '../../servicemanControl/components/AttachmentEditor.jsx';

const DISPATCH_STRATEGIES = [
  { value: 'round_robin', label: 'Round robin' },
  { value: 'best_fit', label: 'Best fit (skills + utilisation)' },
  { value: 'manual_review', label: 'Manual review only' }
];

const CONTACT_ROLES = [
  { value: 'operations_manager', label: 'Operations manager' },
  { value: 'service_lead', label: 'Service lead' },
  { value: 'finance', label: 'Finance' },
  { value: 'support', label: 'Support escalation' },
  { value: 'director', label: 'Executive contact' }
];

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function QuickRepliesEditor({ replies, onChange }) {
  const safeReplies = Array.isArray(replies) ? replies : [];

  const handleChange = (index, value) => {
    const next = safeReplies.map((reply, itemIndex) => (itemIndex === index ? value : reply));
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...safeReplies, '']);
  };

  const handleRemove = (index) => {
    onChange(safeReplies.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Quick replies</p>
        <Button type="button" size="sm" variant="ghost" onClick={handleAdd}>
          Add reply
        </Button>
      </div>
      <div className="space-y-2">
        {safeReplies.map((reply, index) => (
          <div key={`quick-reply-${index}`} className="flex gap-2">
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              value={reply}
              onChange={(event) => handleChange(index, event.target.value)}
              placeholder="Crew assigned, ETA 45 mins"
            />
            <Button type="button" size="xs" variant="ghost" onClick={() => handleRemove(index)}>
              Remove
            </Button>
          </div>
        ))}
        {!safeReplies.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
            No quick replies configured. Add reusable responses for dispatch or customer updates.
          </p>
        ) : null}
      </div>
    </div>
  );
}

QuickRepliesEditor.propTypes = {
  replies: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

QuickRepliesEditor.defaultProps = {
  replies: []
};

function IntakeChannelInput({ value, onChange }) {
  return (
    <label className="text-xs font-medium text-primary">
      Intake channels
      <input
        type="text"
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="marketplace, partner_referral, ads"
      />
      <span className="mt-1 block text-xs text-slate-500">
        Comma separated values. Controls SLA timers and routing automation.
      </span>
    </label>
  );
}

IntakeChannelInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

function ContactEditor({ contacts, onChange }) {
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  const updateContact = (index, patch) => {
    const next = safeContacts.map((contact, itemIndex) => (itemIndex === index ? { ...contact, ...patch } : contact));
    onChange(next);
  };

  const addContact = () => {
    onChange([
      ...safeContacts,
      { id: createId('contact'), name: '', email: '', phone: '', role: 'operations_manager' }
    ]);
  };

  const removeContact = (index) => {
    onChange(safeContacts.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Escalation contacts</p>
        <Button type="button" size="sm" variant="ghost" onClick={addContact}>
          Add contact
        </Button>
      </div>
      <div className="space-y-3">
        {safeContacts.map((contact, index) => (
          <div key={contact.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-primary">
                Name
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={contact.name}
                  onChange={(event) => updateContact(index, { name: event.target.value })}
                  placeholder="Operations desk"
                />
              </label>
              <label className="text-xs font-medium text-primary">
                Role
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={contact.role}
                  onChange={(event) => updateContact(index, { role: event.target.value })}
                >
                  {CONTACT_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-primary">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={contact.email}
                  onChange={(event) => updateContact(index, { email: event.target.value })}
                  placeholder="ops@example.com"
                />
              </label>
              <label className="text-xs font-medium text-primary">
                Phone
                <input
                  type="tel"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={contact.phone}
                  onChange={(event) => updateContact(index, { phone: event.target.value })}
                  placeholder="+44 20 1234 5678"
                />
              </label>
            </div>
            <Button type="button" size="xs" variant="ghost" onClick={() => removeContact(index)}>
              Remove contact
            </Button>
          </div>
        ))}
        {!safeContacts.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
            No escalation contacts configured. Add named contacts to receive SLA and dispute alerts.
          </p>
        ) : null}
      </div>
    </div>
  );
}

ContactEditor.propTypes = {
  contacts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      role: PropTypes.string
    })
  ),
  onChange: PropTypes.func.isRequired
};

ContactEditor.defaultProps = {
  contacts: []
};

function PlaybookEditor({ playbooks, onChange }) {
  const safePlaybooks = Array.isArray(playbooks) ? playbooks : [];

  const updatePlaybook = (index, patch) => {
    const next = safePlaybooks.map((playbook, itemIndex) => (itemIndex === index ? { ...playbook, ...patch } : playbook));
    onChange(next);
  };

  const addPlaybook = () => {
    onChange([
      ...safePlaybooks,
      { id: createId('playbook'), name: '', summary: '', version: 1 }
    ]);
  };

  const removePlaybook = (index) => {
    onChange(safePlaybooks.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Dispatch playbooks</p>
        <Button type="button" size="sm" variant="ghost" onClick={addPlaybook}>
          Add playbook
        </Button>
      </div>
      <div className="space-y-3">
        {safePlaybooks.map((playbook, index) => (
          <div key={playbook.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 space-y-3">
            <label className="text-xs font-medium text-primary">
              Name
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={playbook.name}
                onChange={(event) => updatePlaybook(index, { name: event.target.value })}
                placeholder="Emergency HVAC response"
              />
            </label>
            <label className="text-xs font-medium text-primary">
              Summary
              <textarea
                rows="3"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={playbook.summary}
                onChange={(event) => updatePlaybook(index, { summary: event.target.value })}
                placeholder="Page on-call crew, notify finance, initiate client comms."
              />
            </label>
            <label className="text-xs font-medium text-primary">
              Version
              <input
                type="number"
                min="1"
                max="50"
                className="mt-1 w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                value={playbook.version}
                onChange={(event) => updatePlaybook(index, { version: Number.parseInt(event.target.value, 10) || 1 })}
              />
            </label>
            <Button type="button" size="xs" variant="ghost" onClick={() => removePlaybook(index)}>
              Remove playbook
            </Button>
          </div>
        ))}
        {!safePlaybooks.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
            No dispatch playbooks configured. Add documented runbooks for consistent crew coordination.
          </p>
        ) : null}
      </div>
    </div>
  );
}

PlaybookEditor.propTypes = {
  playbooks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      summary: PropTypes.string,
      version: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ),
  onChange: PropTypes.func.isRequired
};

PlaybookEditor.defaultProps = {
  playbooks: []
};

export default function BookingSettingsPanel({ settings, onSave, saving }) {
  const [form, setForm] = useState({
    dispatchStrategy: 'round_robin',
    autoAssignEnabled: false,
    defaultSlaHours: 4,
    allowCustomerEdits: true,
    intakeChannels: '',
    notesTemplate: ''
  });
  const [quickReplies, setQuickReplies] = useState([]);
  const [assetLibrary, setAssetLibrary] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setForm({
      dispatchStrategy: settings.dispatchStrategy ?? 'round_robin',
      autoAssignEnabled: settings.autoAssignEnabled === true,
      defaultSlaHours: settings.defaultSlaHours ?? 4,
      allowCustomerEdits: settings.allowCustomerEdits !== false,
      intakeChannels: Array.isArray(settings.intakeChannels) ? settings.intakeChannels.join(', ') : '',
      notesTemplate: settings.notesTemplate ?? ''
    });
    setQuickReplies(settings.metadata?.quickReplies ?? []);
    setAssetLibrary(settings.metadata?.assetLibrary ?? []);
    setContacts(settings.escalationContacts ?? []);
    setPlaybooks(settings.dispatchPlaybooks ?? []);
  }, [settings]);

  const stats = useMemo(
    () => ({
      quickReplies: quickReplies.filter((reply) => reply.trim().length > 0).length,
      playbooks: playbooks.filter((playbook) => playbook.name?.trim()).length,
      contacts: contacts.filter((contact) => contact.name?.trim()).length,
      assets: assetLibrary.filter((asset) => asset.url).length
    }),
    [quickReplies, playbooks, contacts, assetLibrary]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setError(null);
    try {
      await onSave({
        dispatchStrategy: form.dispatchStrategy,
        autoAssignEnabled: form.autoAssignEnabled,
        defaultSlaHours: Number.parseInt(form.defaultSlaHours, 10) || 4,
        allowCustomerEdits: form.allowCustomerEdits,
        intakeChannels: form.intakeChannels
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
        notesTemplate: form.notesTemplate,
        escalationContacts: contacts,
        dispatchPlaybooks: playbooks,
        metadata: {
          quickReplies: quickReplies.filter((reply) => reply.trim().length > 0),
          assetLibrary: assetLibrary.filter((asset) => asset.url)
        }
      });
      setFeedback('Settings saved successfully');
      setLastSavedAt(new Date());
    } catch (caught) {
      setError(caught?.message ?? 'Failed to save settings');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Booking automation & dispatch</h3>
        <p className="text-sm text-slate-600">
          Configure dispatch guardrails, escalation pathways, and templated communications for provider bookings.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
            {stats.quickReplies} quick replies
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
            {stats.playbooks} playbooks
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
            {stats.contacts} contacts
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1">
            {stats.assets} assets linked
          </span>
          {lastSavedAt ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white/80 p-4">
        <label className="text-xs font-medium text-primary">
          Dispatch strategy
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
            value={form.dispatchStrategy}
            onChange={(event) => setForm((current) => ({ ...current, dispatchStrategy: event.target.value }))}
          >
            {DISPATCH_STRATEGIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-3 text-sm font-semibold text-primary">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            checked={form.autoAssignEnabled}
            onChange={(event) => setForm((current) => ({ ...current, autoAssignEnabled: event.target.checked }))}
          />
          Auto-assign new bookings to crew
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium text-primary">
            Default SLA window (hours)
            <input
              type="number"
              min="1"
              max="72"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
              value={form.defaultSlaHours}
              onChange={(event) => setForm((current) => ({ ...current, defaultSlaHours: event.target.value }))}
            />
          </label>
          <label className="inline-flex items-center gap-3 text-xs font-medium text-primary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={form.allowCustomerEdits}
              onChange={(event) => setForm((current) => ({ ...current, allowCustomerEdits: event.target.checked }))}
            />
            Allow customers to update bookings post-confirmation
          </label>
        </div>
        <IntakeChannelInput value={form.intakeChannels} onChange={(value) => setForm((current) => ({ ...current, intakeChannels: value }))} />
        <label className="text-xs font-medium text-primary">
          Notes template
          <textarea
            rows="4"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
            value={form.notesTemplate}
            onChange={(event) => setForm((current) => ({ ...current, notesTemplate: event.target.value }))}
            placeholder="Confirm crew brief, attach risk assessment, update customer communications."
          />
        </label>
      </section>

      <QuickRepliesEditor replies={quickReplies} onChange={setQuickReplies} />

      <ContactEditor contacts={contacts} onChange={setContacts} />

      <PlaybookEditor playbooks={playbooks} onChange={setPlaybooks} />

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white/80 p-4">
        <p className="text-sm font-medium text-primary">Asset library</p>
        <AttachmentEditor attachments={assetLibrary} onChange={setAssetLibrary} allowTypeSelection />
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-600">{error}</div>
      ) : null}
      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{feedback}</div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={saving} className="inline-flex items-center gap-2">
          {saving ? (
            <>
              <Spinner size="1rem" /> Saving
            </>
          ) : (
            'Save settings'
          )}
        </Button>
      </div>
    </form>
  );
}

BookingSettingsPanel.propTypes = {
  settings: PropTypes.shape({
    dispatchStrategy: PropTypes.string,
    autoAssignEnabled: PropTypes.bool,
    defaultSlaHours: PropTypes.number,
    allowCustomerEdits: PropTypes.bool,
    intakeChannels: PropTypes.arrayOf(PropTypes.string),
    notesTemplate: PropTypes.string,
    dispatchPlaybooks: PropTypes.array,
    escalationContacts: PropTypes.array,
    metadata: PropTypes.shape({
      quickReplies: PropTypes.arrayOf(PropTypes.string),
      assetLibrary: PropTypes.array
    })
  }),
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

BookingSettingsPanel.defaultProps = {
  settings: null,
  saving: false
};
