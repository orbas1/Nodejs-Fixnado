import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

function normaliseZones(selectedZones = []) {
  const map = new Map();
  selectedZones.forEach((zone) => {
    if (!zone.zoneId) return;
    map.set(zone.zoneId, { zoneId: zone.zoneId, isPrimary: Boolean(zone.isPrimary) });
  });
  return map;
}

export default function ServicemanZonesForm({
  zones,
  selectedZones,
  onChange,
  onSave,
  disabled,
  saving,
  message,
  error
}) {
  const selections = normaliseZones(selectedZones);
  const primaryZoneId = Array.from(selections.values()).find((entry) => entry.isPrimary)?.zoneId ?? null;

  const handleToggle = (zoneId, checked) => {
    const next = new Map(selections);
    if (checked) {
      next.set(zoneId, { zoneId, isPrimary: primaryZoneId === zoneId });
    } else {
      next.delete(zoneId);
    }
    onChange(Array.from(next.values()));
  };

  const handlePrimary = (zoneId) => {
    const next = new Map(selections);
    if (!next.has(zoneId)) {
      next.set(zoneId, { zoneId, isPrimary: true });
    }
    next.forEach((entry, key) => {
      next.set(key, { zoneId: entry.zoneId, isPrimary: key === zoneId });
    });
    onChange(Array.from(next.values()));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Coverage zones</h4>
        {message ? <StatusPill tone="success">{message}</StatusPill> : null}
      </div>
      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
      <div className={`space-y-3 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {zones.length === 0 ? (
          <p className="text-xs text-slate-500">No service zones configured for this provider.</p>
        ) : null}
        <ul className="space-y-2">
          {zones.map((zone) => {
            const selected = selections.has(zone.id);
            const isPrimary = selected && selections.get(zone.id)?.isPrimary;
            return (
              <li
                key={zone.id}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                  selected ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <p className="font-semibold text-primary">{zone.name}</p>
                  <p className="text-xs text-slate-500">{zone.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    label="Active"
                    checked={selected}
                    onChange={(event) => handleToggle(zone.id, event.target.checked)}
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="radio"
                      name="primary-zone"
                      className="h-4 w-4"
                      disabled={!selected}
                      checked={Boolean(isPrimary)}
                      onChange={() => handlePrimary(zone.id)}
                    />
                    Primary
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-end">
          <Button type="button" size="sm" variant="primary" loading={saving} onClick={onSave}>
            Save zones
          </Button>
        </div>
        {disabled ? (
          <p className="text-xs text-slate-500">Create the serviceman before managing zone coverage.</p>
        ) : null}
      </div>
    </div>
  );
}

ServicemanZonesForm.propTypes = {
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string
    })
  ).isRequired,
  selectedZones: PropTypes.arrayOf(
    PropTypes.shape({
      zoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      isPrimary: PropTypes.bool
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  saving: PropTypes.bool,
  message: PropTypes.string,
  error: PropTypes.string
};

ServicemanZonesForm.defaultProps = {
  disabled: false,
  saving: false,
  message: null,
  error: null
};
