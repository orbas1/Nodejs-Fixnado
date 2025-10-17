import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Button from '../../../components/ui/Button.jsx';

export default function CertificationModal({ open, onClose, onSubmit, initialValue, saving }) {
  const defaultValue = useMemo(
    () => ({
      title: '',
      issuer: '',
      credentialId: '',
      issuedOn: '',
      expiresOn: '',
      attachmentUrl: ''
    }),
    []
  );

  const [formState, setFormState] = useState(defaultValue);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setFormState({ ...defaultValue, ...initialValue });
      setError(null);
    }
  }, [defaultValue, initialValue, open]);

  const handleChange = (field) => (event) => {
    setFormState((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit(formState);
      onClose();
    } catch (err) {
      setError(err?.body?.message || err?.message || 'Unable to save certification');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initialValue?.id ? 'Edit certification' : 'Add certification'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput
          id="cert-title"
          label="Certification title"
          value={formState.title}
          onChange={handleChange('title')}
          required
        />
        <TextInput
          id="cert-issuer"
          label="Issuer"
          value={formState.issuer ?? ''}
          onChange={handleChange('issuer')}
        />
        <TextInput
          id="cert-credential"
          label="Credential ID"
          value={formState.credentialId ?? ''}
          onChange={handleChange('credentialId')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="cert-issued" label="Issued on" type="date" value={formState.issuedOn ?? ''} onChange={handleChange('issuedOn')} />
          <TextInput id="cert-expires" label="Expires on" type="date" value={formState.expiresOn ?? ''} onChange={handleChange('expiresOn')} />
        </div>
        <TextInput
          id="cert-attachment"
          label="Attachment URL"
          placeholder="https://"
          value={formState.attachmentUrl ?? ''}
          onChange={handleChange('attachmentUrl')}
        />
        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save certification'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

CertificationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValue: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    issuer: PropTypes.string,
    credentialId: PropTypes.string,
    issuedOn: PropTypes.string,
    expiresOn: PropTypes.string,
    attachmentUrl: PropTypes.string
  }),
  saving: PropTypes.bool
};

CertificationModal.defaultProps = {
  initialValue: undefined,
  saving: false
};
