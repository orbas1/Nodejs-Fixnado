import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { couponTemplate, couponStatusOptions, discountTypeOptions } from './constants.js';
import { CheckboxField, Field, SelectField, TextArea, TextInput } from './FormControls.jsx';
import ModalShell from './ModalShell.jsx';

const emptyCoupon = { ...couponTemplate };

const CouponModal = ({ open, coupon, onClose, onSubmit, saving }) => {
  const [form, setForm] = useState(emptyCoupon);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyCoupon, ...(coupon ?? {}) });
    }
  }, [open, coupon]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (form.discountType === 'percentage' && form.currency) {
      setForm((previous) => ({ ...previous, currency: '' }));
    }
  }, [open, form.discountType, form.currency]);

  const footer = useMemo(
    () => [
      <button
        key="cancel"
        type="button"
        onClick={onClose}
        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300"
      >
        Cancel
      </button>,
      <button
        key="save"
        type="submit"
        onClick={() => onSubmit(form)}
        disabled={saving}
        className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Saving…' : form.id ? 'Update coupon' : 'Create coupon'}
      </button>
    ],
    [onClose, onSubmit, form, saving]
  );

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={form.id ? 'Edit discount coupon' : 'Create discount coupon'}
      description="Launch targeted promotions with full control over eligibility, scheduling, and redemption safeguards."
      footer={footer}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="coupon-name"
            label="Coupon name"
            description="Displayed on invoices, receipts, and the customer workspace."
          >
            <TextInput
              id="coupon-name"
              value={form.name}
              onChange={(value) => handleChange('name', value)}
              placeholder="Spring concierge bundle"
            />
          </Field>
          <Field
            id="coupon-code"
            label="Coupon code"
            description="Share with eligible teams or auto-apply for enrolled customers."
          >
            <TextInput
              id="coupon-code"
              value={form.code}
              onChange={(value) => handleChange('code', value.replace(/\s+/g, '').toUpperCase())}
              placeholder="SPRING25"
            />
          </Field>
          <Field id="coupon-status" label="Lifecycle status">
            <SelectField
              id="coupon-status"
              value={form.status}
              onChange={(value) => handleChange('status', value)}
              options={couponStatusOptions}
            />
          </Field>
          <Field id="coupon-type" label="Discount type">
            <SelectField
              id="coupon-type"
              value={form.discountType}
              onChange={(value) => handleChange('discountType', value)}
              options={discountTypeOptions}
            />
          </Field>
          <Field
            id="coupon-value"
            label="Discount value"
            description={form.discountType === 'percentage' ? '0-100% off the subtotal.' : 'Amount removed from the subtotal.'}
          >
            <TextInput
              id="coupon-value"
              type="number"
              min="0"
              step="0.01"
              value={form.discountValue}
              onChange={(value) => handleChange('discountValue', value)}
              placeholder={form.discountType === 'percentage' ? '15' : '25'}
            />
          </Field>
          <Field
            id="coupon-currency"
            label="Currency"
            description={
              form.discountType === 'fixed'
                ? 'Currency for the fixed amount discount.'
                : 'Switch to a fixed amount to enable currency.'
            }
          >
            <TextInput
              id="coupon-currency"
              value={form.currency}
              onChange={(value) => handleChange('currency', value)}
              placeholder="GBP"
              disabled={form.discountType !== 'fixed'}
            />
          </Field>
          <Field
            id="coupon-min-order"
            label="Minimum order total"
            description="Optional threshold before the coupon applies."
          >
            <TextInput
              id="coupon-min-order"
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderTotal}
              onChange={(value) => handleChange('minOrderTotal', value)}
              placeholder="150"
            />
          </Field>
          <Field id="coupon-start" label="Start date">
            <TextInput
              id="coupon-start"
              type="date"
              value={form.startsAt}
              onChange={(value) => handleChange('startsAt', value)}
            />
          </Field>
          <Field id="coupon-end" label="End date">
            <TextInput
              id="coupon-end"
              type="date"
              value={form.expiresAt}
              onChange={(value) => handleChange('expiresAt', value)}
            />
          </Field>
          <Field
            id="coupon-max-uses"
            label="Total redemptions"
            description="Leave blank for unlimited use."
          >
            <TextInput
              id="coupon-max-uses"
              type="number"
              min="1"
              value={form.maxRedemptions}
              onChange={(value) => handleChange('maxRedemptions', value)}
              placeholder="100"
            />
          </Field>
          <Field
            id="coupon-per-user"
            label="Per-customer limit"
            description="Prevent the same customer redeeming repeatedly."
          >
            <TextInput
              id="coupon-per-user"
              type="number"
              min="1"
              value={form.maxRedemptionsPerCustomer}
              onChange={(value) => handleChange('maxRedemptionsPerCustomer', value)}
              placeholder="1"
            />
          </Field>
        </div>

        <CheckboxField
          id="coupon-auto-apply"
          checked={form.autoApply}
          onChange={(value) => handleChange('autoApply', value)}
          label="Automatically apply for eligible bookings"
          description="Apply this discount when the booking matches the configured thresholds."
        />

        <Field
          id="coupon-description"
          label="Customer-facing description"
          description="Displayed anywhere the coupon is promoted."
        >
          <TextArea
            id="coupon-description"
            rows={3}
            value={form.description}
            onChange={(value) => handleChange('description', value)}
            placeholder="Rewarding proactive maintenance scheduling with 25% off engineering visits."
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="coupon-terms"
            label="Terms link"
            description="Optional URL with detailed eligibility criteria."
          >
            <TextInput
              id="coupon-terms"
              value={form.termsUrl}
              onChange={(value) => handleChange('termsUrl', value)}
              placeholder="https://fixnado.com/legal/spring-promo"
            />
          </Field>
          <Field
            id="coupon-image"
            label="Promo image"
            description="Wide image for dashboards, exported proposals, and email headers."
          >
            <TextInput
              id="coupon-image"
              value={form.imageUrl}
              onChange={(value) => handleChange('imageUrl', value)}
              placeholder="https://cdn.fixnado.com/assets/coupons/spring.jpg"
            />
          </Field>
        </div>

        <Field
          id="coupon-notes"
          label="Internal notes"
          description="Audit trail for finance, sales, and customer success teams."
        >
          <TextArea
            id="coupon-notes"
            rows={3}
            value={form.internalNotes}
            onChange={(value) => handleChange('internalNotes', value)}
            placeholder="Finance approved £15k budget. Auto-apply for enterprise concierge customers only."
          />
        </Field>
      </form>
    </ModalShell>
  );
};

const couponPropType = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  code: PropTypes.string,
  description: PropTypes.string,
  discountType: PropTypes.oneOf(['percentage', 'fixed']),
  discountValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currency: PropTypes.string,
  minOrderTotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  startsAt: PropTypes.string,
  expiresAt: PropTypes.string,
  maxRedemptions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxRedemptionsPerCustomer: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  autoApply: PropTypes.bool,
  status: PropTypes.string,
  imageUrl: PropTypes.string,
  termsUrl: PropTypes.string,
  internalNotes: PropTypes.string
});

CouponModal.propTypes = {
  open: PropTypes.bool.isRequired,
  coupon: couponPropType,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

CouponModal.defaultProps = {
  coupon: null,
  saving: false
};

export default CouponModal;
export { couponPropType };
