import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Select from '../../../components/ui/Select.jsx';

const PAYMENT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const COMMISSION_RATE_TYPES = [
  { value: 'percentage', label: 'Percentage of payment' },
  { value: 'flat', label: 'Flat amount' }
];

function coerceNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ServicemanPaymentForm({ initialValue, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState(() => ({
    servicemanName: initialValue.serviceman?.name ?? '',
    servicemanRole: initialValue.serviceman?.role ?? '',
    servicemanId: initialValue.serviceman?.id ?? '',
    bookingId: initialValue.booking?.id ?? initialValue.booking?.reference ?? '',
    amount: initialValue.amount != null ? String(initialValue.amount) : '',
    currency: initialValue.currency ?? 'GBP',
    status: initialValue.status ?? 'scheduled',
    dueDate: initialValue.dueDate ? initialValue.dueDate.slice(0, 10) : '',
    paidAt: initialValue.paidAt ? initialValue.paidAt.slice(0, 10) : '',
    commissionRuleId: initialValue.commissionRule?.id ?? '',
    commissionRate:
      initialValue.commissionRate != null ? String(initialValue.commissionRate) : '',
    commissionAmount:
      initialValue.commissionAmount != null ? String(initialValue.commissionAmount) : '',
    commissionRateType: initialValue.commissionRule?.rateType ?? 'percentage',
    notes: initialValue.notes ?? ''
  }));

  const statusOptions = useMemo(() => PAYMENT_STATUSES, []);

  const handleChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const amount = coerceNumber(form.amount);
    if (!amount || amount <= 0) {
      return;
    }

    const trimmedServicemanId = form.servicemanId?.trim() || '';
    const bookingInput = form.bookingId?.trim() || '';
    const payload = {
      servicemanId: trimmedServicemanId || null,
      servicemanName: form.servicemanName || null,
      servicemanRole: form.servicemanRole || null,
      bookingId: bookingInput && /[0-9a-fA-F-]{36}/.test(bookingInput) ? bookingInput : null,
      bookingReference: bookingInput || null,
      amount,
      currency: form.currency?.toUpperCase() || 'GBP',
      status: form.status,
      dueDate: form.dueDate || null,
      paidAt: form.paidAt || null,
      commissionRuleId: form.commissionRuleId || null,
      commissionRate:
        form.commissionRateType === 'percentage'
          ? coerceNumber(form.commissionRate)
          : null,
      commissionAmount:
        form.commissionRateType === 'flat' ? coerceNumber(form.commissionAmount) : null,
      notes: form.notes || null
    };

    onSubmit?.(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Serviceman name" htmlFor="payment-serviceman-name">
          <TextInput
            id="payment-serviceman-name"
            value={form.servicemanName}
            onChange={handleChange('servicemanName')}
            placeholder="e.g. Amina Khan"
          />
        </FormField>
        <FormField label="Serviceman role" htmlFor="payment-serviceman-role">
          <TextInput
            id="payment-serviceman-role"
            value={form.servicemanRole}
            onChange={handleChange('servicemanRole')}
            placeholder="Lead engineer"
          />
        </FormField>
        <FormField label="Serviceman ID" htmlFor="payment-serviceman-id">
          <TextInput
            id="payment-serviceman-id"
            value={form.servicemanId}
            onChange={handleChange('servicemanId')}
            placeholder="Optional internal ID"
          />
        </FormField>
        <FormField label="Booking reference" htmlFor="payment-booking-id">
          <TextInput
            id="payment-booking-id"
            value={form.bookingId}
            onChange={handleChange('bookingId')}
            placeholder="Linked booking ID"
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Payment amount" htmlFor="payment-amount" helper="Enter the amount before commission deductions.">
          <TextInput
            id="payment-amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={handleChange('amount')}
          />
        </FormField>
        <FormField label="Currency" htmlFor="payment-currency">
          <TextInput
            id="payment-currency"
            value={form.currency}
            onChange={handleChange('currency')}
            placeholder="GBP"
            maxLength={3}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Payment status" htmlFor="payment-status">
          <Select
            id="payment-status"
            value={form.status}
            onChange={handleChange('status')}
            options={statusOptions}
          />
        </FormField>
        <FormField label="Due date" htmlFor="payment-due-date">
          <TextInput
            id="payment-due-date"
            type="date"
            value={form.dueDate}
            onChange={handleChange('dueDate')}
          />
        </FormField>
        <FormField label="Paid date" htmlFor="payment-paid-at">
          <TextInput
            id="payment-paid-at"
            type="date"
            value={form.paidAt}
            onChange={handleChange('paidAt')}
          />
        </FormField>
        <FormField label="Commission rule ID" htmlFor="payment-commission-rule">
          <TextInput
            id="payment-commission-rule"
            value={form.commissionRuleId}
            onChange={handleChange('commissionRuleId')}
            placeholder="Optional rule ID"
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Commission calculation" htmlFor="payment-commission-type">
          <Select
            id="payment-commission-type"
            value={form.commissionRateType}
            onChange={handleChange('commissionRateType')}
            options={COMMISSION_RATE_TYPES}
          />
        </FormField>
        {form.commissionRateType === 'percentage' ? (
          <FormField
            label="Commission rate"
            htmlFor="payment-commission-rate"
            helper="Expressed as a decimal (e.g. 0.15 for 15%)."
          >
            <TextInput
              id="payment-commission-rate"
              type="number"
              min="0"
              step="0.01"
              value={form.commissionRate}
              onChange={handleChange('commissionRate')}
              placeholder="0.15"
            />
          </FormField>
        ) : (
          <FormField
            label="Commission amount"
            htmlFor="payment-commission-amount"
            helper="Flat amount paid regardless of job value."
          >
            <TextInput
              id="payment-commission-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.commissionAmount}
              onChange={handleChange('commissionAmount')}
              placeholder="250"
            />
          </FormField>
        )}
      </div>

      <FormField label="Payment notes" htmlFor="payment-notes">
        <TextArea
          id="payment-notes"
          value={form.notes}
          onChange={handleChange('notes')}
          rows={3}
          placeholder="Add operational notes or release criteria"
        />
      </FormField>

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
          {initialValue.id ? 'Save changes' : 'Create payment'}
        </Button>
      </div>
    </form>
  );
}

ServicemanPaymentForm.propTypes = {
  initialValue: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amount: PropTypes.number,
    currency: PropTypes.string,
    status: PropTypes.string,
    dueDate: PropTypes.string,
    paidAt: PropTypes.string,
    notes: PropTypes.string,
    commissionRate: PropTypes.number,
    commissionAmount: PropTypes.number,
    commissionRule: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      rateType: PropTypes.string
    }),
    booking: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }),
    serviceman: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      role: PropTypes.string
    })
  }),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  saving: PropTypes.bool,
  error: PropTypes.string
};

ServicemanPaymentForm.defaultProps = {
  initialValue: {},
  onSubmit: undefined,
  onCancel: undefined,
  saving: false,
  error: null
};

