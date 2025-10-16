import PropTypes from 'prop-types';
import { Card, Checkbox, FormField, TextInput } from '../../../components/ui/index.js';

function CoverageSection({ outOfOffice, onToggle, onFieldChange, onDateChange }) {
  return (
    <Card className="space-y-6" padding="lg">
      <div>
        <h2 className="text-xl font-semibold text-primary">Out of office &amp; coverage</h2>
        <p className="mt-1 text-sm text-slate-600">
          Coordinate absence windows and route incidents to your delegated responders.
        </p>
      </div>
      <div className="space-y-4">
        <Checkbox
          label="Enable out of office coverage"
          description="Mirror escalations to a delegate while you are unavailable."
          checked={outOfOffice.enabled}
          onChange={onToggle}
        />
        <FormField
          id="coverage-message"
          label="Coverage message"
          hint="Shared with incident responders so they understand your availability."
        >
          <textarea
            id="coverage-message"
            className="fx-text-input min-h-[120px]"
            value={outOfOffice.message}
            onChange={(event) => onFieldChange('message', event.target.value)}
            disabled={!outOfOffice.enabled}
            maxLength={1000}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="coverage-start" label="Coverage starts">
            <input
              id="coverage-start"
              type="datetime-local"
              className="fx-text-input"
              value={outOfOffice.handoverStart}
              onChange={(event) => onDateChange('handoverStart', event.target.value)}
              disabled={!outOfOffice.enabled}
            />
          </FormField>
          <FormField id="coverage-end" label="Coverage ends">
            <input
              id="coverage-end"
              type="datetime-local"
              className="fx-text-input"
              value={outOfOffice.handoverEnd}
              onChange={(event) => onDateChange('handoverEnd', event.target.value)}
              disabled={!outOfOffice.enabled}
            />
          </FormField>
        </div>
        <TextInput
          label="Delegate email"
          type="email"
          value={outOfOffice.delegateEmail}
          onChange={(event) => onFieldChange('delegateEmail', event.target.value)}
          disabled={!outOfOffice.enabled}
          hint="Delegated admin receiving notifications during your absence"
        />
      </div>
    </Card>
  );
}

CoverageSection.propTypes = {
  outOfOffice: PropTypes.shape({
    enabled: PropTypes.bool,
    message: PropTypes.string,
    handoverStart: PropTypes.string,
    handoverEnd: PropTypes.string,
    delegateEmail: PropTypes.string
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onDateChange: PropTypes.func.isRequired
};

export default CoverageSection;
