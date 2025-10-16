import PropTypes from 'prop-types';
import { Button, Card, Checkbox, TextInput } from '../../../components/ui/index.js';
import DiagnosticResult from './DiagnosticResult.jsx';

function SmtpSection({ smtp, onChange, onTest, feedback, testing }) {
  return (
    <Card padding="lg" className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Email delivery (SMTP)</h2>
        <p className="text-sm text-slate-600">
          Configure transactional email delivery. Credentials are stored encrypted and applied across all workspaces.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="SMTP host" value={smtp.host} onChange={onChange('host')} required />
        <TextInput label="Port" value={smtp.port} onChange={onChange('port')} required />
        <TextInput label="Username" value={smtp.username} onChange={onChange('username')} />
        <TextInput label="Password" type="password" value={smtp.password} onChange={onChange('password')} />
        <TextInput label="From email" value={smtp.fromEmail} onChange={onChange('fromEmail')} required />
      </div>
      <Checkbox label="Use TLS (secure)" checked={Boolean(smtp.secure)} onChange={onChange('secure')} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button type="button" variant="secondary" loading={testing} onClick={onTest}>
          Test SMTP connection
        </Button>
        <div className="md:w-2/3">
          <DiagnosticResult result={feedback} />
        </div>
      </div>
    </Card>
  );
}

SmtpSection.propTypes = {
  smtp: PropTypes.shape({
    host: PropTypes.string,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string,
    password: PropTypes.string,
    fromEmail: PropTypes.string,
    secure: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onTest: PropTypes.func.isRequired,
  feedback: PropTypes.object,
  testing: PropTypes.bool
};

SmtpSection.defaultProps = {
  feedback: null,
  testing: false
};

export default SmtpSection;
