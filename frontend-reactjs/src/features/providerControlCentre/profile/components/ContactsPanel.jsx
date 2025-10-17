import PropTypes from 'prop-types';
import {
  EnvelopeIcon,
  PhoneIcon,
  UserCircleIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Button, Spinner } from '../../../../components/ui/index.js';
import FormStatus from './FormStatus.jsx';

const contactShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  role: PropTypes.string,
  email: PropTypes.string,
  phone: PropTypes.string,
  type: PropTypes.string,
  isPrimary: PropTypes.bool,
  notes: PropTypes.string
});

function ContactRow({ contact, onEdit, onDelete }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <UserCircleIcon aria-hidden="true" className="h-6 w-6" />
          <div>
            <p className="text-base font-semibold text-primary">
              {contact.name}
              {contact.isPrimary ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <StarIcon aria-hidden="true" className="h-4 w-4" /> Primary
                </span>
              ) : null}
            </p>
            {contact.role ? <p className="text-sm text-slate-500">{contact.role}</p> : null}
          </div>
        </div>
        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <p className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wide text-xs text-slate-500">Type</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-primary shadow-sm">
              {contact.type}
            </span>
          </p>
          {contact.email ? (
            <p className="flex items-center gap-2">
              <EnvelopeIcon aria-hidden="true" className="h-4 w-4 text-primary" />
              <a href={`mailto:${contact.email}`} className="text-primary hover:text-primary/80">
                {contact.email}
              </a>
            </p>
          ) : null}
          {contact.phone ? (
            <p className="flex items-center gap-2">
              <PhoneIcon aria-hidden="true" className="h-4 w-4 text-primary" />
              <a href={`tel:${contact.phone}`} className="text-primary hover:text-primary/80">
                {contact.phone}
              </a>
            </p>
          ) : null}
        </div>
        {contact.notes ? <p className="text-sm text-slate-600">{contact.notes}</p> : null}
      </div>
      <div className="flex gap-3 md:flex-col">
        <Button type="button" variant="secondary" size="sm" icon={PencilSquareIcon} onClick={() => onEdit(contact)}>
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={TrashIcon}
          className="text-rose-600"
          onClick={() => onDelete(contact)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

ContactRow.propTypes = {
  contact: contactShape.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

function ContactsPanel({ contacts, loading, status, onCreate, onEdit, onDelete }) {
  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Contacts</p>
          <h3 className="text-2xl font-semibold text-primary">Escalations & ownership</h3>
          <p className="text-sm text-slate-600">
            Control who Fixnado calls for operations, compliance, finance, and after-hours support. Primary contacts are surfaced first.
          </p>
        </div>
        <Button type="button" variant="secondary" icon={PlusIcon} onClick={onCreate}>
          Add contact
        </Button>
      </div>

      <FormStatus status={status} />

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
          <Spinner className="h-5 w-5" /> Loading contacts…
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/40 p-6 text-sm text-slate-500">
          No contacts yet. Add your operations and escalation leads so customers and Fixnado support can reach the right person instantly.
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}

ContactsPanel.propTypes = {
  contacts: PropTypes.arrayOf(contactShape).isRequired,
  loading: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  }),
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

ContactsPanel.defaultProps = {
  loading: false,
  status: null
};

export default ContactsPanel;
