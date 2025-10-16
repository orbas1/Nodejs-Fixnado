import PropTypes from 'prop-types';
import { Button, Card, Checkbox, TextInput } from '../../../components/ui/index.js';
import DiagnosticResult from './DiagnosticResult.jsx';

function StorageSection({ storage, onChange, onTest, feedback, testing }) {
  return (
    <Card padding="lg" className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Storage</h2>
        <p className="text-sm text-slate-600">
          Manage the storage destination for assets, exports, and backups. Values sync with Cloudflare R2 integrations.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Provider" value={storage.provider} onChange={onChange('provider')} />
        <TextInput label="Account ID" value={storage.accountId} onChange={onChange('accountId')} />
        <TextInput label="Bucket" value={storage.bucket} onChange={onChange('bucket')} required />
        <TextInput label="Region" value={storage.region} onChange={onChange('region')} />
        <TextInput label="Public URL" value={storage.publicUrl} onChange={onChange('publicUrl')} />
        <TextInput label="API endpoint" value={storage.endpoint} onChange={onChange('endpoint')} />
        <TextInput label="Access key ID" value={storage.accessKeyId} onChange={onChange('accessKeyId')} />
        <TextInput label="Secret access key" type="password" value={storage.secretAccessKey} onChange={onChange('secretAccessKey')} />
      </div>
      <Checkbox label="Serve via CDN" checked={Boolean(storage.useCdn)} onChange={onChange('useCdn')} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button type="button" variant="secondary" loading={testing} onClick={onTest}>
          Validate storage credentials
        </Button>
        <div className="md:w-2/3">
          <DiagnosticResult result={feedback} />
        </div>
      </div>
    </Card>
  );
}

StorageSection.propTypes = {
  storage: PropTypes.shape({
    provider: PropTypes.string,
    accountId: PropTypes.string,
    bucket: PropTypes.string,
    region: PropTypes.string,
    publicUrl: PropTypes.string,
    endpoint: PropTypes.string,
    accessKeyId: PropTypes.string,
    secretAccessKey: PropTypes.string,
    useCdn: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onTest: PropTypes.func.isRequired,
  feedback: PropTypes.object,
  testing: PropTypes.bool
};

StorageSection.defaultProps = {
  feedback: null,
  testing: false
};

export default StorageSection;
