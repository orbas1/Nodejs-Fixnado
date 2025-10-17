import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const actionVariants = {
  primary: 'bg-accent text-white hover:bg-accent/90 border-transparent',
  secondary: 'bg-white text-primary border border-accent/20 hover:border-accent/40',
  subtle: 'bg-secondary text-primary border border-transparent hover:border-accent/30'
};

const resolveActionVariant = (variant) => actionVariants[variant] ?? actionVariants.primary;

export default function DashboardDetailDrawer({ panel, onClose }) {
  const open = panel?.variant === 'drawer';

  return (
    <Transition.Root show={open} as={Fragment} appear>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/40" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl bg-white shadow-2xl">
              <div className="flex h-full flex-col">
                <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                  <div className="space-y-1">
                    <Dialog.Title className="text-lg font-semibold text-primary">{panel?.title ?? 'Details'}</Dialog.Title>
                    {panel?.subtitle ? (
                      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{panel.subtitle}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-accent hover:text-accent"
                    aria-label="Close details"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </header>

                {panel?.meta?.length ? (
                  <dl className="grid grid-cols-1 gap-3 border-b border-slate-200 px-6 py-4 text-sm text-primary/80 sm:grid-cols-2">
                    {panel.meta.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-100 bg-secondary px-4 py-3">
                        <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-primary/50">{item.label}</dt>
                        <dd className="mt-1 font-medium text-primary">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-primary">
                  {panel?.body ?? null}
                </div>

                {panel?.actions?.length ? (
                  <div className="border-t border-slate-200 px-6 py-5">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {panel.actions.map((action) => {
                        if (action.href) {
                          return (
                            <a
                              key={action.label}
                              href={action.href}
                              target={action.external ? '_blank' : action.target ?? '_self'}
                              rel={action.external ? 'noreferrer' : undefined}
                              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${resolveActionVariant(action.variant)}`}
                            >
                              {action.label}
                            </a>
                          );
                        }

                        return (
                          <button
                            key={action.label}
                            type="button"
                            onClick={action.onClick}
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${resolveActionVariant(action.variant)}`}
                          >
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

DashboardDetailDrawer.propTypes = {
  panel: PropTypes.shape({
    variant: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    meta: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.node.isRequired
      })
    ),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string,
        external: PropTypes.bool,
        target: PropTypes.string,
        variant: PropTypes.oneOf(['primary', 'secondary', 'subtle']),
        onClick: PropTypes.func
      })
    ),
    body: PropTypes.node
  }),
  onClose: PropTypes.func.isRequired
};

DashboardDetailDrawer.defaultProps = {
  panel: null
};

