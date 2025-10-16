import PropTypes from 'prop-types';
import { Card, Checkbox, TextInput } from '../../components/ui/index.js';

function IntegrationSettingsPanel({ form, onIntegrationChange }) {
  return (
    <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-primary">Integration credentials</h2>
        <p className="text-sm text-slate-600">
          Centralise billing, escrow, email, and storage secrets. Values are stored securely server-side.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Stripe</h3>
          <TextInput
            label="Publishable key"
            value={form.stripe.publishableKey || ''}
            onChange={onIntegrationChange('stripe', 'publishableKey')}
          />
          <TextInput
            label="Secret key"
            type="password"
            value={form.stripe.secretKey || ''}
            onChange={onIntegrationChange('stripe', 'secretKey')}
          />
          <TextInput
            label="Webhook secret"
            type="password"
            value={form.stripe.webhookSecret || ''}
            onChange={onIntegrationChange('stripe', 'webhookSecret')}
          />
          <TextInput
            label="Account ID"
            value={form.stripe.accountId || ''}
            onChange={onIntegrationChange('stripe', 'accountId')}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Escrow.com</h3>
          <TextInput
            label="API key"
            value={form.escrow.apiKey || ''}
            onChange={onIntegrationChange('escrow', 'apiKey')}
          />
          <TextInput
            label="API secret"
            type="password"
            value={form.escrow.apiSecret || ''}
            onChange={onIntegrationChange('escrow', 'apiSecret')}
          />
          <TextInput
            label="Environment"
            value={form.escrow.environment || ''}
            onChange={onIntegrationChange('escrow', 'environment')}
            hint="Use sandbox for testing or production when ready to transact."
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">SMTP</h3>
          <TextInput label="Host" value={form.smtp.host || ''} onChange={onIntegrationChange('smtp', 'host')} />
          <TextInput
            label="Port"
            type="number"
            value={form.smtp.port ?? ''}
            onChange={onIntegrationChange('smtp', 'port')}
          />
          <TextInput
            label="Username"
            value={form.smtp.username || ''}
            onChange={onIntegrationChange('smtp', 'username')}
          />
          <TextInput
            label="Password"
            type="password"
            value={form.smtp.password || ''}
            onChange={onIntegrationChange('smtp', 'password')}
          />
          <TextInput
            label="From email"
            value={form.smtp.fromEmail || ''}
            onChange={onIntegrationChange('smtp', 'fromEmail')}
          />
          <Checkbox
            label="Use secure connection (TLS)"
            checked={Boolean(form.smtp.secure)}
            onChange={onIntegrationChange('smtp', 'secure')}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Cloudflare R2</h3>
          <TextInput
            label="Account ID"
            value={form.cloudflareR2.accountId || ''}
            onChange={onIntegrationChange('cloudflareR2', 'accountId')}
          />
          <TextInput
            label="Access key ID"
            value={form.cloudflareR2.accessKeyId || ''}
            onChange={onIntegrationChange('cloudflareR2', 'accessKeyId')}
          />
          <TextInput
            label="Secret access key"
            type="password"
            value={form.cloudflareR2.secretAccessKey || ''}
            onChange={onIntegrationChange('cloudflareR2', 'secretAccessKey')}
          />
          <TextInput
            label="Bucket name"
            value={form.cloudflareR2.bucket || ''}
            onChange={onIntegrationChange('cloudflareR2', 'bucket')}
          />
          <TextInput
            label="Public URL"
            value={form.cloudflareR2.publicUrl || ''}
            onChange={onIntegrationChange('cloudflareR2', 'publicUrl')}
          />
          <TextInput
            label="Endpoint"
            value={form.cloudflareR2.endpoint || ''}
            onChange={onIntegrationChange('cloudflareR2', 'endpoint')}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">App shell</h3>
          <TextInput label="Application name" value={form.app.name || ''} onChange={onIntegrationChange('app', 'name')} />
          <TextInput label="Primary URL" value={form.app.url || ''} onChange={onIntegrationChange('app', 'url')} />
          <TextInput
            label="Support email"
            value={form.app.supportEmail || ''}
            onChange={onIntegrationChange('app', 'supportEmail')}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Database credentials</h3>
          <TextInput label="Host" value={form.database.host || ''} onChange={onIntegrationChange('database', 'host')} />
          <TextInput
            label="Port"
            type="number"
            value={form.database.port ?? ''}
            onChange={onIntegrationChange('database', 'port')}
          />
          <TextInput
            label="Database name"
            value={form.database.name || ''}
            onChange={onIntegrationChange('database', 'name')}
          />
          <TextInput label="User" value={form.database.user || ''} onChange={onIntegrationChange('database', 'user')} />
          <TextInput
            label="Password"
            type="password"
            value={form.database.password || ''}
            onChange={onIntegrationChange('database', 'password')}
          />
          <Checkbox
            label="Require SSL"
            checked={Boolean(form.database.ssl)}
            onChange={onIntegrationChange('database', 'ssl')}
          />
        </div>
      </div>
    </Card>
  );
}

IntegrationSettingsPanel.propTypes = {
  form: PropTypes.shape({
    stripe: PropTypes.object.isRequired,
    escrow: PropTypes.object.isRequired,
    smtp: PropTypes.object.isRequired,
    cloudflareR2: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    database: PropTypes.object.isRequired
  }).isRequired,
  onIntegrationChange: PropTypes.func.isRequired
};

export default IntegrationSettingsPanel;
