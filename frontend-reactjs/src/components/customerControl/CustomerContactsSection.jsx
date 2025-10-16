import PropTypes from 'prop-types';
import { PlusIcon, PencilSquareIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { InlineBanner } from './FormControls.jsx';
import ContactModal, { contactPropType } from './ContactModal.jsx';

const CustomerContactsSection = ({
  contacts,
  status,
  saving,
  onCreate,
  onEdit,
  onDelete,
  modalOpen,
  activeContact,
  onCloseModal,
  onSubmit
}) => (
  <section className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">Team contacts</h3>
        <p className="text-sm text-slate-600">Keep escalation paths current for every booking, incident, and approval.</p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90"
      >
        <PlusIcon className="h-4 w-4" /> Add contact
      </button>
    </header>
    <InlineBanner tone={status?.tone} message={status?.message} />
    {contacts.length === 0 ? (
      <div className="rounded-3xl border border-dashed border-accent/20 bg-secondary/60 p-6 text-sm text-slate-600">
        No contacts yet. Add primary and backup points of contact so crews know who to reach.
      </div>
    ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {contacts.map((contact) => (
          <article key={contact.id} className="flex h-full flex-col gap-4 rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <UserIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-primary">{contact.name}</p>
                  {contact.isPrimary ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Primary
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-600">{contact.role || 'Role not provided'}</p>
                <p className="text-xs uppercase tracking-wide text-primary/60">{contact.contactType?.replace('-', ' ')}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              {contact.email ? <p>Email: {contact.email}</p> : null}
              {contact.phone ? <p>Phone: {contact.phone}</p> : null}
              {contact.notes ? <p className="text-xs text-slate-500">{contact.notes}</p> : null}
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit(contact)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-primary hover:border-slate-300"
              >
                <PencilSquareIcon className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(contact.id)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TrashIcon className="h-4 w-4" /> Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    )}

    <ContactModal
      open={modalOpen}
      contact={activeContact}
      onClose={onCloseModal}
      onSubmit={onSubmit}
      saving={saving}
    />
  </section>
);

CustomerContactsSection.propTypes = {
  contacts: PropTypes.arrayOf(contactPropType).isRequired,
  status: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'error', 'info']),
    message: PropTypes.string
  }),
  saving: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  activeContact: contactPropType,
  onCloseModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

CustomerContactsSection.defaultProps = {
  status: null,
  saving: false,
  activeContact: null
};

export default CustomerContactsSection;
