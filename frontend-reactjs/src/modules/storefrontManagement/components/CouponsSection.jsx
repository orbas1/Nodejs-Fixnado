import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CalendarIcon,
  CheckIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  PlusIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

const STATUS_TONE = {
  draft: 'neutral',
  scheduled: 'info',
  active: 'success',
  expired: 'warning',
  disabled: 'danger'
};

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed amount' }
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' }
];

const INITIAL_COUPON = {
  code: '',
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderTotal: '',
  maxDiscountValue: '',
  startsAt: '',
  endsAt: '',
  usageLimit: '',
  status: 'draft',
  appliesTo: ''
};

function toDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (number) => number.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function normaliseCouponPayload(values) {
  return {
    code: values.code,
    name: values.name,
    description: values.description || undefined,
    discountType: values.discountType,
    discountValue: values.discountValue === '' ? undefined : Number(values.discountValue),
    minOrderTotal: values.minOrderTotal === '' ? null : Number(values.minOrderTotal),
    maxDiscountValue: values.maxDiscountValue === '' ? null : Number(values.maxDiscountValue),
    startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
    endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
    usageLimit: values.usageLimit === '' ? null : Number.parseInt(values.usageLimit, 10),
    status: values.status,
    appliesTo: values.appliesTo || undefined
  };
}

function CouponForm({ values, onChange, onSubmit, onCancel, submitting, submitLabel }) {
  const handleChange = (event) => {
    const { name, type, value } = event.target;
    onChange((current) => ({
      ...current,
      [name]: type === 'number' ? value : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Coupon code
          <input
            name="code"
            value={values.code}
            onChange={handleChange}
            required
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="SPRING25"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Internal name
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            required
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Spring onboarding promo"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
          Description
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={3}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Visible to the team when applying the coupon."
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Discount type
          <select
            name="discountType"
            value={values.discountType}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {DISCOUNT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Discount value
          <input
            name="discountValue"
            value={values.discountValue}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.01"
            required
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Minimum order total
          <input
            name="minOrderTotal"
            value={values.minOrderTotal}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.01"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Maximum discount value
          <input
            name="maxDiscountValue"
            value={values.maxDiscountValue}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.01"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Usage limit
          <input
            name="usageLimit"
            value={values.usageLimit}
            onChange={handleChange}
            type="number"
            min="0"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Leave blank for unlimited"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Starts at
          <input
            name="startsAt"
            value={values.startsAt}
            onChange={handleChange}
            type="datetime-local"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Ends at
          <input
            name="endsAt"
            value={values.endsAt}
            onChange={handleChange}
            type="datetime-local"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Status
          <select
            name="status"
            value={values.status}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
          Applies to (SKU, collection, or audience)
          <input
            name="appliesTo"
            value={values.appliesTo}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. SKU-1001 or rental:generators"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={submitting} icon={PlusIcon} iconPosition="start">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

CouponForm.propTypes = {
  values: PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    discountType: PropTypes.string,
    discountValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    minOrderTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxDiscountValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    startsAt: PropTypes.string,
    endsAt: PropTypes.string,
    usageLimit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    appliesTo: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  submitting: PropTypes.bool,
  submitLabel: PropTypes.string
};

CouponForm.defaultProps = {
  onCancel: undefined,
  submitting: false,
  submitLabel: 'Save coupon'
};

export default function CouponsSection({ coupons, meta, onCreate, onUpdate, onStatusChange, mutation }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState(INITIAL_COUPON);
  const [errorMessage, setErrorMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editState, setEditState] = useState(null);

  const totals = useMemo(() => ({
    total: meta?.total ?? coupons.length,
    active: meta?.active ?? coupons.filter((coupon) => coupon.status === 'active').length,
    expiringSoon: meta?.expiringSoon ?? coupons.filter((coupon) => coupon.status === 'scheduled').length
  }), [coupons, meta]);

  const handleCreate = async () => {
    setErrorMessage(null);
    try {
      await onCreate(normaliseCouponPayload(newCoupon));
      setNewCoupon(INITIAL_COUPON);
      setCreateOpen(false);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to create coupon');
    }
  };

  const startEditing = (coupon) => {
    setEditingId(coupon.id);
    setEditState({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      minOrderTotal: coupon.minOrderTotal ?? '',
      maxDiscountValue: coupon.maxDiscountValue ?? '',
      startsAt: toDateTimeLocal(coupon.startsAt),
      endsAt: toDateTimeLocal(coupon.endsAt),
      usageLimit: coupon.usageLimit ?? '',
      status: coupon.status || 'draft',
      appliesTo: coupon.appliesTo || ''
    });
    setErrorMessage(null);
  };

  const handleUpdate = async () => {
    if (!editingId) {
      return;
    }
    setErrorMessage(null);
    try {
      await onUpdate(editingId, normaliseCouponPayload(editState));
      setEditingId(null);
      setEditState(null);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to update coupon');
    }
  };

  const handleStatusUpdate = async (couponId, status) => {
    setErrorMessage(null);
    try {
      await onStatusChange(couponId, status);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to update coupon status');
    }
  };

  return (
    <section id="storefront-coupons" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Coupons & incentives</h2>
          <p className="text-sm text-slate-600">
            Launch tactical promotions, manage renewal windows, and track redemption guardrails in real time.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
            Total: {totals.total}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            Active: {totals.active}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
            Upcoming: {totals.expiringSoon}
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6">
        {createOpen ? (
          <CouponForm
            values={newCoupon}
            onChange={setNewCoupon}
            onSubmit={handleCreate}
            onCancel={() => {
              setCreateOpen(false);
              setNewCoupon(INITIAL_COUPON);
            }}
            submitting={mutation === 'create'}
            submitLabel="Create coupon"
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Create a promotion</p>
              <p className="text-xs text-slate-500">
                Incentivise bookings, reward loyal customers, and unlock seasonal revenue boosters.
              </p>
            </div>
            <Button type="button" icon={PlusIcon} iconPosition="start" onClick={() => setCreateOpen(true)}>
              New coupon
            </Button>
          </div>
        )}
      </div>

      {errorMessage ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-600">{errorMessage}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {coupons.map((coupon) => {
          const isEditing = editingId === coupon.id;
          const statusTone = STATUS_TONE[coupon.status] ?? 'info';
          const usageLimit = coupon.usageLimit != null ? coupon.usageLimit : 'Unlimited';
          const usageSummary = `${coupon.usageCount ?? 0} redeemed • ${usageLimit} cap`;
          return (
            <article key={coupon.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{coupon.code}</p>
                  <h3 className="mt-1 text-base font-semibold text-primary">{coupon.name}</h3>
                  {coupon.description ? <p className="mt-2 text-sm text-slate-600">{coupon.description}</p> : null}
                </div>
                <StatusPill tone={statusTone}>{coupon.status}</StatusPill>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-500">Discount</dt>
                  <dd className="mt-1 text-sm text-primary">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : `£${Number(coupon.discountValue ?? 0).toLocaleString()}`}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Order guardrails</dt>
                  <dd className="mt-1 text-sm text-primary">
                    {coupon.minOrderTotal != null ? `Min £${Number(coupon.minOrderTotal).toLocaleString()}` : 'No minimum'}
                    {coupon.maxDiscountValue != null
                      ? ` • Cap £${Number(coupon.maxDiscountValue).toLocaleString()}`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Usage</dt>
                  <dd className="mt-1 text-sm text-primary">{usageSummary}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Schedule</dt>
                  <dd className="mt-1 text-sm text-primary flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <span>
                      {coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : 'Live now'} —
                      {coupon.endsAt ? ` ${new Date(coupon.endsAt).toLocaleDateString()}` : ' open'}
                    </span>
                  </dd>
                </div>
                {coupon.appliesTo ? (
                  <div className="col-span-2">
                    <dt className="font-semibold text-slate-500">Targeting</dt>
                    <dd className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <TagIcon className="h-4 w-4" aria-hidden="true" /> {coupon.appliesTo}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={PencilSquareIcon}
                  iconPosition="start"
                  onClick={() => startEditing(coupon)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={CheckIcon}
                  iconPosition="start"
                  onClick={() => handleStatusUpdate(coupon.id, coupon.status === 'active' ? 'disabled' : 'active')}
                  loading={mutation === coupon.id}
                >
                  {coupon.status === 'active' ? 'Disable' : 'Activate'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={NoSymbolIcon}
                  iconPosition="start"
                  onClick={() => handleStatusUpdate(coupon.id, 'expired')}
                  loading={mutation === coupon.id}
                >
                  Mark expired
                </Button>
              </div>

              {isEditing ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <CouponForm
                    values={editState}
                    onChange={setEditState}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                      setEditingId(null);
                      setEditState(null);
                    }}
                    submitting={mutation === coupon.id}
                    submitLabel="Save changes"
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
          No coupons created yet. Launch campaigns to boost conversion and reward your most engaged customers.
        </div>
      ) : null}
    </section>
  );
}

CouponsSection.propTypes = {
  coupons: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      code: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      discountType: PropTypes.string,
      discountValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      minOrderTotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      maxDiscountValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      startsAt: PropTypes.string,
      endsAt: PropTypes.string,
      usageLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      usageCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
      appliesTo: PropTypes.string
    })
  ).isRequired,
  meta: PropTypes.shape({
    total: PropTypes.number,
    active: PropTypes.number,
    expiringSoon: PropTypes.number
  }),
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  mutation: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

CouponsSection.defaultProps = {
  meta: null,
  mutation: null
};
