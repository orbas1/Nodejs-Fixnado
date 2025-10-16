import PropTypes from 'prop-types';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { InlineBanner } from './FormControls.jsx';
import CouponModal, { couponPropType } from './CouponModal.jsx';

const statusStyles = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  scheduled: 'border-sky-200 bg-sky-50 text-sky-700',
  draft: 'border-slate-200 bg-slate-100 text-slate-600',
  expired: 'border-rose-200 bg-rose-50 text-rose-700',
  archived: 'border-slate-300 bg-slate-200 text-slate-600'
};

const formatDate = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatMoney = (amount, currency) => {
  if (amount === '' || amount === null || amount === undefined) {
    return null;
  }
  const numeric = Number.parseFloat(amount);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (!currency) {
    return `${numeric.toFixed(2)}`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toFixed(2)}`;
  }
};

const formatDiscount = (coupon) => {
  if (coupon.discountType === 'percentage') {
    return `${Number.parseFloat(coupon.discountValue || 0).toFixed(2)}% off`;
  }
  const formatted = formatMoney(coupon.discountValue, coupon.currency || 'USD');
  return formatted ? `${formatted} off` : `${coupon.discountValue} off`;
};

const formatSchedule = (coupon) => {
  const start = coupon.startsAt ? formatDate(`${coupon.startsAt}T00:00:00Z`) : null;
  const end = coupon.expiresAt ? formatDate(`${coupon.expiresAt}T23:59:59Z`) : null;
  if (start && end) {
    return `${start} → ${end}`;
  }
  if (start) {
    return `Starts ${start}`;
  }
  if (end) {
    return `Ends ${end}`;
  }
  return 'No schedule defined';
};

const formatLimits = (coupon) => {
  const total = coupon.maxRedemptions ? Number.parseInt(coupon.maxRedemptions, 10) : null;
  const perCustomer = coupon.maxRedemptionsPerCustomer
    ? Number.parseInt(coupon.maxRedemptionsPerCustomer, 10)
    : null;

  if (!total && !perCustomer) {
    return 'Unlimited redemptions';
  }
  if (total && perCustomer) {
    return `${total.toLocaleString()} total • ${perCustomer} per customer`;
  }
  if (total) {
    return `${total.toLocaleString()} total redemptions`;
  }
  return `${perCustomer} per customer`;
};

const CustomerCouponsSection = ({
  coupons,
  status,
  saving,
  onCreate,
  onEdit,
  onDelete,
  modalOpen,
  activeCoupon,
  onCloseModal,
  onSubmit
}) => (
  <section className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-primary">Coupons & promotions</h3>
        <p className="text-sm text-slate-600">
          Manage enterprise incentives with granular control over lifecycle, eligibility, and redemption limits.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90"
      >
        <PlusIcon className="h-4 w-4" /> New coupon
      </button>
    </header>

    <InlineBanner tone={status?.tone} message={status?.message} />

    {coupons.length === 0 ? (
      <div className="rounded-3xl border border-dashed border-accent/20 bg-secondary/60 p-6 text-sm text-slate-600">
        Launch your first promotion to reward loyal customers and unlock targeted growth initiatives.
      </div>
    ) : (
      <div className="grid gap-4 xl:grid-cols-2">
        {coupons.map((coupon) => {
          const lifecycle = coupon.lifecycleStatus || coupon.status || 'draft';
          const badgeStyles = statusStyles[lifecycle] ?? statusStyles.draft;
          const schedule = formatSchedule(coupon);
          const limits = formatLimits(coupon);
          const discount = formatDiscount(coupon);

          return (
            <article key={coupon.id} className="flex h-full flex-col gap-4 rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <TicketIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-primary">{coupon.name}</p>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles}`}>
                      {lifecycle.charAt(0).toUpperCase() + lifecycle.slice(1)}
                    </span>
                    {coupon.autoApply ? (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        Auto apply
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-600">Code: {coupon.code || 'Not assigned'}</p>
                  <p className="text-xs uppercase tracking-wide text-primary/60">{discount}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>{schedule}</p>
                <p>{limits}</p>
                {coupon.description ? <p className="text-xs text-slate-500">{coupon.description}</p> : null}
              </div>

              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(coupon)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-primary hover:border-slate-300"
                >
                  <PencilSquareIcon className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(coupon.id)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <TrashIcon className="h-4 w-4" /> Remove
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`/customer/coupons/${coupon.id}/analytics`, '_blank', 'noopener')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Analytics
                </button>
              </div>
            </article>
          );
        })}
      </div>
    )}

    <CouponModal
      open={modalOpen}
      coupon={activeCoupon}
      onClose={onCloseModal}
      onSubmit={onSubmit}
      saving={saving}
    />
  </section>
);

CustomerCouponsSection.propTypes = {
  coupons: PropTypes.arrayOf(couponPropType).isRequired,
  status: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'error', 'info']),
    message: PropTypes.string
  }),
  saving: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  activeCoupon: couponPropType,
  onCloseModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

CustomerCouponsSection.defaultProps = {
  status: null,
  saving: false,
  activeCoupon: null
};

export default CustomerCouponsSection;
