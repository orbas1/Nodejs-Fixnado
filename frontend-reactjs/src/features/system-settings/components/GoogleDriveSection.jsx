import PropTypes from 'prop-types';
import { Button, Card, TextArea, TextInput } from '../../../components/ui/index.js';
import DiagnosticResult from './DiagnosticResult.jsx';

function GoogleDriveSection({ googleDrive, onChange, onTest, feedback, testing }) {
  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary">Google Drive API</h2>
        <p className="mt-2 text-sm text-slate-600">
          Credentials for ingesting design assets, knowledge bases, and compliance documentation from Google Drive.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Client ID" value={googleDrive.clientId} onChange={onChange('clientId')} />
        <TextInput label="Client secret" type="password" value={googleDrive.clientSecret} onChange={onChange('clientSecret')} />
        <TextInput label="Redirect URI" value={googleDrive.redirectUri} onChange={onChange('redirectUri')} />
        <TextInput label="Refresh token" type="password" value={googleDrive.refreshToken} onChange={onChange('refreshToken')} />
        <TextInput label="Service account email" value={googleDrive.serviceAccountEmail} onChange={onChange('serviceAccountEmail')} />
        <TextArea label="Service account key" rows={4} value={googleDrive.serviceAccountKey} onChange={onChange('serviceAccountKey')} />
        <TextInput label="Root folder ID" value={googleDrive.rootFolderId} onChange={onChange('rootFolderId')} />
        <TextInput label="Shared drive ID" value={googleDrive.sharedDriveId} onChange={onChange('sharedDriveId')} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button type="button" variant="secondary" loading={testing} onClick={onTest}>
          Review Google Drive config
        </Button>
        <div className="md:w-2/3">
          <DiagnosticResult result={feedback} />
        </div>
      </div>
    </Card>
  );
}

GoogleDriveSection.propTypes = {
  googleDrive: PropTypes.shape({
    clientId: PropTypes.string,
    clientSecret: PropTypes.string,
    redirectUri: PropTypes.string,
    refreshToken: PropTypes.string,
    serviceAccountEmail: PropTypes.string,
    serviceAccountKey: PropTypes.string,
    rootFolderId: PropTypes.string,
    sharedDriveId: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onTest: PropTypes.func.isRequired,
  feedback: PropTypes.object,
  testing: PropTypes.bool
};

GoogleDriveSection.defaultProps = {
  feedback: null,
  testing: false
};

export default GoogleDriveSection;
