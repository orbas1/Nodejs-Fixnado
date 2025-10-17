import PropTypes from 'prop-types';
import { Button, Checkbox, Modal, TextInput, Textarea } from '../../../../components/ui/index.js';
import FormStatus from './FormStatus.jsx';

function titleForMode(mode) {
  return mode === 'edit' ? 'Edit contact' : 'Add contact';
}

function ContactModal({
  open,
  mode,
  contact,
  contactTypes,
  onChange,
  onSubmit,
  onClose,
  saving,
  status
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titleForMode(mode)}
      description="Primary contacts surface on Fixnado dashboards and in emergency automations."
      size="lg"
      footer={(
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="provider-contact-form" loading={saving} disabled={saving}>
            Save contact
          </Button>
        </div>
      )}
    >
      <form id="provider-contact-form" className="space-y-5" onSubmit={onSubmit}>
        <FormStatus status={status} />

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Name"
            value={contact.name}
            onChange={(event) => onChange('name', event.target.value)}
            required
          />
          <TextInput
            label="Role / title"
            value={contact.role}
            onChange={(event) => onChange('role', event.target.value)}
            placeholder="Operations Director"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="fx-field">
            <label htmlFor="provider-contact-type" className="fx-field__label">
              Contact type
            </label>
            <select
              id="provider-contact-type"
              className="fx-text-input"
              value={contact.type}
              onChange={(event) => onChange('type', event.target.value)}
            >
              {contactTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <Checkbox
            label="Primary contact"
            description="Surface in automation, SLAs, and concierge routing."
            checked={contact.isPrimary}
            onChange={(event) => onChange('isPrimary', event.target.checked)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Email"
            type="email"
            value={contact.email}
            onChange={(event) => onChange('email', event.target.value)}
            placeholder="support@metro-ops.co.uk"
          />
          <TextInput
            label="Phone"
            value={contact.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            placeholder="+44 20 0000 0000"
          />
        </div>

        <TextInput
          label="Avatar URL"
          value={contact.avatarUrl}
          onChange={(event) => onChange('avatarUrl', event.target.value)}
          placeholder="https://cdn.fixnado.com/team/lana.png"
        />

        <Textarea
          label="Notes"
          value={contact.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          rows={4}
          placeholder="Escalation owner for enterprise clients, manages 24/7 rota."
        />
      </form>
    </Modal>
  );
}

ContactModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  contact: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    type: PropTypes.string,
    isPrimary: PropTypes.bool,
    notes: PropTypes.string,
    avatarUrl: PropTypes.string
  }).isRequired,
  contactTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  })
};

ContactModal.defaultProps = {
  mode: 'create',
  saving: false,
  status: null
};

export default ContactModal;
