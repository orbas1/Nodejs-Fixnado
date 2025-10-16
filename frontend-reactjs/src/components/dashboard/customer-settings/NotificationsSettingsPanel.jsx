import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Spinner from '../../ui/Spinner.jsx';
import SettingsPanelShell from './SettingsPanelShell.jsx';
import StatusBanner from './StatusBanner.jsx';

function NotificationsSettingsPanel({
  form,
  onToggle,
  onQuietHoursToggle,
  onQuietHoursChange,
  onAddContact,
  onUpdateContact,
  onRemoveContact,
  onSubmit,
  saving,
  status,
  timezoneOptions
}) {
  const { quietHours = {}, escalationContacts = [] } = form;

  return (
    <SettingsPanelShell
      id="notification-settings"
      title="Notification rules"
      description="Decide who hears about dispatch changes, escalations, and weekly health reports."
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { key: 'dispatchEmail', label: 'Dispatch email alerts' },
            { key: 'dispatchSms', label: 'Dispatch SMS alerts' },
            { key: 'supportEmail', label: 'Support email updates' },
            { key: 'supportSms', label: 'Support SMS alerts' }
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-primary"
            >
              {item.label}
              <input
                type="checkbox"
                checked={form[item.key]}
                onChange={(event) => onToggle(item.key, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
            </label>
          ))}
        </div>
        {[{ key: 'weeklySummaryEmail', label: 'Weekly summary email' }, { key: 'conciergeEmail', label: 'Concierge updates' }].map(
          (item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-primary"
            >
              {item.label}
              <input
                type="checkbox"
                checked={form[item.key]}
                onChange={(event) => onToggle(item.key, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
            </label>
          )
        )}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Quiet hours</p>
              <p className="text-xs text-slate-500">
                Silence alerts during rest periods. Dispatch escalations override this window.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-primary">
              <input
                type="checkbox"
                checked={quietHours.enabled}
                onChange={(event) => onQuietHoursToggle(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Enabled
            </label>
          </div>
          {quietHours.enabled && (
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Start
                <input
                  type="time"
                  value={quietHours.start ?? ''}
                  onChange={(event) => onQuietHoursChange('start', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                End
                <input
                  type="time"
                  value={quietHours.end ?? ''}
                  onChange={(event) => onQuietHoursChange('end', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Timezone
                <select
                  value={quietHours.timezone}
                  onChange={(event) => onQuietHoursChange('timezone', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Escalation contacts</p>
              <p className="text-xs text-slate-500">
                These contacts receive critical incident alerts and dispute escalations.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddContact}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add contact
            </button>
          </div>
          {escalationContacts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No escalation contacts yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {escalationContacts.map((contact) => (
                <li
                  key={contact.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:gap-4"
                >
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(event) => onUpdateContact(contact.id, 'name', event.target.value)}
                    placeholder="Name"
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(event) => onUpdateContact(contact.id, 'email', event.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveContact(contact.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <StatusBanner status={status} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving && <Spinner className="h-4 w-4 text-white" />}
            {saving ? 'Saving…' : 'Save notifications'}
          </button>
        </div>
      </form>
    </SettingsPanelShell>
  );
}

NotificationsSettingsPanel.propTypes = {
  form: PropTypes.shape({
    dispatchEmail: PropTypes.bool,
    dispatchSms: PropTypes.bool,
    supportEmail: PropTypes.bool,
    supportSms: PropTypes.bool,
    weeklySummaryEmail: PropTypes.bool,
    conciergeEmail: PropTypes.bool,
    quietHours: PropTypes.shape({
      enabled: PropTypes.bool,
      start: PropTypes.string,
      end: PropTypes.string,
      timezone: PropTypes.string
    }),
    escalationContacts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        email: PropTypes.string
      })
    )
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onQuietHoursToggle: PropTypes.func.isRequired,
  onQuietHoursChange: PropTypes.func.isRequired,
  onAddContact: PropTypes.func.isRequired,
  onUpdateContact: PropTypes.func.isRequired,
  onRemoveContact: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  }),
  timezoneOptions: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default NotificationsSettingsPanel;
