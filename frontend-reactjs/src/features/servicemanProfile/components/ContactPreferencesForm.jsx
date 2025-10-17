import PropTypes from 'prop-types';
import SectionCard from './SectionCard.jsx';

function ContactPreferencesForm({
  form,
  onFieldChange,
  onContactChange,
  onAddContact,
  onRemoveContact,
  onSubmit,
  saving,
  status
}) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onFieldChange(name, value);
  };

  return (
    <SectionCard
      title="Contact & escalation"
      description="Keep dispatch, safety, and payroll teams informed about how to reach you and who to notify in an emergency."
      onSubmit={onSubmit}
      saving={saving}
      status={status}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Mobile number
          <input
            type="tel"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder="+44 7700 900123"
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Preferred contact email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.co.uk"
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="rounded-2xl border border-accent/10 bg-secondary/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-primary">Emergency contacts</h4>
            <p className="text-xs text-slate-600">These people receive urgent alerts when incidents or escalation events occur.</p>
          </div>
          <button
            type="button"
            onClick={onAddContact}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent"
          >
            Add contact
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {form.emergencyContacts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-accent/20 px-4 py-6 text-sm text-slate-500">
              No contacts added yet. Add an escalation partner, crew lead, or operations manager.
            </p>
          ) : (
            form.emergencyContacts.map((contact, index) => (
              <div
                key={contact.id}
                className="rounded-xl border border-accent/10 bg-white/80 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(event) => onContactChange(index, 'name', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                      placeholder="Full name"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Relationship
                    <input
                      type="text"
                      value={contact.relationship}
                      onChange={(event) => onContactChange(index, 'relationship', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                      placeholder="Role or relationship"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-col gap-4 md:grid md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                    <input
                      type="tel"
                      value={contact.phoneNumber}
                      onChange={(event) => onContactChange(index, 'phoneNumber', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                      placeholder="+44 7700 900000"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(event) => onContactChange(index, 'email', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                      placeholder="contact@company.co.uk"
                    />
                  </label>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoveContact(index)}
                    className="text-xs font-semibold text-rose-600 transition hover:text-rose-800"
                  >
                    Remove contact
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
}

ContactPreferencesForm.propTypes = {
  form: PropTypes.shape({
    phoneNumber: PropTypes.string,
    email: PropTypes.string,
    emergencyContacts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        relationship: PropTypes.string,
        phoneNumber: PropTypes.string,
        email: PropTypes.string
      })
    )
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onContactChange: PropTypes.func.isRequired,
  onAddContact: PropTypes.func.isRequired,
  onRemoveContact: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

ContactPreferencesForm.defaultProps = {
  saving: false,
  status: null
};

export default ContactPreferencesForm;
