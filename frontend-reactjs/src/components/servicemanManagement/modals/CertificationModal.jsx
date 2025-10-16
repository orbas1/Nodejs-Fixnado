import PropTypes from 'prop-types';
import FormField from '../../ui/FormField.jsx';
import { formatLabel, toInputValue } from '../constants.js';
import ModalContainer from './ModalContainer.jsx';

export default function CertificationModal({
  open,
  mode,
  formValues,
  options,
  submitting,
  error,
  profile,
  onClose,
  onChange,
  onSubmit,
  onDelete
}) {
  const statuses = options.certificationStatuses ?? ['valid', 'expiring', 'expired', 'revoked'];

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      error={error}
      title={mode === 'create' ? 'Add certification' : 'Edit certification'}
      description="Track compliance credentials, renewals, and evidence."
      showDelete={mode === 'edit'}
      deleteLabel="Delete certification"
      onDelete={onDelete}
    >
      <FormField id="cert-name" label="Certification name">
        <input
          id="cert-name"
          type="text"
          value={toInputValue(formValues.name)}
          onChange={onChange('name')}
          required
          className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="cert-status" label="Status">
          <select
            id="cert-status"
            value={toInputValue(formValues.status)}
            onChange={onChange('status')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="cert-issuer" label="Issuer" optionalLabel="Optional">
          <input
            id="cert-issuer"
            type="text"
            value={toInputValue(formValues.issuer)}
            onChange={onChange('issuer')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="cert-issued" label="Issued date" optionalLabel="Optional">
          <input
            id="cert-issued"
            type="date"
            value={toInputValue(formValues.issuedAt)}
            onChange={onChange('issuedAt')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
        <FormField id="cert-expires" label="Expiry date" optionalLabel="Optional">
          <input
            id="cert-expires"
            type="date"
            value={toInputValue(formValues.expiresAt)}
            onChange={onChange('expiresAt')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
      </div>
      <FormField id="cert-document" label="Document link" optionalLabel="Optional">
        <input
          id="cert-document"
          type="url"
          value={toInputValue(formValues.documentUrl)}
          onChange={onChange('documentUrl')}
          className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      <FormField id="cert-notes" label="Notes" optionalLabel="Optional">
        <textarea
          id="cert-notes"
          rows={3}
          value={toInputValue(formValues.notes)}
          onChange={onChange('notes')}
          className="w-full rounded-2xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      {profile?.displayName ? (
        <p className="text-xs text-slate-500">
          Linked crew: <span className="font-semibold text-primary">{profile.displayName}</span>
        </p>
      ) : null}
    </ModalContainer>
  );
}

CertificationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  formValues: PropTypes.object.isRequired,
  options: PropTypes.shape({
    certificationStatuses: PropTypes.array
  }),
  submitting: PropTypes.bool,
  error: PropTypes.string,
  profile: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

CertificationModal.defaultProps = {
  options: undefined,
  submitting: false,
  error: null,
  profile: null,
  onDelete: undefined
};
