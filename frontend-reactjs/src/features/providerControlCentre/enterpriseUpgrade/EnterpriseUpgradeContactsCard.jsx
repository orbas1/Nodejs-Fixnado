import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';

function EnterpriseUpgradeContactsCard({ contacts, onAddContact, onFieldChange, onBooleanChange, onRemoveContact }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-primary">Stakeholder approvals</h3>
          <p className="text-xs text-slate-500">Ensure decision makers and sponsors are aligned on enterprise scope.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onAddContact({
              name: '',
              role: '',
              email: '',
              phone: '',
              influenceLevel: '',
              primaryContact: false
            })
          }
        >
          Add contact
        </Button>
      </header>
      <div className="mt-4 space-y-4">
        {contacts.map((contact, index) => (
          <div key={contact.id ?? contact.clientId} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <TextInput
                label="Name"
                value={contact.name}
                onChange={(event) => onFieldChange(index, 'name', event.target.value)}
                required
              />
              <TextInput
                label="Role"
                value={contact.role || ''}
                onChange={(event) => onFieldChange(index, 'role', event.target.value)}
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <TextInput
                label="Email"
                value={contact.email || ''}
                onChange={(event) => onFieldChange(index, 'email', event.target.value)}
              />
              <TextInput
                label="Phone"
                value={contact.phone || ''}
                onChange={(event) => onFieldChange(index, 'phone', event.target.value)}
              />
              <TextInput
                label="Influence level"
                value={contact.influenceLevel || ''}
                onChange={(event) => onFieldChange(index, 'influenceLevel', event.target.value)}
              />
              <label className="mt-6 flex items-center gap-2 text-xs text-slate-600">
                <Checkbox
                  checked={Boolean(contact.primaryContact)}
                  onChange={(event) => onBooleanChange(index, 'primaryContact', event.target.checked)}
                />
                Primary contact
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => onRemoveContact(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {contacts.length === 0 ? (
          <p className="text-sm text-slate-500">Add decision makers and stakeholders to coordinate approvals.</p>
        ) : null}
      </div>
    </article>
  );
}

EnterpriseUpgradeContactsCard.propTypes = {
  contacts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      clientId: PropTypes.string,
      name: PropTypes.string,
      role: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      influenceLevel: PropTypes.string,
      primaryContact: PropTypes.bool
    })
  ).isRequired,
  onAddContact: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onBooleanChange: PropTypes.func.isRequired,
  onRemoveContact: PropTypes.func.isRequired
};

export default EnterpriseUpgradeContactsCard;
