import PropTypes from 'prop-types';
import { Button, Card, Checkbox, TextInput } from '../../../components/ui/index.js';
import DiagnosticResult from './DiagnosticResult.jsx';

function AutomationIntegrationsSection({
  openai,
  slack,
  onOpenAiChange,
  onSlackChange,
  onTestOpenAi,
  onTestSlack,
  openAiFeedback,
  slackFeedback,
  testingSection
}) {
  return (
    <Card padding="lg" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-primary">OpenAI BYOK</h2>
            <p className="mt-2 text-sm text-slate-600">
              Bring your own API key for completions, assistants, and content generation pipelines.
            </p>
          </div>
          <Checkbox label="Enable OpenAI BYOK" checked={Boolean(openai.byokEnabled)} onChange={onOpenAiChange('byokEnabled')} />
          <TextInput label="Provider" value={openai.provider} onChange={onOpenAiChange('provider')} />
          <TextInput label="Base URL" value={openai.baseUrl} onChange={onOpenAiChange('baseUrl')} />
          <TextInput label="API key" type="password" value={openai.apiKey} onChange={onOpenAiChange('apiKey')} />
          <TextInput label="Organisation ID" value={openai.organizationId} onChange={onOpenAiChange('organizationId')} />
          <TextInput label="Default model" value={openai.defaultModel} onChange={onOpenAiChange('defaultModel')} />
          <Button
            type="button"
            variant="secondary"
            loading={testingSection === 'openai'}
            onClick={onTestOpenAi}
          >
            Test OpenAI credentials
          </Button>
          <DiagnosticResult result={openAiFeedback} />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-primary">Slack BYOK</h2>
            <p className="mt-2 text-sm text-slate-600">
              Configure Slack credentials for automated alerts, runbooks, and concierge messaging.
            </p>
          </div>
          <Checkbox label="Enable Slack BYOK" checked={Boolean(slack.byokEnabled)} onChange={onSlackChange('byokEnabled')} />
          <TextInput label="Bot token" type="password" value={slack.botToken} onChange={onSlackChange('botToken')} />
          <TextInput label="Signing secret" type="password" value={slack.signingSecret} onChange={onSlackChange('signingSecret')} />
          <TextInput label="Default channel" value={slack.defaultChannel} onChange={onSlackChange('defaultChannel')} />
          <TextInput label="App ID" value={slack.appId} onChange={onSlackChange('appId')} />
          <TextInput label="Team ID" value={slack.teamId} onChange={onSlackChange('teamId')} />
          <Button
            type="button"
            variant="secondary"
            loading={testingSection === 'slack'}
            onClick={onTestSlack}
          >
            Test Slack credentials
          </Button>
          <DiagnosticResult result={slackFeedback} />
        </div>
      </div>
    </Card>
  );
}

const integrationShape = PropTypes.shape({
  byokEnabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  provider: PropTypes.string,
  baseUrl: PropTypes.string,
  apiKey: PropTypes.string,
  organizationId: PropTypes.string,
  defaultModel: PropTypes.string,
  botToken: PropTypes.string,
  signingSecret: PropTypes.string,
  defaultChannel: PropTypes.string,
  appId: PropTypes.string,
  teamId: PropTypes.string
});

AutomationIntegrationsSection.propTypes = {
  openai: integrationShape.isRequired,
  slack: integrationShape.isRequired,
  onOpenAiChange: PropTypes.func.isRequired,
  onSlackChange: PropTypes.func.isRequired,
  onTestOpenAi: PropTypes.func.isRequired,
  onTestSlack: PropTypes.func.isRequired,
  openAiFeedback: PropTypes.object,
  slackFeedback: PropTypes.object,
  testingSection: PropTypes.string
};

AutomationIntegrationsSection.defaultProps = {
  openAiFeedback: null,
  slackFeedback: null,
  testingSection: null
};

export default AutomationIntegrationsSection;
