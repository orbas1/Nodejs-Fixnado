import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, FormField, Modal, SegmentedControl, TextInput } from '../../components/ui/index.js';
import { EMPTY_PACKAGE } from './constants.js';
import { ensureCurrency } from './utils.js';

function SubscriptionPackageModal({ open, initialValue, onClose, onSubmit, onDelete }) {
  const [draft, setDraft] = useState(initialValue ?? EMPTY_PACKAGE);

  useEffect(() => {
    if (!open) return;
    setDraft({
      ...EMPTY_PACKAGE,
      ...initialValue,
      billingInterval: initialValue?.billingInterval ?? 'month'
    });
  }, [initialValue, open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...draft,
      priceCurrency: ensureCurrency(draft.priceCurrency)
    });
  };

  const handleChange = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleCheckbox = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.checked }));
  };

  const footer = (
    <>
      {onDelete ? (
        <Button type="button" variant="ghost" onClick={onDelete}>
          Delete package
        </Button>
      ) : null}
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" form="subscription-package-form">
        Save package
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subscription package"
      description="Curate monetisable bundles with pricing, trials, and gated capabilities."
      size="lg"
      footer={footer}
    >
      <form id="subscription-package-form" className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Package ID"
            value={draft.id}
            onChange={handleChange('id')}
            hint="Optional explicit identifier. Leave blank to auto-generate from the name."
          />
          <TextInput label="Display name" value={draft.label} onChange={handleChange('label')} />
        </div>
        <FormField id="package-description" label="Marketing description" optionalLabel="optional">
          <textarea
            id="package-description"
            className="fx-textarea"
            value={draft.description}
            onChange={handleChange('description')}
            placeholder="Position the package for your providers."
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Price"
            type="number"
            min="0"
            step="0.01"
            value={draft.priceAmount}
            onChange={handleChange('priceAmount')}
          />
          <TextInput
            label="Currency"
            value={draft.priceCurrency}
            onChange={(event) => setDraft((current) => ({ ...current, priceCurrency: event.target.value.toUpperCase() }))}
          />
          <TextInput label="Badge" value={draft.badge} onChange={handleChange('badge')} optionalLabel="optional" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Billing interval</p>
            <SegmentedControl
              name="Billing interval"
              value={draft.billingInterval}
              onChange={(value) => setDraft((current) => ({ ...current, billingInterval: value }))}
              options={[
                { value: 'week', label: 'Weekly' },
                { value: 'month', label: 'Monthly' },
                { value: 'year', label: 'Yearly' }
              ]}
              size="sm"
            />
          </div>
          <TextInput
            label="Interval frequency"
            type="number"
            min="1"
            max="52"
            value={draft.billingFrequency}
            onChange={handleChange('billingFrequency')}
            hint="Number of intervals per charge (e.g. 3 for quarterly if monthly interval)."
          />
          <TextInput
            label="Trial days"
            type="number"
            min="0"
            max="90"
            value={draft.trialDays}
            onChange={handleChange('trialDays')}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Support URL"
            value={draft.supportUrl}
            onChange={handleChange('supportUrl')}
            optionalLabel="optional"
          />
          <TextInput
            label="Image URL"
            value={draft.imageUrl}
            onChange={handleChange('imageUrl')}
            optionalLabel="optional"
          />
        </div>
        <FormField id="package-features" label="Included capabilities" optionalLabel="optional">
          <textarea
            id="package-features"
            className="fx-textarea"
            value={draft.featuresText}
            onChange={handleChange('featuresText')}
            placeholder="e.g. Calendar sync, Smart quoting, AI proposals"
          />
        </FormField>
        <FormField id="package-roles" label="Allowed roles" optionalLabel="optional">
          <textarea
            id="package-roles"
            className="fx-textarea"
            value={draft.roleAccessText}
            onChange={handleChange('roleAccessText')}
            placeholder="Comma separated roles that can purchase or assign this plan"
          />
        </FormField>
        <Checkbox
          label="Mark as featured"
          description="Featured packages are surfaced first across marketing surfaces and upgrade prompts."
          checked={draft.highlight}
          onChange={handleCheckbox('highlight')}
        />
      </form>
    </Modal>
  );
}

SubscriptionPackageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  initialValue: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
    priceAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    priceCurrency: PropTypes.string,
    billingInterval: PropTypes.oneOf(['week', 'month', 'year']),
    billingFrequency: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    trialDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    badge: PropTypes.string,
    imageUrl: PropTypes.string,
    featuresText: PropTypes.string,
    roleAccessText: PropTypes.string,
    highlight: PropTypes.bool,
    supportUrl: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

SubscriptionPackageModal.defaultProps = {
  onDelete: undefined,
  initialValue: EMPTY_PACKAGE
};

export default SubscriptionPackageModal;
