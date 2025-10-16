import PropTypes from 'prop-types';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import TextInput from '../../ui/TextInput.jsx';
import FormField from '../../ui/FormField.jsx';
import Checkbox from '../../ui/Checkbox.jsx';
import SegmentedControl from '../../ui/SegmentedControl.jsx';
import { PRIORITY_SEGMENTS, STATUS_OPTIONS } from './constants.js';

export default function AutomationBacklogFilters({ filters, onFiltersChange, onRefresh, onCreate }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[240px] flex-1">
        <TextInput
          id="automation-search"
          label="Search"
          placeholder="Search by name, owner, or summary"
          value={filters.search}
          onChange={(event) => onFiltersChange({ search: event.target.value })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-auto">
          <SegmentedControl
            name="Priority filter"
            value={filters.priority}
            options={PRIORITY_SEGMENTS}
            onChange={(value) => onFiltersChange({ priority: value })}
            size="sm"
          />
        </div>
        <FormField id="automation-status-filter" label="Status">
          <select
            className="fx-text-input"
            value={filters.status}
            onChange={(event) => onFiltersChange({ status: event.target.value })}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <Checkbox
          label="Include archived"
          checked={filters.includeArchived}
          onChange={(event) => onFiltersChange({ includeArchived: event.target.checked })}
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" icon={DocumentTextIcon} iconPosition="start" onClick={onRefresh}>
          Refresh
        </Button>
        <Button icon={PlusIcon} iconPosition="start" onClick={onCreate}>
          Add automation
        </Button>
      </div>
    </div>
  );
}

AutomationBacklogFilters.propTypes = {
  filters: PropTypes.shape({
    priority: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired,
    includeArchived: PropTypes.bool.isRequired
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired
};
