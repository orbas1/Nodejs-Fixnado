import PropTypes from 'prop-types';
import { Button, Card, TextInput } from '../../../components/ui/index.js';
import DiagnosticResult from './DiagnosticResult.jsx';

function ChatwootSection({ chatwoot, onChange, onTest, feedback, testing }) {
  return (
    <Card padding="lg" className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Chatwoot</h2>
        <p className="text-sm text-slate-600">
          Provide the Chatwoot base URL and key to surface live chat across Fixnado surfaces.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Base URL" value={chatwoot.baseUrl} onChange={onChange('baseUrl')} />
        <TextInput label="Website token" value={chatwoot.websiteToken} onChange={onChange('websiteToken')} />
        <TextInput label="Inbox identifier" value={chatwoot.inboxIdentifier} onChange={onChange('inboxIdentifier')} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button type="button" variant="secondary" loading={testing} onClick={onTest}>
          Test Chatwoot widget
        </Button>
        <div className="md:w-2/3">
          <DiagnosticResult result={feedback} />
        </div>
      </div>
    </Card>
  );
}

ChatwootSection.propTypes = {
  chatwoot: PropTypes.shape({
    baseUrl: PropTypes.string,
    websiteToken: PropTypes.string,
    inboxIdentifier: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onTest: PropTypes.func.isRequired,
  feedback: PropTypes.object,
  testing: PropTypes.bool
};

ChatwootSection.defaultProps = {
  feedback: null,
  testing: false
};

export default ChatwootSection;
