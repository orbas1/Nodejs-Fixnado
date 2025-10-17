import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, FormField, StatusPill, TextInput } from '../../../../../components/ui/index.js';

function TextArea({ id, value, onChange, placeholder }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
    />
  );
}

TextArea.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

TextArea.defaultProps = {
  placeholder: ''
};

export default function DocumentUploadForm({ documentTypes, submitting, error, onSubmit }) {
  const defaultType = useMemo(() => documentTypes?.[0]?.value ?? 'insurance_certificate', [documentTypes]);
  const [form, setForm] = useState({
    type: defaultType,
    storageKey: '',
    fileName: '',
    fileSizeBytes: '',
    mimeType: 'application/pdf',
    issuedAt: '',
    expiryAt: '',
    checksum: '',
    uploadedBy: '',
    metadata: ''
  });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    setForm((current) => ({ ...current, type: defaultType }));
  }, [defaultType]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError(null);

    if (!form.storageKey.trim() || !form.fileName.trim()) {
      setLocalError('Storage key and file name are required');
      return;
    }

    if (!form.type) {
      setLocalError('Select a document type to continue');
      return;
    }

    const size = form.fileSizeBytes ? Number(form.fileSizeBytes) : null;
    if (form.fileSizeBytes && (!Number.isFinite(size) || size <= 0)) {
      setLocalError('File size must be a positive number');
      return;
    }

    const payload = {
      type: form.type,
      storageKey: form.storageKey.trim(),
      fileName: form.fileName.trim(),
      mimeType: form.mimeType.trim() || 'application/pdf'
    };

    if (size) {
      payload.fileSizeBytes = size;
    }
    if (form.issuedAt) {
      payload.issuedAt = form.issuedAt;
    }
    if (form.expiryAt) {
      payload.expiryAt = form.expiryAt;
    }
    if (form.uploadedBy.trim()) {
      payload.uploadedBy = form.uploadedBy.trim();
    }
    if (form.checksum.trim()) {
      payload.checksum = form.checksum.trim();
    }
    if (form.metadata.trim()) {
      payload.metadata = form.metadata.trim();
    }

    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="compliance-type" label="Document type">
          <select
            id="compliance-type"
            value={form.type}
            onChange={handleChange('type')}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
          >
            {documentTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="compliance-mime" label="MIME type" helper="Defaults to application/pdf">
          <TextInput id="compliance-mime" value={form.mimeType} onChange={handleChange('mimeType')} />
        </FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="compliance-storage" label="Storage key" helper="Location in your storage bucket">
          <TextInput id="compliance-storage" value={form.storageKey} onChange={handleChange('storageKey')} />
        </FormField>
        <FormField id="compliance-file" label="File name">
          <TextInput id="compliance-file" value={form.fileName} onChange={handleChange('fileName')} />
        </FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="compliance-size" label="File size (bytes)" helper="Optional but recommended">
          <TextInput id="compliance-size" value={form.fileSizeBytes} onChange={handleChange('fileSizeBytes')} type="number" />
        </FormField>
        <FormField id="compliance-checksum" label="Checksum" helper="Store MD5 or SHA hash for verification">
          <TextInput id="compliance-checksum" value={form.checksum} onChange={handleChange('checksum')} />
        </FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="compliance-issued" label="Issued date">
          <TextInput id="compliance-issued" type="date" value={form.issuedAt} onChange={handleChange('issuedAt')} />
        </FormField>
        <FormField id="compliance-expiry" label="Expiry date" helper="Required for insurance documents">
          <TextInput id="compliance-expiry" type="date" value={form.expiryAt} onChange={handleChange('expiryAt')} />
        </FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="compliance-uploader" label="Uploaded by" helper="Optional actor identifier">
          <TextInput id="compliance-uploader" value={form.uploadedBy} onChange={handleChange('uploadedBy')} />
        </FormField>
        <FormField
          id="compliance-metadata"
          label="Metadata"
          helper="JSON string for additional attributes like broker, policy number, or notes"
        >
          <TextArea
            id="compliance-metadata"
            value={form.metadata}
            onChange={handleChange('metadata')}
            placeholder='{"policyNumber":"ABC-123"}'
          />
        </FormField>
      </div>
      {(localError || error) && <StatusPill tone="danger">{localError || error}</StatusPill>}
      <div className="flex items-center justify-end">
        <Button type="submit" loading={submitting} disabled={submitting}>
          {submitting ? 'Uploading…' : 'Upload document'}
        </Button>
      </div>
    </form>
  );
}

DocumentUploadForm.propTypes = {
  documentTypes: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func
};

DocumentUploadForm.defaultProps = {
  documentTypes: [
    { value: 'insurance_certificate', label: 'Insurance certificate' },
    { value: 'public_liability', label: 'Public liability cover' },
    { value: 'identity_verification', label: 'Identity verification' }
  ],
  submitting: false,
  error: null,
  onSubmit: undefined
};
