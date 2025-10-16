import PropTypes from 'prop-types';
import { Checkbox } from '../../ui/index.js';

export default function NotificationPreferencesForm({ values, items, onChange }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Notification policies</h3>
          <p className="text-sm text-slate-600">
            Decide how urgent workflows, approvals, and escalations reach the control tower.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Checkbox
            key={item.id}
            label={item.label}
            description={item.description}
            checked={Boolean(values[item.id])}
            onChange={(event) => onChange(item.id, event.target.checked)}
          />
        ))}
      </div>
    </section>
  );
}

NotificationPreferencesForm.propTypes = {
  values: PropTypes.object.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired
};
