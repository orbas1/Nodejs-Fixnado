import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const actionVariants = {
  primary: 'bg-primary text-white hover:bg-primary/90 border-transparent',
  secondary: 'bg-white text-primary border border-accent/20 hover:border-accent/40',
  subtle: 'bg-secondary text-primary border border-transparent hover:border-accent/30'
};

const resolveActionVariant = (variant) => actionVariants[variant] ?? actionVariants.primary;

const sizeClassMap = {
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-7xl'
};

const resolveSizeClass = (size) => sizeClassMap[size] ?? sizeClassMap.xl;

export default function DashboardWorkspaceModal({ panel, onClose }) {
  const open = panel?.variant === 'workspace';

  return (
    <Transition.Root show={open} as={Fragment} appear>
      <Dialog as="div" className="relative z-[70]" onClose={onClose} static>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`relative flex w-full ${resolveSizeClass(panel?.size)} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`}
              >
                <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <Dialog.Title className="text-2xl font-semibold text-primary">
                      {panel?.title ?? 'Workspace'}
                    </Dialog.Title>
                    {panel?.subtitle ? (
                      <p className="text-xs uppercase tracking-[0.35em] text-primary/60">{panel.subtitle}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-accent hover:text-accent"
                    aria-label="Close workspace"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </header>

                {panel?.meta?.length ? (
                  <dl className="grid grid-cols-1 gap-3 border-b border-slate-200 px-6 py-4 text-sm text-primary/80 sm:grid-cols-3">
                    {panel.meta.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-100 bg-secondary px-4 py-3">
                        <dt className="text-[0.65rem] uppercase tracking-[0.3em] text-primary/50">{item.label}</dt>
                        <dd className="mt-1 font-medium text-primary">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                <div className="flex-1 overflow-y-auto bg-secondary/60 px-4 py-6 sm:px-8 sm:py-8">
                  <div className="mx-auto w-full max-w-5xl space-y-6">{panel?.body ?? null}</div>
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

DashboardWorkspaceModal.propTypes = {
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

DashboardWorkspaceModal.defaultProps = {
  panel: null
};

