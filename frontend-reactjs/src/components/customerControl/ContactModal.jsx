import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { contactTemplate, contactTypeOptions } from './constants.js';
import { CheckboxField, Field, SelectField, TextArea, TextInput } from './FormControls.jsx';
import ModalShell from './ModalShell.jsx';

const emptyContact = { ...contactTemplate };

const ContactModal = ({ open, contact, onClose, onSubmit, saving }) => {
  const [form, setForm] = useState(emptyContact);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyContact, ...(contact ?? {}) });
    }
  }, [open, contact]);

  const footer = useMemo(
    () => [
      <button
        key="cancel"
        type="button"
        onClick={onClose}
        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300"
      >
        Cancel
      </button>,
      <button
        key="save"
        type="submit"
        onClick={() => onSubmit(form)}
        disabled={saving}
        className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save contact'}
      </button>
    ],
    [onClose, onSubmit, form, saving]
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={form.id ? 'Edit customer contact' : 'Add customer contact'}
      description="Keep escalation paths current so the right teammates receive updates."
      footer={footer}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="contact-name" label="Full name" description="Shown in bookings and escalations.">
            <TextInput
              id="contact-name"
              value={form.name}
              onChange={(value) => setForm((previous) => ({ ...previous, name: value }))}
              placeholder="Priya Shah"
            />
          </Field>
          <Field id="contact-role" label="Role">
            <TextInput
              id="contact-role"
              value={form.role}
              onChange={(value) => setForm((previous) => ({ ...previous, role: value }))}
              placeholder="Head of Facilities"
            />
          </Field>
          <Field id="contact-email" label="Email">
            <TextInput
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((previous) => ({ ...previous, email: value }))}
              placeholder="priya@example.com"
            />
          </Field>
          <Field id="contact-phone" label="Phone">
            <TextInput
              id="contact-phone"
              value={form.phone}
              onChange={(value) => setForm((previous) => ({ ...previous, phone: value }))}
              placeholder="+44 7700 900123"
            />
          </Field>
          <Field id="contact-type" label="Contact type">
            <SelectField
              id="contact-type"
              value={form.contactType}
              onChange={(value) => setForm((previous) => ({ ...previous, contactType: value }))}
              options={contactTypeOptions}
            />
          </Field>
          <CheckboxField
            id="contact-primary"
            checked={form.isPrimary}
            onChange={(value) => setForm((previous) => ({ ...previous, isPrimary: value }))}
            label="Primary escalation contact"
            description="Display at the top of the contact directory and auto-notify during escalations."
          />
        </div>
        <Field id="contact-avatar" label="Avatar URL" description="Square image for contact directory cards.">
          <TextInput
            id="contact-avatar"
            value={form.avatarUrl}
            onChange={(value) => setForm((previous) => ({ ...previous, avatarUrl: value }))}
            placeholder="https://cdn.fixnado.com/assets/customer/priya.png"
          />
        </Field>
        <Field id="contact-notes" label="Notes" description="Escalation preferences, cover schedules, or specialities.">
          <TextArea
            id="contact-notes"
            value={form.notes}
            onChange={(value) => setForm((previous) => ({ ...previous, notes: value }))}
            rows={4}
            placeholder="Escalate outages to Priya after 6pm. Finance approvals via Alex on weekends."
          />
        </Field>
      </form>
    </ModalShell>
  );
};

const contactPropType = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  role: PropTypes.string,
  email: PropTypes.string,
  phone: PropTypes.string,
  contactType: PropTypes.string,
  isPrimary: PropTypes.bool,
  notes: PropTypes.string,
  avatarUrl: PropTypes.string
});

ContactModal.propTypes = {
  open: PropTypes.bool.isRequired,
  contact: contactPropType,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

ContactModal.defaultProps = {
  contact: null,
  saving: false
};

export default ContactModal;
export { contactPropType };
