import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';

function PricingManager({ asset, onCreate, onUpdate, onDelete, loading }) {
  const [form, setForm] = useState({
    name: '',
    durationDays: '1',
    price: '',
    currency: asset?.rentalRateCurrency || 'GBP',
    depositAmount: ''
  });
  const [editingId, setEditingId] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAdd = (event) => {
    event.preventDefault();
    if (!form.name) return;
    const payload = {
      name: form.name,
      durationDays: form.durationDays ? Number.parseInt(form.durationDays, 10) : 1,
      price: form.price ? Number.parseFloat(form.price) : 0,
      currency: form.currency || asset?.rentalRateCurrency || 'GBP',
      depositAmount: form.depositAmount ? Number.parseFloat(form.depositAmount) : null
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onCreate(payload);
    }

    setForm((current) => ({
      ...current,
      name: '',
      durationDays: '1',
      price: '',
      currency: asset?.rentalRateCurrency || 'GBP',
      depositAmount: ''
    }));
    setEditingId(null);
  };

  const handleEdit = (tier) => {
    setEditingId(tier.id);
    setForm({
      name: tier.name || '',
      durationDays: tier.durationDays != null ? String(tier.durationDays) : '1',
      price: tier.price != null ? String(tier.price) : '',
      currency: tier.currency || asset?.rentalRateCurrency || 'GBP',
      depositAmount: tier.depositAmount != null ? String(tier.depositAmount) : ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      name: '',
      durationDays: '1',
      price: '',
      currency: asset?.rentalRateCurrency || 'GBP',
      depositAmount: ''
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary">Pricing programmes</h3>
          <p className="text-sm text-slate-500">Define day-rate tiers, deposits, and hire bundles for this tool.</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-5">
          <FormField id="pricing-name" label="Name">
            <input
              id="pricing-name"
              name="name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={form.name}
              onChange={handleChange}
              placeholder="Weekend hire"
              required
            />
          </FormField>
          <FormField id="pricing-duration" label="Days">
            <input
              id="pricing-duration"
              name="durationDays"
              type="number"
              min="1"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={form.durationDays}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="pricing-price" label="Price">
            <input
              id="pricing-price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={form.price}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="pricing-currency" label="Currency">
            <input
              id="pricing-currency"
              name="currency"
              maxLength={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase"
              value={form.currency}
              onChange={handleChange}
            />
          </FormField>
          <FormField id="pricing-deposit" label="Deposit" optionalLabel="Optional">
            <input
              id="pricing-deposit"
              name="depositAmount"
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              value={form.depositAmount}
              onChange={handleChange}
            />
          </FormField>
          <div className="flex flex-wrap gap-3 md:col-span-5">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Saving…' : editingId ? 'Update tier' : 'Add pricing tier'}
            </Button>
            {editingId ? (
              <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Programme</th>
                <th className="px-4 py-3 text-left">Days</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Deposit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/50">
              {asset?.pricingTiers?.length ? (
                asset.pricingTiers.map((tier) => (
                  <tr key={tier.id}>
                    <td className="px-4 py-3 font-medium text-primary">{tier.name}</td>
                    <td className="px-4 py-3">{tier.durationDays}</td>
                    <td className="px-4 py-3">
                      {tier.currency} {tier.price?.toFixed?.(2) ?? tier.price}
                    </td>
                    <td className="px-4 py-3">
                      {tier.depositAmount != null ? `${tier.currency} ${tier.depositAmount}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="xs" variant="ghost" onClick={() => handleEdit(tier)}>
                          Edit
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => onDelete(tier.id)}>
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                    No pricing tiers defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

PricingManager.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.string,
    pricingTiers: PropTypes.array
  }),
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

PricingManager.defaultProps = {
  asset: null,
  loading: false
};

export default PricingManager;
