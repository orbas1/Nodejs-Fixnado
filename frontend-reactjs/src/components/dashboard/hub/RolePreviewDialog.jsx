import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  LockOpenIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const RolePreviewDialog = ({ role, isAllowed, isPending, onClose, onUnlock }) => {
  const open = Boolean(role);
  const navigation = role?.navigation ?? [];
  const canUnlock = open && !isAllowed && !isPending && typeof onUnlock === 'function';

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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto p-6 sm:p-10">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-accent/10 bg-white p-8 shadow-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-6 top-6 rounded-full border border-accent/20 bg-white p-2 text-primary/60 transition hover:border-accent/40 hover:text-primary"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>

                <div className="space-y-3 pr-12">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-primary/60">{role?.persona}</p>
                  <Dialog.Title className="text-3xl font-semibold text-primary">{role?.name}</Dialog.Title>
                  <p className="text-sm text-primary/70">{role?.headline}</p>
                </div>

                {navigation.length > 0 ? (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {navigation.map((item) => (
                      <div
                        key={item.id}
                        className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-accent/15 bg-secondary/30 p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-primary">{item.label}</p>
                          {item.menuLabel ? (
                            <p className="text-xs uppercase tracking-wide text-primary/60">{item.menuLabel}</p>
                          ) : null}
                        </div>
                        {item.href ? (
                          <Link
                            to={item.href}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-accent/80"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Go
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-8 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-5 py-2 text-sm font-semibold text-primary/70 transition hover:border-accent/40 hover:text-primary"
                  >
                    Close
                  </button>
                  {canUnlock ? (
                    <button
                      type="button"
                      onClick={() => onUnlock(role)}
                      className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-5 py-2 text-sm font-semibold text-accent transition hover:border-accent/60"
                    >
                      <LockOpenIcon className="h-4 w-4" /> Unlock
                    </button>
                  ) : null}
                  {open && isAllowed ? (
                    <Link
                      to={`/dashboards/${role.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Open
                    </Link>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

RolePreviewDialog.propTypes = {
  role: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    persona: PropTypes.string,
    headline: PropTypes.string,
    navigation: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        menuLabel: PropTypes.string,
        href: PropTypes.string
      })
    )
  }),
  isAllowed: PropTypes.bool,
  isPending: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onUnlock: PropTypes.func
};

RolePreviewDialog.defaultProps = {
  role: null,
  isAllowed: false,
  isPending: false,
  onUnlock: null
};

export default RolePreviewDialog;
