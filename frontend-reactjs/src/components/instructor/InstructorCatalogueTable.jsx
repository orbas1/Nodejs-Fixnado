import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useLocale } from '../../hooks/useLocale.js';
import StatusPill from '../ui/StatusPill.jsx';

const availabilityTone = {
  available: 'success',
  limited: 'warning',
  unavailable: 'neutral',
  retired: 'critical'
};

export default function InstructorCatalogueTable({
  items,
  onUpdate,
  isUpdating,
  allowedAvailability
}) {
  const { t, format } = useLocale();
  const [selectedItem, setSelectedItem] = useState(null);
  const availabilityOptions = useMemo(() => allowedAvailability ?? ['available', 'limited', 'unavailable', 'retired'], [allowedAvailability]);

  const handleSelect = (item) => {
    setSelectedItem((current) => (current?.id === item.id ? null : item));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedItem || !onUpdate) {
      return;
    }
    const form = new FormData(event.currentTarget);
    const availability = form.get('availability');
    const inventoryOnHand = Number(form.get('inventoryOnHand'));
    const leadTimeDays = Number(form.get('leadTimeDays'));

    await onUpdate(selectedItem, {
      availability,
      inventoryOnHand: Number.isFinite(inventoryOnHand) ? inventoryOnHand : undefined,
      leadTimeDays: Number.isFinite(leadTimeDays) ? leadTimeDays : undefined
    });
    setSelectedItem(null);
  };

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
        {t('instructor.catalogue.empty')}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm" data-qa="instructor-catalogue-table">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50/70 text-xs uppercase tracking-[0.3em] text-slate-500">
          <tr>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.catalogue.columnName')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.catalogue.columnType')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.catalogue.columnPrice')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.catalogue.columnInventory')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.catalogue.columnLeadTime')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.catalogue.columnAvailability')}</th>
            <th scope="col" className="px-6 py-4 font-semibold">{t('instructor.catalogue.columnUpdated')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <tr
                key={item.id}
                className={clsx('transition hover:bg-primary/5', isSelected && 'bg-primary/10')}
                onClick={() => handleSelect(item)}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-primary">{item.name}</div>
                  {item.sku ? <div className="text-xs text-slate-500">SKU • {item.sku}</div> : null}
                </td>
                <td className="px-6 py-4 text-xs uppercase tracking-[0.25em] text-slate-500">{t(`instructor.catalogue.type.${item.type}`)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{format.currency(item.unitPrice)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.inventoryOnHand ?? t('instructor.catalogue.inventoryUnknown')}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.leadTimeDays != null ? t('instructor.catalogue.leadTimeDays', { days: item.leadTimeDays }) : t('instructor.catalogue.leadTimeUnknown')}</td>
                <td className="px-6 py-4">
                  <StatusPill tone={availabilityTone[item.availability] ?? 'neutral'}>
                    {t(`instructor.catalogue.availability.${item.availability}`)}
                  </StatusPill>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {item.updatedAt ? format.dateTime(item.updatedAt) : t('instructor.catalogue.updatedUnknown')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedItem ? (
        <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-slate-50/70 p-6" data-qa="instructor-catalogue-editor">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('instructor.catalogue.formAvailability')}
              <select
                name="availability"
                defaultValue={selectedItem.availability}
                className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
                disabled={isUpdating}
              >
                {availabilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {t(`instructor.catalogue.availability.${option}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('instructor.catalogue.formInventory')}
              <input
                type="number"
                name="inventoryOnHand"
                className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
                defaultValue={selectedItem.inventoryOnHand ?? ''}
                min={0}
                step={1}
                disabled={isUpdating}
              />
            </label>

            <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('instructor.catalogue.formLeadTime')}
              <input
                type="number"
                name="leadTimeDays"
                className="mt-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
                defaultValue={selectedItem.leadTimeDays ?? ''}
                min={0}
                step={1}
                disabled={isUpdating}
              />
            </label>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
              onClick={() => setSelectedItem(null)}
              disabled={isUpdating}
            >
              {t('instructor.catalogue.cancelEdit')}
            </button>
            <button
              type="submit"
              className="rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
              disabled={isUpdating}
            >
              {isUpdating ? t('instructor.catalogue.saving') : t('instructor.catalogue.saveChanges')}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

InstructorCatalogueTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      sku: PropTypes.string,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      unitPrice: PropTypes.number.isRequired,
      availability: PropTypes.string.isRequired,
      inventoryOnHand: PropTypes.number,
      leadTimeDays: PropTypes.number,
      updatedAt: PropTypes.string
    })
  ).isRequired,
  onUpdate: PropTypes.func,
  isUpdating: PropTypes.bool,
  allowedAvailability: PropTypes.arrayOf(PropTypes.string)
};

InstructorCatalogueTable.defaultProps = {
  onUpdate: undefined,
  isUpdating: false,
  allowedAvailability: undefined
};
