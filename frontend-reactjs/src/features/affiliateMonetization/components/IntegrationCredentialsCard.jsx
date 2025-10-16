import PropTypes from 'prop-types';
import { Card, Checkbox, TextInput } from '../../../components/ui/index.js';

function IntegrationPanel({ title, children }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

IntegrationPanel.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default function IntegrationCredentialsCard({ value, onChange }) {
  return (
    <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-primary">Integration credentials</h2>
        <p className="text-sm text-slate-600">
          Centralise billing, escrow, email, and storage secrets. Values are stored securely server-side.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <IntegrationPanel title="Stripe">
          <TextInput
            label="Publishable key"
            value={value.stripe.publishableKey || ''}
            onChange={(event) => onChange('stripe', 'publishableKey', event.target.value)}
          />
          <TextInput
            label="Secret key"
            type="password"
            value={value.stripe.secretKey || ''}
            onChange={(event) => onChange('stripe', 'secretKey', event.target.value)}
          />
          <TextInput
            label="Webhook secret"
            type="password"
            value={value.stripe.webhookSecret || ''}
            onChange={(event) => onChange('stripe', 'webhookSecret', event.target.value)}
          />
          <TextInput
            label="Account ID"
            value={value.stripe.accountId || ''}
            onChange={(event) => onChange('stripe', 'accountId', event.target.value)}
          />
        </IntegrationPanel>

        <IntegrationPanel title="Escrow.com">
          <TextInput
            label="API key"
            value={value.escrow.apiKey || ''}
            onChange={(event) => onChange('escrow', 'apiKey', event.target.value)}
          />
          <TextInput
            label="API secret"
            type="password"
            value={value.escrow.apiSecret || ''}
            onChange={(event) => onChange('escrow', 'apiSecret', event.target.value)}
          />
          <TextInput
            label="Environment"
            value={value.escrow.environment || ''}
            onChange={(event) => onChange('escrow', 'environment', event.target.value)}
            hint="Use sandbox for testing or production when ready to transact."
          />
        </IntegrationPanel>

        <IntegrationPanel title="SMTP">
          <TextInput
            label="Host"
            value={value.smtp.host || ''}
            onChange={(event) => onChange('smtp', 'host', event.target.value)}
          />
          <TextInput
            label="Port"
            type="number"
            value={value.smtp.port ?? ''}
            onChange={(event) => onChange('smtp', 'port', event.target.value)}
          />
          <TextInput
            label="Username"
            value={value.smtp.username || ''}
            onChange={(event) => onChange('smtp', 'username', event.target.value)}
          />
          <TextInput
            label="Password"
            type="password"
            value={value.smtp.password || ''}
            onChange={(event) => onChange('smtp', 'password', event.target.value)}
          />
          <TextInput
            label="From email"
            value={value.smtp.fromEmail || ''}
            onChange={(event) => onChange('smtp', 'fromEmail', event.target.value)}
          />
          <Checkbox
            label="Use secure connection (TLS)"
            checked={Boolean(value.smtp.secure)}
            onChange={(event) => onChange('smtp', 'secure', event.target.checked)}
          />
        </IntegrationPanel>

        <IntegrationPanel title="Cloudflare R2">
          <TextInput
            label="Account ID"
            value={value.cloudflareR2.accountId || ''}
            onChange={(event) => onChange('cloudflareR2', 'accountId', event.target.value)}
          />
          <TextInput
            label="Access key ID"
            value={value.cloudflareR2.accessKeyId || ''}
            onChange={(event) => onChange('cloudflareR2', 'accessKeyId', event.target.value)}
          />
          <TextInput
            label="Secret access key"
            type="password"
            value={value.cloudflareR2.secretAccessKey || ''}
            onChange={(event) => onChange('cloudflareR2', 'secretAccessKey', event.target.value)}
          />
          <TextInput
            label="Bucket name"
            value={value.cloudflareR2.bucket || ''}
            onChange={(event) => onChange('cloudflareR2', 'bucket', event.target.value)}
          />
          <TextInput
            label="Public base URL"
            value={value.cloudflareR2.publicBaseUrl || ''}
            onChange={(event) => onChange('cloudflareR2', 'publicBaseUrl', event.target.value)}
            optionalLabel="optional"
          />
        </IntegrationPanel>

        <IntegrationPanel title="Mobile app">
          <TextInput
            label="Deep link host"
            value={value.app.deepLinkHost || ''}
            onChange={(event) => onChange('app', 'deepLinkHost', event.target.value)}
          />
          <TextInput
            label="iOS bundle ID"
            value={value.app.iosBundleId || ''}
            onChange={(event) => onChange('app', 'iosBundleId', event.target.value)}
          />
          <TextInput
            label="Android package"
            value={value.app.androidPackage || ''}
            onChange={(event) => onChange('app', 'androidPackage', event.target.value)}
          />
        </IntegrationPanel>

        <IntegrationPanel title="Database credentials">
          <TextInput
            label="Host"
            value={value.database.host || ''}
            onChange={(event) => onChange('database', 'host', event.target.value)}
          />
          <TextInput
            label="Port"
            type="number"
            value={value.database.port ?? ''}
            onChange={(event) => onChange('database', 'port', event.target.value)}
          />
          <TextInput
            label="Database name"
            value={value.database.name || ''}
            onChange={(event) => onChange('database', 'name', event.target.value)}
          />
          <TextInput
            label="User"
            value={value.database.user || ''}
            onChange={(event) => onChange('database', 'user', event.target.value)}
          />
          <TextInput
            label="Password"
            type="password"
            value={value.database.password || ''}
            onChange={(event) => onChange('database', 'password', event.target.value)}
          />
          <Checkbox
            label="Require SSL"
            checked={Boolean(value.database.ssl)}
            onChange={(event) => onChange('database', 'ssl', event.target.checked)}
          />
        </IntegrationPanel>

        <IntegrationPanel title="Database replicas">
          <TextInput
            label="Reporting replica URI"
            value={value.database.reportingReplicaUri || ''}
            onChange={(event) => onChange('database', 'reportingReplicaUri', event.target.value)}
            optionalLabel="optional"
          />
          <TextInput
            label="Archive replica URI"
            value={value.database.archiveReplicaUri || ''}
            onChange={(event) => onChange('database', 'archiveReplicaUri', event.target.value)}
            optionalLabel="optional"
          />
        </IntegrationPanel>
      </div>
    </Card>
  );
}

IntegrationCredentialsCard.propTypes = {
  value: PropTypes.shape({
    stripe: PropTypes.object.isRequired,
    escrow: PropTypes.object.isRequired,
    smtp: PropTypes.object.isRequired,
    cloudflareR2: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    database: PropTypes.object.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
