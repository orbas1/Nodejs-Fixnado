import PropTypes from 'prop-types';
import { Button, Card, TextArea, TextInput } from '../../../components/ui/index.js';
import DiagnosticResult from './DiagnosticResult.jsx';

function GithubSection({ github, onChange, onTest, feedback, testing }) {
  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary">GitHub connection</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enable the GitHub app for deployment automations, workflow runs, and change management dashboards.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="App ID" value={github.appId} onChange={onChange('appId')} />
        <TextInput label="Client ID" value={github.clientId} onChange={onChange('clientId')} />
        <TextInput label="Client secret" type="password" value={github.clientSecret} onChange={onChange('clientSecret')} />
        <TextArea label="Private key" rows={4} value={github.privateKey} onChange={onChange('privateKey')} />
        <TextInput label="Webhook secret" type="password" value={github.webhookSecret} onChange={onChange('webhookSecret')} />
        <TextInput label="Organisation" value={github.organization} onChange={onChange('organization')} />
        <TextInput label="Installation ID" value={github.installationId} onChange={onChange('installationId')} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button type="button" variant="secondary" loading={testing} onClick={onTest}>
          Verify GitHub app
        </Button>
        <div className="md:w-2/3">
          <DiagnosticResult result={feedback} />
        </div>
      </div>
    </Card>
  );
}

GithubSection.propTypes = {
  github: PropTypes.shape({
    appId: PropTypes.string,
    clientId: PropTypes.string,
    clientSecret: PropTypes.string,
    privateKey: PropTypes.string,
    webhookSecret: PropTypes.string,
    organization: PropTypes.string,
    installationId: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onTest: PropTypes.func.isRequired,
  feedback: PropTypes.object,
  testing: PropTypes.bool
};

GithubSection.defaultProps = {
  feedback: null,
  testing: false
};

export default GithubSection;
