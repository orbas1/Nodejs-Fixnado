import { useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useLocale } from '../../hooks/useLocale.js';

function CheckoutItemRow({ index, item, onChange, onRemove, disabled }) {
  const { t } = useLocale();
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm md:grid-cols-4" data-qa={`checkout-item-${index}`}>
      <input
        type="text"
        className="rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
        placeholder={t('instructor.checkout.itemNamePlaceholder')}
        value={item.name}
        onChange={(event) => onChange(index, { ...item, name: event.target.value })}
        disabled={disabled}
      />
      <input
        type="text"
        className="rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
        placeholder={t('instructor.checkout.itemIdPlaceholder')}
        value={item.id}
        onChange={(event) => onChange(index, { ...item, id: event.target.value })}
        disabled={disabled}
      />
      <input
        type="number"
        min={1}
        className="rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
        placeholder={t('instructor.checkout.itemQuantityPlaceholder')}
        value={item.quantity}
        onChange={(event) => onChange(index, { ...item, quantity: Number(event.target.value) })}
        disabled={disabled}
      />
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
          placeholder={t('instructor.checkout.itemPricePlaceholder')}
          value={item.price}
          onChange={(event) => onChange(index, { ...item, price: Number(event.target.value) })}
          disabled={disabled}
        />
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100"
          onClick={() => onRemove(index)}
          disabled={disabled}
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('instructor.checkout.removeItem')}</span>
        </button>
      </div>
    </div>
  );
}

CheckoutItemRow.propTypes = {
  index: PropTypes.number.isRequired,
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    quantity: PropTypes.number,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

CheckoutItemRow.defaultProps = {
  disabled: false
};

export default function InstructorCheckoutSimulator({ onSimulate, result, isSubmitting }) {
  const { t, format } = useLocale();
  const [items, setItems] = useState([{ id: '', name: '', quantity: 1, price: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [country, setCountry] = useState('US');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const handleItemChange = (index, updates) => {
    setItems((current) => current.map((item, idx) => (idx === index ? { ...item, ...updates } : item)));
  };

  const handleRemove = (index) => {
    setItems((current) => current.filter((_, idx) => idx !== index));
  };

  const handleAddItem = () => {
    setItems((current) => [...current, { id: '', name: '', quantity: 1, price: 0 }]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const filteredItems = items.filter((item) => item.name && item.quantity > 0);
    if (filteredItems.length === 0) {
      return;
    }
    await onSimulate({
      items: filteredItems,
      paymentMethod,
      country,
      discounts: discountCode ? [{ code: discountCode, amount: discountAmount }] : []
    });
  };

  return (
    <section className="space-y-6" data-qa="instructor-checkout-simulator">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.checkout.eyebrow')}</p>
        <h2 className="text-2xl font-semibold text-primary">{t('instructor.checkout.title')}</h2>
        <p className="text-sm text-slate-600">{t('instructor.checkout.description')}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="space-y-3">
          {items.map((item, index) => (
            <CheckoutItemRow
              key={index}
              index={index}
              item={item}
              onChange={handleItemChange}
              onRemove={handleRemove}
              disabled={isSubmitting}
            />
          ))}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
          onClick={handleAddItem}
          disabled={isSubmitting}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          {t('instructor.checkout.addItem')}
        </button>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {t('instructor.checkout.paymentMethod')}
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
              disabled={isSubmitting}
            >
              <option value="card">{t('instructor.checkout.method.card')}</option>
              <option value="bank-transfer">{t('instructor.checkout.method.bank')}</option>
              <option value="wallet">{t('instructor.checkout.method.wallet')}</option>
            </select>
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {t('instructor.checkout.countryLabel')}
            <input
              type="text"
              value={country}
              onChange={(event) => setCountry(event.target.value.toUpperCase().slice(0, 2))}
              className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
              disabled={isSubmitting}
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('instructor.checkout.discountCode')}
              <input
                type="text"
                value={discountCode}
                onChange={(event) => setDiscountCode(event.target.value.toUpperCase().slice(0, 12))}
                className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
                disabled={isSubmitting}
              />
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('instructor.checkout.discountAmount')}
              <input
                type="number"
                min={0}
                step="0.01"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(Number(event.target.value))}
                className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
                disabled={isSubmitting}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('instructor.checkout.submitting') : t('instructor.checkout.simulateCta')}
          </button>
        </div>
      </form>

      {result ? (
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm md:grid-cols-2" data-qa="instructor-checkout-result">
          <div>
            <h3 className="text-lg font-semibold text-primary">{t('instructor.checkout.resultTitle')}</h3>
            <p className="text-sm text-slate-600">{t('instructor.checkout.resultDescription')}</p>
            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>{t('instructor.checkout.subtotal')}</dt>
                <dd>{format.currency(result.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t('instructor.checkout.discounts')}</dt>
                <dd>{format.currency(result.discounts)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t('instructor.checkout.tax')}</dt>
                <dd>{format.currency(result.tax)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t('instructor.checkout.fees')}</dt>
                <dd>{format.currency(result.fees)}</dd>
              </div>
              <div className="flex items-center justify-between font-semibold text-primary">
                <dt>{t('instructor.checkout.total')}</dt>
                <dd>{format.currency(result.total)}</dd>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <dt>{t('instructor.checkout.estimatedPayout')}</dt>
                <dd>{format.currency(result.estimatedPayout)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p>{t('instructor.checkout.auditTitle')}</p>
            <pre className="mt-3 max-h-60 overflow-auto rounded-2xl bg-white/90 p-3 text-xs text-slate-600">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}

InstructorCheckoutSimulator.propTypes = {
  onSimulate: PropTypes.func.isRequired,
  result: PropTypes.shape({
    subtotal: PropTypes.number,
    discounts: PropTypes.number,
    tax: PropTypes.number,
    fees: PropTypes.number,
    total: PropTypes.number,
    estimatedPayout: PropTypes.number
  }),
  isSubmitting: PropTypes.bool
};

InstructorCheckoutSimulator.defaultProps = {
  result: null,
  isSubmitting: false
};
