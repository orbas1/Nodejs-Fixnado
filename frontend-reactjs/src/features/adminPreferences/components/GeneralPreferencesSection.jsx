import PropTypes from 'prop-types';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { Card, TextInput } from '../../../components/ui/index.js';

export default function GeneralPreferencesSection({ general, onFieldChange }) {
  return (
    <Card padding="lg" className="border border-accent/20 bg-white shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-primary">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            General branding & locale
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Define how the admin control centre is presented to administrators across regions.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <TextInput
          label="Platform name"
          value={general.platformName}
          onChange={(event) => onFieldChange('platformName', event.target.value)}
        />
        <TextInput
          label="Support email"
          type="email"
          value={general.supportEmail}
          onChange={(event) => onFieldChange('supportEmail', event.target.value)}
        />
        <TextInput
          label="Default locale"
          hint="BCP 47 language tag (e.g. en-GB, fr-FR)."
          value={general.defaultLocale}
          onChange={(event) => onFieldChange('defaultLocale', event.target.value)}
        />
        <TextInput
          label="Default timezone"
          hint="IANA timezone identifier (e.g. Europe/London)."
          value={general.defaultTimezone}
          onChange={(event) => onFieldChange('defaultTimezone', event.target.value)}
        />
        <TextInput
          label="Brand accent colour"
          value={general.brandColor}
          onChange={(event) => onFieldChange('brandColor', event.target.value)}
        />
        <TextInput
          label="Admin login URL"
          hint="External URL for SSO-enabled admin access."
          value={general.loginUrl}
          onChange={(event) => onFieldChange('loginUrl', event.target.value)}
        />
      </div>
    </Card>
  );
}

GeneralPreferencesSection.propTypes = {
  general: PropTypes.shape({
    platformName: PropTypes.string.isRequired,
    supportEmail: PropTypes.string.isRequired,
    defaultLocale: PropTypes.string.isRequired,
    defaultTimezone: PropTypes.string.isRequired,
    brandColor: PropTypes.string.isRequired,
    loginUrl: PropTypes.string.isRequired
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired
};
