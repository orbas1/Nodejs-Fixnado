import PropTypes from 'prop-types';
import { Card, TextInput } from '../../../components/ui/index.js';

function SiteIdentitySection({ site, onChange }) {
  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary">Site identity</h2>
        <p className="mt-2 text-sm text-slate-600">
          Update the public-facing identity used across emails, dashboards, and external integrations.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Site name" value={site.name} onChange={onChange('name')} required />
        <TextInput label="Site URL" value={site.url} onChange={onChange('url')} required />
        <TextInput label="Support email" value={site.supportEmail} onChange={onChange('supportEmail')} required />
        <TextInput label="Default locale" value={site.defaultLocale} onChange={onChange('defaultLocale')} />
        <TextInput label="Default timezone" value={site.defaultTimezone} onChange={onChange('defaultTimezone')} />
        <TextInput label="Marketing tagline" value={site.tagline} onChange={onChange('tagline')} />
        <TextInput label="Logo URL" value={site.logoUrl} onChange={onChange('logoUrl')} />
        <TextInput label="Favicon URL" value={site.faviconUrl} onChange={onChange('faviconUrl')} />
      </div>
    </Card>
  );
}

SiteIdentitySection.propTypes = {
  site: PropTypes.shape({
    name: PropTypes.string,
    url: PropTypes.string,
    supportEmail: PropTypes.string,
    defaultLocale: PropTypes.string,
    defaultTimezone: PropTypes.string,
    tagline: PropTypes.string,
    logoUrl: PropTypes.string,
    faviconUrl: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default SiteIdentitySection;
