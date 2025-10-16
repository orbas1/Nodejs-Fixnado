import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useProviderCalendar } from '../ProviderCalendarProvider.jsx';

const TIMEZONE_OPTIONS = [
  'Europe/London',
  'Europe/Dublin',
  'Europe/Paris',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai'
];

const WEEK_START_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'sunday', label: 'Sunday' }
];

const DEFAULT_VIEWS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' }
];

function normaliseRecipients(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return String(value)
    .split(/\r?\n|,/) // split by new line or comma
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const SettingsModal = ({ open, title, description }) => {
  const { settings, permissions, actions } = useProviderCalendar();
  const [draft, setDraft] = useState(settings || {});
  const [recipients, setRecipients] = useState('');
  const [saving, setSaving] = useState(false);
  const canEdit = permissions?.canEditSettings !== false;

  useEffect(() => {
    setDraft(settings || {});
    setRecipients(normaliseRecipients(settings?.notificationRecipients).join('\n'));
  }, [settings, open]);

  const timezoneOptions = useMemo(() => {
    const unique = new Set([settings?.timezone, ...TIMEZONE_OPTIONS]);
    return Array.from(unique)
      .filter(Boolean)
      .map((option) => ({ value: option, label: option }));
  }, [settings?.timezone]);

  const handleChange = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.checked }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canEdit) {
      actions.closeSettings();
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...draft,
        notificationRecipients: normaliseRecipients(recipients)
      };
      await actions.saveSettings(payload);
    } catch (error) {
      // surfaced via feedback banner
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={actions.closeSettings} title={title} description={description} size="lg">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="calendar-timezone" label="Timezone">
            <Select value={draft.timezone || ''} onChange={handleChange('timezone')} disabled={!canEdit} required>
              <option value="" disabled>
                Select timezone
              </option>
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="calendar-week-start" label="Week starts on">
            <Select value={draft.weekStartsOn || 'monday'} onChange={handleChange('weekStartsOn')} disabled={!canEdit}>
              {WEEK_START_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="calendar-workday-start" label="Workday start">
            <TextInput
              type="time"
              value={draft.workdayStart || '08:00'}
              onChange={handleChange('workdayStart')}
              disabled={!canEdit}
              required
            />
          </FormField>
          <FormField id="calendar-workday-end" label="Workday end">
            <TextInput
              type="time"
              value={draft.workdayEnd || '18:00'}
              onChange={handleChange('workdayEnd')}
              disabled={!canEdit}
              required
            />
          </FormField>
        </div>
        <FormField id="calendar-default-view" label="Default view">
          <Select value={draft.defaultView || 'month'} onChange={handleChange('defaultView')} disabled={!canEdit}>
            {DEFAULT_VIEWS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <Checkbox
            label="Allow overlapping bookings"
            checked={Boolean(draft.allowOverlapping)}
            onChange={handleCheckboxChange('allowOverlapping')}
            disabled={!canEdit}
          />
          <Checkbox
            label="Auto-accept assignments"
            checked={Boolean(draft.autoAcceptAssignments)}
            onChange={handleCheckboxChange('autoAcceptAssignments')}
            disabled={!canEdit}
          />
        </div>
        <FormField id="calendar-notification-recipients" label="Notify team members" optionalLabel="Separate emails with commas or new lines">
          <TextArea
            rows={3}
            value={recipients}
            onChange={(event) => setRecipients(event.target.value)}
            disabled={!canEdit}
          />
        </FormField>
        {!canEdit ? (
          <p className="text-xs text-slate-500">You have view-only access to calendar settings.</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={actions.closeSettings}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canEdit || saving} loading={saving}>
            Save settings
          </Button>
        </div>
      </form>
    </Modal>
  );
};

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.node,
  description: PropTypes.node
};

SettingsModal.defaultProps = {
  title: 'Calendar settings',
  description: 'Configure calendar defaults, working hours, and notifications for your crews.'
};

export default SettingsModal;
