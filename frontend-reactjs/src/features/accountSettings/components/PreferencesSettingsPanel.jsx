import PropTypes from 'prop-types';
import { Button, Checkbox, Select, TextInput } from '../../../components/ui/index.js';
import InlineAlert from './InlineAlert.jsx';

function PreferencesSettingsPanel({
  preferences,
  onFieldChange,
  onSubmit,
  saving,
  alert,
  timezoneOptions,
  localeOptions,
  currencyOptions
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Preferences</p>
          <h3 className="mt-2 text-2xl font-semibold text-primary">Workspace defaults</h3>
          <p className="mt-1 text-sm text-slate-500">
            Control scheduling, currency, and notification cadences for your Fixnado workspace.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Select
          label="Timezone"
          value={preferences.timezone}
          onChange={(event) => onFieldChange('timezone', event.target.value)}
        >
          {timezoneOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          label="Locale"
          value={preferences.locale}
          onChange={(event) => onFieldChange('locale', event.target.value)}
        >
          {localeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          label="Default currency"
          value={preferences.defaultCurrency}
          onChange={(event) => onFieldChange('defaultCurrency', event.target.value)}
        >
          {currencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
          <Checkbox
            label="Weekly performance summary"
            checked={preferences.weeklySummaryEnabled}
            onChange={(event) => onFieldChange('weeklySummaryEnabled', event.target.checked)}
          />
          <Checkbox
            label="Dispatch alerts"
            checked={preferences.dispatchAlertsEnabled}
            onChange={(event) => onFieldChange('dispatchAlertsEnabled', event.target.checked)}
          />
          <Checkbox
            label="Escrow approvals"
            checked={preferences.escrowAlertsEnabled}
            onChange={(event) => onFieldChange('escrowAlertsEnabled', event.target.checked)}
          />
          <Checkbox
            label="Concierge inbox"
            checked={preferences.conciergeAlertsEnabled}
            onChange={(event) => onFieldChange('conciergeAlertsEnabled', event.target.checked)}
          />
        </div>
        <TextInput
          label="Quiet hours start"
          type="time"
          value={preferences.quietHoursStart}
          onChange={(event) => onFieldChange('quietHoursStart', event.target.value)}
          placeholder="18:00"
        />
        <TextInput
          label="Quiet hours end"
          type="time"
          value={preferences.quietHoursEnd}
          onChange={(event) => onFieldChange('quietHoursEnd', event.target.value)}
          placeholder="07:00"
        />
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <InlineAlert tone={alert?.type} message={alert?.message} />
        <Button type="submit" loading={saving} disabled={saving}>
          Save preferences
        </Button>
      </div>
    </form>
  );
}

PreferencesSettingsPanel.propTypes = {
  preferences: PropTypes.shape({
    timezone: PropTypes.string,
    locale: PropTypes.string,
    defaultCurrency: PropTypes.string,
    weeklySummaryEnabled: PropTypes.bool,
    dispatchAlertsEnabled: PropTypes.bool,
    escrowAlertsEnabled: PropTypes.bool,
    conciergeAlertsEnabled: PropTypes.bool,
    quietHoursStart: PropTypes.string,
    quietHoursEnd: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  alert: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  }),
  timezoneOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  localeOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  currencyOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired
};

PreferencesSettingsPanel.defaultProps = {
  alert: null
};

export default PreferencesSettingsPanel;
