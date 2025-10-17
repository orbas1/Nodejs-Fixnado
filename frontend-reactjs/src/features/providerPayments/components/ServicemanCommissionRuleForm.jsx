import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Select from '../../../components/ui/Select.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';

const RATE_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'flat', label: 'Flat amount' }
];

const APPROVAL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' }
];

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function ServicemanCommissionRuleForm({ initialValue, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState(() => ({
    name: initialValue.name ?? '',
    description: initialValue.description ?? '',
    appliesToRole: initialValue.appliesToRole ?? '',
    serviceCategory: initialValue.serviceCategory ?? '',
    rateType: initialValue.rateType ?? 'percentage',
    rateValue: initialValue.rateValue != null ? String(initialValue.rateValue) : '',
    minimumBookingValue:
      initialValue.minimumBookingValue != null ? String(initialValue.minimumBookingValue) : '',
    maximumCommissionValue:
      initialValue.maximumCommissionValue != null ? String(initialValue.maximumCommissionValue) : '',
    autoApply: Boolean(initialValue.autoApply),
    isDefault: Boolean(initialValue.isDefault),
    approvalStatus: initialValue.approvalStatus ?? 'draft',
    effectiveFrom: initialValue.effectiveFrom ? initialValue.effectiveFrom.slice(0, 10) : '',
    effectiveTo: initialValue.effectiveTo ? initialValue.effectiveTo.slice(0, 10) : ''
  }));

  const rateTypes = useMemo(() => RATE_TYPES, []);
  const approvalStatuses = useMemo(() => APPROVAL_STATUSES, []);

  const handleChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCheckbox = (field) => (event) => {
    const value = Boolean(event?.target?.checked);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      appliesToRole: form.appliesToRole?.trim() || null,
      serviceCategory: form.serviceCategory?.trim() || null,
      rateType: form.rateType,
      rateValue: toNumber(form.rateValue) ?? 0,
      minimumBookingValue: toNumber(form.minimumBookingValue),
      maximumCommissionValue: toNumber(form.maximumCommissionValue),
      autoApply: Boolean(form.autoApply),
      isDefault: Boolean(form.isDefault),
      approvalStatus: form.approvalStatus,
      effectiveFrom: form.effectiveFrom || null,
      effectiveTo: form.effectiveTo || null
    };

    onSubmit?.(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Rule name" htmlFor="commission-name" required>
          <TextInput
            id="commission-name"
            required
            value={form.name}
            onChange={handleChange('name')}
            placeholder="E.g. Default performance"
          />
        </FormField>
        <FormField label="Approval status" htmlFor="commission-status">
          <Select
            id="commission-status"
            value={form.approvalStatus}
            onChange={handleChange('approvalStatus')}
            options={approvalStatuses}
          />
        </FormField>
      </div>

      <FormField label="Description" htmlFor="commission-description">
        <TextArea
          id="commission-description"
          value={form.description}
          onChange={handleChange('description')}
          rows={3}
          placeholder="Summarise how this commission is applied"
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Role or crew type" htmlFor="commission-role">
          <TextInput
            id="commission-role"
            value={form.appliesToRole}
            onChange={handleChange('appliesToRole')}
            placeholder="E.g. Lead engineer"
          />
        </FormField>
        <FormField label="Service category" htmlFor="commission-category">
          <TextInput
            id="commission-category"
            value={form.serviceCategory}
            onChange={handleChange('serviceCategory')}
            placeholder="E.g. Electrical maintenance"
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Commission type" htmlFor="commission-rate-type">
          <Select
            id="commission-rate-type"
            value={form.rateType}
            onChange={handleChange('rateType')}
            options={rateTypes}
          />
        </FormField>
        <FormField label={form.rateType === 'percentage' ? 'Rate (e.g. 0.15)' : 'Flat amount'} htmlFor="commission-rate-value">
          <TextInput
            id="commission-rate-value"
            type="number"
            min="0"
            step="0.01"
            value={form.rateValue}
            onChange={handleChange('rateValue')}
            placeholder={form.rateType === 'percentage' ? '0.15' : '250'}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Minimum booking value" htmlFor="commission-min-booking">
          <TextInput
            id="commission-min-booking"
            type="number"
            min="0"
            step="0.01"
            value={form.minimumBookingValue}
            onChange={handleChange('minimumBookingValue')}
            placeholder="Optional threshold"
          />
        </FormField>
        <FormField label="Maximum commission amount" htmlFor="commission-max-commission">
          <TextInput
            id="commission-max-commission"
            type="number"
            min="0"
            step="0.01"
            value={form.maximumCommissionValue}
            onChange={handleChange('maximumCommissionValue')}
            placeholder="Optional ceiling"
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Effective from" htmlFor="commission-effective-from">
          <TextInput
            id="commission-effective-from"
            type="date"
            value={form.effectiveFrom}
            onChange={handleChange('effectiveFrom')}
          />
        </FormField>
        <FormField label="Effective to" htmlFor="commission-effective-to">
          <TextInput
            id="commission-effective-to"
            type="date"
            value={form.effectiveTo}
            onChange={handleChange('effectiveTo')}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Checkbox id="commission-auto-apply" checked={form.autoApply} onChange={handleCheckbox('autoApply')}>
          Auto-apply when bookings match this rule
        </Checkbox>
        <Checkbox id="commission-default" checked={form.isDefault} onChange={handleCheckbox('isDefault')}>
          Set as default commission rule
        </Checkbox>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {initialValue.id ? 'Save changes' : 'Create rule'}
        </Button>
      </div>
    </form>
  );
}

ServicemanCommissionRuleForm.propTypes = {
  initialValue: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    appliesToRole: PropTypes.string,
    serviceCategory: PropTypes.string,
    rateType: PropTypes.string,
    rateValue: PropTypes.number,
    minimumBookingValue: PropTypes.number,
    maximumCommissionValue: PropTypes.number,
    autoApply: PropTypes.bool,
    isDefault: PropTypes.bool,
    approvalStatus: PropTypes.string,
    effectiveFrom: PropTypes.string,
    effectiveTo: PropTypes.string
  }),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  saving: PropTypes.bool,
  error: PropTypes.string
};

ServicemanCommissionRuleForm.defaultProps = {
  initialValue: {},
  onSubmit: undefined,
  onCancel: undefined,
  saving: false,
  error: null
};
