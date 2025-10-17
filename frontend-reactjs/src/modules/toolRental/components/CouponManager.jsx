import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';

const STATUS_OPTIONS = ['draft', 'scheduled', 'active', 'expired', 'disabled'];

function CouponManager({ assets, coupons, onCreate, onUpdate, onDelete, loading }) {
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '10',
    currency: 'GBP',
    assetId: '',
    maxRedemptions: '',
    perCustomerLimit: '',
    validFrom: '',
    validUntil: '',
    status: 'draft'
  });
  const [editingId, setEditingId] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '10',
      currency: 'GBP',
      assetId: '',
      maxRedemptions: '',
      perCustomerLimit: '',
      validFrom: '',
      validUntil: '',
      status: 'draft'
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      code: form.code,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: form.discountValue ? Number.parseFloat(form.discountValue) : 0,
      currency: form.currency || 'GBP',
      assetId: form.assetId || undefined,
      maxRedemptions: form.maxRedemptions ? Number.parseInt(form.maxRedemptions, 10) : null,
      perCustomerLimit: form.perCustomerLimit ? Number.parseInt(form.perCustomerLimit, 10) : null,
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      status: form.status
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onCreate(payload);
    }

    resetForm();
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue != null ? String(coupon.discountValue) : '0',
      currency: coupon.currency || 'GBP',
      assetId: coupon.assetId || '',
      maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : '',
      perCustomerLimit: coupon.perCustomerLimit != null ? String(coupon.perCustomerLimit) : '',
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : '',
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : '',
      status: coupon.status || 'draft'
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary">Coupons & campaigns</h3>
          <p className="text-sm text-slate-500">
            Issue promotional codes tied to specific tools or make them globally redeemable.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-3">
        <FormField id="coupon-code" label="Code">
          <input
            id="coupon-code"
            name="code"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase"
            value={form.code}
            onChange={handleChange}
            required
          />
        </FormField>
        <FormField id="coupon-discount-type" label="Discount type">
          <select
            id="coupon-discount-type"
            name="discountType"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.discountType}
            onChange={handleChange}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </FormField>
        <FormField id="coupon-discount-value" label="Discount value">
          <input
            id="coupon-discount-value"
            name="discountValue"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.discountValue}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="coupon-currency" label="Currency" optionalLabel="Optional">
          <input
            id="coupon-currency"
            name="currency"
            maxLength={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase"
            value={form.currency}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="coupon-asset" label="Linked tool" optionalLabel="Optional">
          <select
            id="coupon-asset"
            name="assetId"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.assetId}
            onChange={handleChange}
          >
            <option value="">All tools</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="coupon-max" label="Max redemptions" optionalLabel="Optional">
          <input
            id="coupon-max"
            name="maxRedemptions"
            type="number"
            min="0"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.maxRedemptions}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="coupon-per-customer" label="Per customer limit" optionalLabel="Optional">
          <input
            id="coupon-per-customer"
            name="perCustomerLimit"
            type="number"
            min="0"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.perCustomerLimit}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="coupon-valid-from" label="Valid from" optionalLabel="Optional">
          <input
            id="coupon-valid-from"
            name="validFrom"
            type="date"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.validFrom}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="coupon-valid-until" label="Valid until" optionalLabel="Optional">
          <input
            id="coupon-valid-until"
            name="validUntil"
            type="date"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.validUntil}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="coupon-status" label="Status">
          <select
            id="coupon-status"
            name="status"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.status}
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="coupon-description" label="Description" optionalLabel="Optional" className="md:col-span-3">
          <textarea
            id="coupon-description"
            name="description"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.description}
            onChange={handleChange}
          />
        </FormField>
        <div className="flex flex-wrap gap-3 md:col-span-3">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Saving…' : editingId ? 'Update coupon' : 'Create coupon'}
          </Button>
          {editingId ? (
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Value</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/60">
            {coupons.length ? (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3 font-medium text-primary">{coupon.code}</td>
                  <td className="px-4 py-3">{coupon.discountType}</td>
                  <td className="px-4 py-3">
                    {coupon.discountValue}
                    {coupon.discountType === 'percentage' ? '%' : ` ${coupon.currency || ''}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                      {coupon.status?.replace(/_/g, ' ') || 'draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="xs" variant="ghost" onClick={() => handleEdit(coupon)}>
                        Edit
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => onDelete(coupon.id)}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                  No coupons have been issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

CouponManager.propTypes = {
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  coupons: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      discountType: PropTypes.string,
      discountValue: PropTypes.number,
      currency: PropTypes.string,
      status: PropTypes.string,
      assetId: PropTypes.string
    })
  ),
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

CouponManager.defaultProps = {
  assets: [],
  coupons: [],
  loading: false
};

export default CouponManager;
