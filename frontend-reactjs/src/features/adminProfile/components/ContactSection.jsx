import PropTypes from 'prop-types';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Button, Card, SegmentedControl, TextInput } from '../../../components/ui/index.js';
import { THEME_OPTIONS } from '../defaults.js';

function ContactSection({ profile, onProfileChange, onWorkingHoursChange, onThemeChange }) {
  return (
    <Card className="space-y-6" padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Contact &amp; availability</h2>
          <p className="mt-1 text-sm text-slate-600">
            Keep escalation teams aligned on how and when to reach you.
          </p>
        </div>
        <Button type="button" to="/admin/schedule" variant="tertiary" icon={CalendarDaysIcon} iconPosition="start">
          Open scheduling
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Primary email"
          type="email"
          value={profile.contactEmail}
          onChange={(event) => onProfileChange('contactEmail', event.target.value)}
          required
        />
        <TextInput
          label="Backup email"
          type="email"
          value={profile.backupEmail}
          onChange={(event) => onProfileChange('backupEmail', event.target.value)}
          hint="Optional fallback for urgent notifications"
        />
        <TextInput label="Direct phone" value={profile.contactPhone} onChange={(event) => onProfileChange('contactPhone', event.target.value)} />
        <TextInput label="Location" value={profile.location} onChange={(event) => onProfileChange('location', event.target.value)} />
        <TextInput label="Timezone" value={profile.timezone} onChange={(event) => onProfileChange('timezone', event.target.value)} required />
        <TextInput label="Language" value={profile.language} onChange={(event) => onProfileChange('language', event.target.value)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TextInput
          label="Working hours start"
          type="time"
          value={profile.workingHours.start}
          onChange={(event) => onWorkingHoursChange('start', event.target.value)}
        />
        <TextInput
          label="Working hours end"
          type="time"
          value={profile.workingHours.end}
          onChange={(event) => onWorkingHoursChange('end', event.target.value)}
        />
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Theme preference</span>
          <SegmentedControl
            name="Theme preference"
            value={profile.theme}
            onChange={onThemeChange}
            options={THEME_OPTIONS}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}

ContactSection.propTypes = {
  profile: PropTypes.shape({
    contactEmail: PropTypes.string,
    backupEmail: PropTypes.string,
    contactPhone: PropTypes.string,
    location: PropTypes.string,
    timezone: PropTypes.string,
    language: PropTypes.string,
    workingHours: PropTypes.shape({
      start: PropTypes.string,
      end: PropTypes.string
    }).isRequired,
    theme: PropTypes.string
  }).isRequired,
  onProfileChange: PropTypes.func.isRequired,
  onWorkingHoursChange: PropTypes.func.isRequired,
  onThemeChange: PropTypes.func.isRequired
};

export default ContactSection;
