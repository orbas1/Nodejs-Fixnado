import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const RolePreviewDialog = ({ role, isAllowed, onClose, onUnlock }) => {
  const open = Boolean(role);
  const navigation = role?.navigation ?? [];

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

        <div className="fixed inset-0 z-50 overflow-y-auto px-6 py-10">
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
              <Dialog.Panel className="relative w-full max-w-4xl space-y-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-3 pr-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{role?.persona}</p>
                    <Dialog.Title className="text-4xl font-semibold text-slate-900">{role?.name}</Dialog.Title>
                    <p className="text-sm font-medium text-slate-500">{role?.headline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent/40 hover:text-accent"
                  >
                    Close
                  </button>
                </div>

                {navigation.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {navigation.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6"
                      >
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            {item.menuLabel ?? 'Flow'}
                          </p>
                          <p className="text-lg font-semibold text-slate-900">{item.label}</p>
                        </div>
                        {item.href ? (
                          <Link
                            to={item.href}
                            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
                          >
                            Open
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  {!isAllowed && onUnlock ? (
                    <button
                      type="button"
                      onClick={() => onUnlock(role)}
                      className="inline-flex items-center justify-center rounded-full border border-accent/40 bg-white px-5 py-2 text-sm font-semibold text-accent transition hover:border-accent/60"
                    >
                      Unlock
                    </button>
                  ) : null}
                  {isAllowed ? (
                    <Link
                      to={`/dashboards/${role?.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-accent/90"
                    >
                      Open workspace
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
  onClose: PropTypes.func.isRequired,
  onUnlock: PropTypes.func
};

RolePreviewDialog.defaultProps = {
  role: null,
  isAllowed: false,
  onUnlock: null
};

export default RolePreviewDialog;
