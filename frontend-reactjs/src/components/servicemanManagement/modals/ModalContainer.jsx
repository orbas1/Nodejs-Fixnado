import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment } from 'react';

export default function ModalContainer({
  open,
  title,
  description,
  onClose,
  onSubmit,
  submitting,
  error,
  children,
  showDelete,
  deleteLabel,
  onDelete
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-xl font-semibold text-primary">{title}</Dialog.Title>
                {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
                {error ? (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
                ) : null}
                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                  {children}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {showDelete ? (
                      <button
                        type="button"
                        onClick={onDelete}
                        disabled={submitting}
                        className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {deleteLabel}
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex w-full justify-end gap-3 sm:w-auto">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 transition hover:border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
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

ModalContainer.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
  showDelete: PropTypes.bool,
  deleteLabel: PropTypes.string,
  onDelete: PropTypes.func
};

ModalContainer.defaultProps = {
  description: undefined,
  submitting: false,
  error: null,
  showDelete: false,
  deleteLabel: 'Delete',
  onDelete: undefined
};
