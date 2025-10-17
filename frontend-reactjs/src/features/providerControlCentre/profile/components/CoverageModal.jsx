import PropTypes from 'prop-types';
import { Button, Modal, TextInput, Textarea } from '../../../../components/ui/index.js';
import FormStatus from './FormStatus.jsx';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function titleForMode(mode) {
  return mode === 'edit' ? 'Edit coverage' : 'Add coverage';
}

function CoverageModal({
  open,
  mode,
  coverage,
  serviceZones,
  coverageTypes,
  onChange,
  onMetadataChange,
  onAddMetadata,
  onRemoveMetadata,
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
      description="Zones determine where Fixnado routes work. Ensure each SLA reflects a commitment your crews can honour."
      size="lg"
      footer={(
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="provider-coverage-form" loading={saving} disabled={saving}>
            Save coverage
          </Button>
        </div>
      )}
    >
      <form id="provider-coverage-form" className="space-y-5" onSubmit={onSubmit}>
        <FormStatus status={status} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="fx-field">
            <label htmlFor="provider-coverage-zone" className="fx-field__label">
              Service zone
            </label>
            <select
              id="provider-coverage-zone"
              className="fx-text-input"
              value={coverage.zoneId}
              onChange={(event) => onChange('zoneId', event.target.value)}
              required
            >
              <option value="">Select zone</option>
              {serviceZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.label}
                </option>
              ))}
            </select>
          </div>
          <div className="fx-field">
            <label htmlFor="provider-coverage-type" className="fx-field__label">
              Coverage type
            </label>
            <select
              id="provider-coverage-type"
              className="fx-text-input"
              value={coverage.coverageType}
              onChange={(event) => onChange('coverageType', event.target.value)}
            >
              {coverageTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="SLA minutes"
            type="number"
            min={15}
            max={1440}
            value={coverage.slaMinutes}
            onChange={(event) => onChange('slaMinutes', event.target.value)}
            required
            hint="How quickly a crew can be onsite in this zone."
          />
          <TextInput
            label="Max simultaneous jobs"
            type="number"
            min={0}
            max={1000}
            value={coverage.maxCapacity}
            onChange={(event) => onChange('maxCapacity', event.target.value)}
            required
            hint="Capacity assigned to Fixnado at any point in time."
          />
        </div>

        <Textarea
          label="Notes"
          value={coverage.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          rows={4}
          placeholder="Include standby rotation details, access requirements, or preferred crew."
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Metadata</h4>
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddMetadata}>
              Add field
            </Button>
          </div>
          {coverage.metadataEntries.length === 0 ? (
            <p className="text-sm text-slate-500">
              Add optional structured data for automation — for example escalation contacts, radio channels, or asset pools.
            </p>
          ) : (
            <div className="space-y-3">
              {coverage.metadataEntries.map((entry, index) => (
                <div
                  key={entry.id || index}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[1fr,1fr,auto]"
                >
                  <TextInput
                    label="Key"
                    value={entry.key}
                    onChange={(event) => onMetadataChange(index, 'key', event.target.value)}
                    placeholder="escalationContact"
                    required
                  />
                  <TextInput
                    label="Value"
                    value={entry.value}
                    onChange={(event) => onMetadataChange(index, 'value', event.target.value)}
                    placeholder="ops@metro-ops.co.uk"
                    required
                  />
                  <div className="flex items-end justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      icon={TrashIcon}
                      className="text-rose-600"
                      onClick={() => onRemoveMetadata(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

CoverageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  coverage: PropTypes.shape({
    id: PropTypes.string,
    zoneId: PropTypes.string,
    coverageType: PropTypes.string,
    slaMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxCapacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    notes: PropTypes.string,
    metadataEntries: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        key: PropTypes.string,
        value: PropTypes.string
      })
    )
  }).isRequired,
  serviceZones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  coverageTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  onMetadataChange: PropTypes.func.isRequired,
  onAddMetadata: PropTypes.func.isRequired,
  onRemoveMetadata: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  })
};

CoverageModal.defaultProps = {
  mode: 'create',
  saving: false,
  status: null
};

export default CoverageModal;
