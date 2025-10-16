import PropTypes from 'prop-types';
import { TextInput } from '../../ui/index.js';

export default function AddressSettingsForm({ values, onChange }) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Postal address</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Address line 1" value={values.line1} onChange={(event) => onChange('line1', event.target.value)} />
        <TextInput label="Address line 2" value={values.line2} onChange={(event) => onChange('line2', event.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="City" value={values.city} onChange={(event) => onChange('city', event.target.value)} />
        <TextInput label="State / Region" value={values.state} onChange={(event) => onChange('state', event.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Postal code" value={values.postalCode} onChange={(event) => onChange('postalCode', event.target.value)} />
        <TextInput label="Country" value={values.country} onChange={(event) => onChange('country', event.target.value)} />
      </div>
    </section>
  );
}

AddressSettingsForm.propTypes = {
  values: PropTypes.shape({
    line1: PropTypes.string,
    line2: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    postalCode: PropTypes.string,
    country: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired
};
