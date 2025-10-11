import PropTypes from 'prop-types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import TextInput from '../ui/TextInput.jsx';
import FormField from '../ui/FormField.jsx';
import Checkbox from '../ui/Checkbox.jsx';
import Button from '../ui/Button.jsx';
import './explorer.css';

const demandOptions = [
  { value: 'high', label: 'High demand', description: 'Priority staffing required, high job volume' },
  { value: 'medium', label: 'Balanced', description: 'Stable workload with standard SLA adherence' },
  { value: 'low', label: 'Emerging', description: 'Lower utilisation, growth opportunity' }
];

const availabilityOptions = [
  { value: 'any', label: 'Any availability' },
  { value: 'rent', label: 'Rental inventory' },
  { value: 'buy', label: 'For purchase' },
  { value: 'both', label: 'Rental & sale' }
];

export default function ExplorerFilters({ filters, onChange, onReset, zones, categories, isBusy }) {
  const handleUpdate = (next) => {
    onChange({ ...filters, ...next });
  };

  const handleDemandToggle = (value) => {
    const current = new Set(filters.demand);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }

    if (current.size === 0) {
      // Always keep at least one demand level selected
      current.add(value);
    }

    handleUpdate({ demand: Array.from(current) });
  };

  return (
    <section className="fx-explorer-filters" aria-label="Explorer filters">
      <div className="fx-explorer-filters__row">
        <TextInput
          label="Search Fixnado network"
          placeholder="Keywords, skills, company or marketplace item"
          value={filters.term}
          onChange={(event) => handleUpdate({ term: event.target.value })}
          prefix={<MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          autoComplete="off"
          data-qa="explorer-filter.search"
        />
        <SegmentedControl
          name="Result type"
          value={filters.type}
          onChange={(value) => handleUpdate({ type: value })}
          options={[
            { value: 'all', label: 'All results' },
            { value: 'services', label: 'Services' },
            { value: 'marketplace', label: 'Marketplace' }
          ]}
          qa={{ group: 'explorer-filter.type', option: 'explorer-filter.type.option' }}
        />
      </div>

      <div className="fx-explorer-filters__row fx-explorer-filters__row--secondary">
        <FormField id="explorer-zone" label="Service zone">
          <select
            id="explorer-zone"
            className="fx-select"
            value={filters.zoneId}
            onChange={(event) => handleUpdate({ zoneId: event.target.value })}
            data-qa="explorer-filter.zone"
          >
            <option value="all">All zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="explorer-availability" label="Inventory availability">
          <select
            id="explorer-availability"
            className="fx-select"
            value={filters.availability}
            onChange={(event) => handleUpdate({ availability: event.target.value })}
            data-qa="explorer-filter.availability"
          >
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="explorer-category" label="Service category" optionalLabel="Optional">
          <select
            id="explorer-category"
            className="fx-select"
            value={filters.category ?? 'all'}
            onChange={(event) => handleUpdate({ category: event.target.value === 'all' ? undefined : event.target.value })}
            data-qa="explorer-filter.category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <fieldset className="fx-explorer-filters__demand" data-qa="explorer-filter.demand">
        <legend>Zone demand focus</legend>
        <div className="fx-explorer-filters__demand-grid">
          {demandOptions.map((option) => (
            <Checkbox
              key={option.value}
              label={option.label}
              description={option.description}
              checked={filters.demand.includes(option.value)}
              onChange={() => handleDemandToggle(option.value)}
            />
          ))}
        </div>
      </fieldset>

      <div className="fx-explorer-filters__actions">
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          data-qa="explorer-filter.reset"
        >
          Reset filters
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleUpdate({ refreshToken: Date.now() })}
          disabled={isBusy}
          data-qa="explorer-filter.refresh"
        >
          Refresh results
        </Button>
      </div>
    </section>
  );
}

ExplorerFilters.propTypes = {
  filters: PropTypes.shape({
    term: PropTypes.string,
    type: PropTypes.string,
    zoneId: PropTypes.string,
    availability: PropTypes.string,
    demand: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  isBusy: PropTypes.bool
};

ExplorerFilters.defaultProps = {
  isBusy: false
};
