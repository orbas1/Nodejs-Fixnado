import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import Button from '../../ui/Button.jsx';
import FormField from '../../ui/FormField.jsx';
import TextInput from '../../ui/TextInput.jsx';
import { createRental } from '../../../api/rentalClient.js';

const defaultForm = {
  itemId: '',
  quantity: 1,
  rentalStart: '',
  rentalEnd: '',
  bookingId: '',
  notes: ''
};

export default function RentalCreateModal({
  open,
  onClose,
  inventoryOptions,
  defaults,
  onCreated
}) {
  const [form, setForm] = useState(defaultForm);
  const [action, setAction] = useState({ loading: false, error: null });

  useEffect(() => {
    if (!open) {
      setForm(defaultForm);
      setAction({ loading: false, error: null });
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const actorId = defaults?.renterId;
      if (!actorId) {
        setAction({ loading: false, error: 'Actor ID unavailable for new rental' });
        return;
      }
      if (!form.itemId) {
        setAction({ loading: false, error: 'Select an asset to rent' });
        return;
      }

      const payload = {
        itemId: form.itemId,
        renterId: actorId,
        quantity: Number.parseInt(form.quantity, 10) || 1,
        rentalStart: form.rentalStart ? new Date(form.rentalStart).toISOString() : null,
        rentalEnd: form.rentalEnd ? new Date(form.rentalEnd).toISOString() : null,
        bookingId: form.bookingId || null,
        notes: form.notes || null,
        actorId,
        actorRole: 'customer'
      };

      setAction({ loading: true, error: null });
      try {
        await createRental(payload);
        await onCreated();
        onClose();
      } catch (error) {
        console.error('Failed to create rental', error);
        setAction({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to create rental'
        });
      }
    },
    [defaults?.renterId, form, onClose, onCreated]
  );

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
                <Dialog.Title className="text-lg font-semibold text-primary">Request rental</Dialog.Title>
                {action.error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
                    {action.error}
                  </div>
                ) : null}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <FormField id="new-rental-asset" label="Asset">
                    <div>
                      <input
                        id="new-rental-asset"
                        list="rental-asset-options"
                        className="fx-text-input"
                        value={form.itemId}
                        onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))}
                        required
                      />
                      <datalist id="rental-asset-options">
                        {inventoryOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                            {item.descriptor ? ` (${item.descriptor})` : ''}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </FormField>
                  <TextInput
                    id="new-rental-quantity"
                    label="Quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      id="new-rental-start"
                      label="Preferred start"
                      type="datetime-local"
                      value={form.rentalStart}
                      onChange={(event) => setForm((prev) => ({ ...prev, rentalStart: event.target.value }))}
                    />
                    <TextInput
                      id="new-rental-end"
                      label="Preferred end"
                      type="datetime-local"
                      value={form.rentalEnd}
                      onChange={(event) => setForm((prev) => ({ ...prev, rentalEnd: event.target.value }))}
                    />
                  </div>
                  <TextInput
                    id="new-rental-booking"
                    label="Link booking"
                    optionalLabel="Optional"
                    value={form.bookingId}
                    onChange={(event) => setForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                  />
                  <FormField id="new-rental-notes" label="Notes" optionalLabel="Optional">
                    <textarea
                      id="new-rental-notes"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                      rows={3}
                      value={form.notes}
                      onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    />
                  </FormField>
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" type="button" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={action.loading}>
                      Submit request
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

RentalCreateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  inventoryOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      descriptor: PropTypes.string
    })
  ),
  defaults: PropTypes.shape({
    renterId: PropTypes.string
  }),
  onCreated: PropTypes.func.isRequired
};

RentalCreateModal.defaultProps = {
  inventoryOptions: [],
  defaults: null
};

