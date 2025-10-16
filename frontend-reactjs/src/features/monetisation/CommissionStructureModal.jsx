import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Checkbox,
  FormField,
  Modal,
  SegmentedControl,
  TextInput
} from '../../components/ui/index.js';
import { EMPTY_STRUCTURE } from './constants.js';
import { ensureCurrency } from './utils.js';

function CommissionStructureModal({ open, initialValue, onClose, onSubmit, onDelete, baseRatePercent }) {
  const [draft, setDraft] = useState(initialValue ?? EMPTY_STRUCTURE);

  useEffect(() => {
    if (!open) return;
    setDraft({
      ...EMPTY_STRUCTURE,
      ...initialValue,
      ratePercent:
        initialValue?.ratePercent !== undefined ? Number(initialValue.ratePercent) : baseRatePercent ?? 0,
      rateType: initialValue?.rateType === 'flat' ? 'flat' : 'percentage'
    });
  }, [initialValue, open, baseRatePercent]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...draft,
      currency: ensureCurrency(draft.currency)
    });
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleCheckbox = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.checked }));
  };

  const footer = (
    <>
      {onDelete ? (
        <Button type="button" variant="ghost" onClick={onDelete}>
          Delete structure
        </Button>
      ) : null}
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" form="commission-structure-form">
        Save structure
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Commission structure"
      description="Align bespoke partner agreements and marketplace segments with flexible commission logic."
      size="lg"
      footer={footer}
    >
      <form id="commission-structure-form" className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Structure ID"
            value={draft.id}
            onChange={handleChange('id')}
            hint="Used for API lookups and audit trails. Leave blank to auto-generate."
          />
          <TextInput
            label="Structure name"
            value={draft.name}
            onChange={handleChange('name')}
            placeholder="Standard marketplace"
          />
        </div>
        <FormField id="structure-description" label="Description" optionalLabel="optional">
          <textarea
            id="structure-description"
            className="fx-textarea"
            value={draft.description}
            onChange={handleChange('description')}
            placeholder="Explain when this structure should be used."
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Rate type</p>
            <SegmentedControl
              name="Rate type"
              value={draft.rateType}
              onChange={(value) => setDraft((current) => ({ ...current, rateType: value }))}
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'flat', label: 'Flat fee' }
              ]}
              size="sm"
            />
          </div>
          {draft.rateType === 'flat' ? (
            <TextInput
              label="Flat fee amount"
              type="number"
              min="0"
              step="0.01"
              prefix={draft.currency}
              value={draft.flatAmount}
              onChange={handleChange('flatAmount')}
              hint="Charged in the currency specified below for every booking."
            />
          ) : (
            <TextInput
              label="Commission percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              suffix="%"
              value={draft.ratePercent}
              onChange={handleChange('ratePercent')}
              hint="If blank we fall back to the global base rate."
            />
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Currency"
            value={draft.currency}
            onChange={(event) =>
              setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))
            }
            hint="ISO currency code (e.g. GBP, USD)."
          />
          <TextInput
            label="Payout delay (days)"
            type="number"
            min="0"
            max="90"
            value={draft.payoutDelayDays}
            onChange={handleChange('payoutDelayDays')}
          />
          <TextInput
            label="Image URL"
            value={draft.imageUrl}
            onChange={handleChange('imageUrl')}
            optionalLabel="optional"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Minimum booking value"
            type="number"
            min="0"
            step="0.01"
            value={draft.minBookingValue}
            onChange={handleChange('minBookingValue')}
            hint="Leave blank to apply regardless of booking size."
          />
          <TextInput
            label="Maximum booking value"
            type="number"
            min="0"
            step="0.01"
            value={draft.maxBookingValue}
            onChange={handleChange('maxBookingValue')}
            optionalLabel="optional"
          />
        </div>
        <TextInput
          label="Applies to"
          value={draft.appliesToText}
          onChange={handleChange('appliesToText')}
          hint="Comma separated identifiers (e.g. emergency, scheduled:high). Leave empty to apply everywhere."
        />
        <Checkbox label="Structure active" checked={draft.active} onChange={handleCheckbox('active')} />
      </form>
    </Modal>
  );
}

CommissionStructureModal.propTypes = {
  open: PropTypes.bool.isRequired,
  initialValue: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    rateType: PropTypes.oneOf(['percentage', 'flat']),
    ratePercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    flatAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    appliesToText: PropTypes.string,
    payoutDelayDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minBookingValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxBookingValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    active: PropTypes.bool,
    imageUrl: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  baseRatePercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

CommissionStructureModal.defaultProps = {
  onDelete: undefined,
  baseRatePercent: 0,
  initialValue: EMPTY_STRUCTURE
};

export default CommissionStructureModal;
