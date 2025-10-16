import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import Button from '../../ui/Button.jsx';
import FormField from '../../ui/FormField.jsx';
import TextInput from '../../ui/TextInput.jsx';
import { startRentalDispute } from '../../../api/rentalClient.js';

export default function RentalDisputeModal({ open, rental, onClose, resolveActorId, onSubmitted }) {
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [action, setAction] = useState({ loading: false, error: null });

  useEffect(() => {
    if (!open) {
      setReason('');
      setEvidenceUrl('');
      setAction({ loading: false, error: null });
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!rental) return;
      const actorId = resolveActorId(rental);
      if (!actorId) {
        setAction({ loading: false, error: 'Actor ID unavailable for dispute' });
        return;
      }
      if (!reason.trim()) {
        setAction({ loading: false, error: 'Provide a reason for the dispute' });
        return;
      }

      setAction({ loading: true, error: null });
      try {
        await startRentalDispute(rental.id, {
          reason: reason.trim(),
          evidenceUrl: evidenceUrl.trim() || null,
          actorId,
          actorRole: 'customer'
        });
        await onSubmitted();
        onClose();
      } catch (error) {
        console.error('Failed to start dispute', error);
        setAction({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to start dispute'
        });
      }
    },
    [onClose, onSubmitted, reason, rental, resolveActorId]
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
              <Dialog.Panel className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-primary">Start dispute</Dialog.Title>
                {action.error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
                    {action.error}
                  </div>
                ) : null}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <FormField id="dispute-reason" label="Reason">
                    <textarea
                      id="dispute-reason"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                      rows={4}
                      required
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </FormField>
                  <TextInput
                    id="dispute-evidence"
                    label="Evidence URL"
                    placeholder="https://..."
                    optionalLabel="Optional"
                    type="url"
                    value={evidenceUrl}
                    onChange={(event) => setEvidenceUrl(event.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" type="button" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={action.loading}>
                      Submit dispute
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

RentalDisputeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  rental: PropTypes.shape({
    id: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  resolveActorId: PropTypes.func.isRequired,
  onSubmitted: PropTypes.func.isRequired
};

RentalDisputeModal.defaultProps = {
  rental: null
};

