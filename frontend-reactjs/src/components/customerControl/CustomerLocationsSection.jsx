import PropTypes from 'prop-types';
import { MapPinIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { InlineBanner } from './FormControls.jsx';
import LocationModal, { locationPropType } from './LocationModal.jsx';

const CustomerLocationsSection = ({
  locations,
  status,
  saving,
  onCreate,
  onEdit,
  onDelete,
  modalOpen,
  activeLocation,
  onCloseModal,
  onSubmit
}) => (
  <section className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">Service locations</h3>
        <p className="text-sm text-slate-600">Document entrances, access notes, and primary work sites for crews.</p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90"
      >
        <PlusIcon className="h-4 w-4" /> Add location
      </button>
    </header>
    <InlineBanner tone={status?.tone} message={status?.message} />
    {locations.length === 0 ? (
      <div className="rounded-3xl border border-dashed border-accent/20 bg-secondary/60 p-6 text-sm text-slate-600">
        No service locations recorded yet. Add sites so crews know where to attend and how to gain access.
      </div>
    ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {locations.map((location) => (
          <article key={location.id} className="flex h-full flex-col gap-4 rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-primary">{location.label || 'Service location'}</p>
                  <p className="text-sm text-slate-600">
                    {[location.addressLine1, location.addressLine2, location.city, location.region, location.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-primary/60">{location.country || 'Country unknown'}</p>
                </div>
              </div>
              {location.isPrimary ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Primary
                </span>
              ) : null}
            </div>
            {location.accessNotes ? (
              <p className="text-xs text-slate-500">{location.accessNotes}</p>
            ) : null}
            <div className="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit(location)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-primary hover:border-slate-300"
              >
                <PencilSquareIcon className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(location.id)}
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

    <LocationModal
      open={modalOpen}
      location={activeLocation}
      onClose={onCloseModal}
      onSubmit={onSubmit}
      saving={saving}
    />
  </section>
);

CustomerLocationsSection.propTypes = {
  locations: PropTypes.arrayOf(locationPropType).isRequired,
  status: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'error', 'info']),
    message: PropTypes.string
  }),
  saving: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  activeLocation: locationPropType,
  onCloseModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

CustomerLocationsSection.defaultProps = {
  status: null,
  saving: false,
  activeLocation: null
};

export default CustomerLocationsSection;
