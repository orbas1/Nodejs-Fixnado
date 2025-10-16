import PropTypes from 'prop-types';
import SectionCard from './SectionCard.jsx';

function EquipmentAssignmentsForm({ items, onItemChange, onAddItem, onRemoveItem, onSubmit, saving, status }) {
  return (
    <SectionCard
      title="Issued equipment"
      description="Track safety gear, calibrated tools, and shared assets currently assigned to you."
      onSubmit={onSubmit}
      saving={saving}
      status={status}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          These assignments sync with provider asset management. Keep them up to date so maintenance and audits stay compliant.
        </p>
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent"
        >
          Add equipment
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-accent/20 px-4 py-6 text-sm text-slate-500">
            No equipment logged. Add PPE, access fobs, or specialist tools so leadership can track inspections and replacements.
          </p>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-accent/10 bg-white p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                  <input
                    type="text"
                    value={item.name}
                    onChange={(event) => onItemChange(index, 'name', event.target.value)}
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    placeholder="e.g. Respirator set"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                  <input
                    type="text"
                    value={item.status ?? ''}
                    onChange={(event) => onItemChange(index, 'status', event.target.value)}
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    placeholder="Ready, In field, Inspection due"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Serial number
                  <input
                    type="text"
                    value={item.serialNumber ?? ''}
                    onChange={(event) => onItemChange(index, 'serialNumber', event.target.value)}
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    placeholder="Asset ID"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assigned on
                  <input
                    type="date"
                    value={item.assignedOn ?? ''}
                    onChange={(event) => onItemChange(index, 'assignedOn', event.target.value)}
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
                <textarea
                  value={item.notes ?? ''}
                  onChange={(event) => onItemChange(index, 'notes', event.target.value)}
                  rows={2}
                  className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                  placeholder="Calibration requirements, storage instructions, etc."
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="text-xs font-semibold text-rose-600 transition hover:text-rose-800"
                >
                  Remove equipment
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

EquipmentAssignmentsForm.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      status: PropTypes.string,
      serialNumber: PropTypes.string,
      assignedOn: PropTypes.string,
      notes: PropTypes.string
    })
  ).isRequired,
  onItemChange: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

EquipmentAssignmentsForm.defaultProps = {
  saving: false,
  status: null
};

export default EquipmentAssignmentsForm;
