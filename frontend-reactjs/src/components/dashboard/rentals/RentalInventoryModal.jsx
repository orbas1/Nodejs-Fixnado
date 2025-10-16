import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Button from '../../ui/Button.jsx';
import Spinner from '../../ui/Spinner.jsx';
import { formatCurrency } from './rentalUtils.js';

export default function RentalInventoryModal({ open, onClose, item, currency }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-primary">Asset details</Dialog.Title>
                {item ? (
                  <div className="space-y-4">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-48 w-full rounded-2xl object-cover" />
                    ) : null}
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">SKU</p>
                        <p className="mt-1 font-medium text-primary">{item.sku || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Category</p>
                        <p className="mt-1 font-medium text-primary">{item.category || 'Uncategorised'}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">On hand</p>
                          <p className="mt-1 font-medium text-primary">{item.quantityOnHand ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reserved</p>
                          <p className="mt-1 font-medium text-primary">{item.quantityReserved ?? '—'}</p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Daily rate</p>
                          <p className="mt-1 font-medium text-primary">
                            {item.rentalRate ? formatCurrency(item.rentalRate, item.rentalRateCurrency || currency) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Deposit</p>
                          <p className="mt-1 font-medium text-primary">
                            {item.depositAmount
                              ? formatCurrency(item.depositAmount, item.depositCurrency || currency)
                              : 'None'}
                          </p>
                        </div>
                      </div>
                      {item.description ? (
                        <p className="rounded-2xl border border-slate-200 bg-secondary/40 p-3 text-sm text-slate-600">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-6">
                    <Spinner className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

RentalInventoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    sku: PropTypes.string,
    category: PropTypes.string,
    description: PropTypes.string,
    quantityOnHand: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    quantityReserved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rentalRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rentalRateCurrency: PropTypes.string,
    depositAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    depositCurrency: PropTypes.string,
    imageUrl: PropTypes.string
  }),
  currency: PropTypes.string
};

RentalInventoryModal.defaultProps = {
  item: null,
  currency: 'GBP'
};

