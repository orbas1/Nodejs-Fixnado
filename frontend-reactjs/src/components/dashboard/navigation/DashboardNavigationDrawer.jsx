import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3BottomLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import getNavIcon from './navigationUtils.js';

const DashboardNavigationDrawer = ({
  open,
  onClose,
  roleMeta,
  navigation,
  activeSectionId,
  onSelectSection,
  onLogout
}) => (
  <Transition.Root show={open} as={Fragment}>
    <Dialog as="div" className="relative z-40 lg:hidden" onClose={onClose}>
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

      <div className="fixed inset-y-0 left-0 flex max-w-xs w-full">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in duration-150"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Dialog.Panel className="relative flex w-full flex-col border-r border-accent/10 bg-gradient-to-b from-white via-secondary/60 to-white p-6 shadow-2xl">
            <Dialog.Title className="sr-only">Dashboard navigation</Dialog.Title>
            <div className="flex items-center justify-between gap-3">
              <Link to="/dashboards" className="flex items-center gap-2 text-primary" onClick={() => onClose(false)}>
                <Bars3BottomLeftIcon className="h-6 w-6 text-accent" />
                <div className="leading-tight">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Fixnado</p>
                  <p className="text-lg font-semibold">{roleMeta.name}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => onClose(false)}
                className="rounded-full border border-accent/20 bg-white p-2 text-slate-500 transition hover:border-accent hover:text-accent"
                aria-label="Close navigation"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <nav className="mt-8 flex-1 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = item.id === activeSectionId;
                const Icon = getNavIcon(item);
                const baseClasses = 'group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition';
                const stateClasses = isActive
                  ? 'border-accent bg-accent text-white shadow-glow'
                  : 'border-transparent bg-white/80 text-primary/80 hover:border-accent/40 hover:text-primary';
                const iconClasses = isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-secondary text-primary group-hover:bg-accent/10 group-hover:text-accent';
                const content = (
                  <>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClasses}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" title={item.label}>
                        {item.menuLabel}
                      </p>
                      {item.description ? <p className="sr-only">{item.description}</p> : null}
                    </div>
                  </>
                );

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={`${baseClasses} ${stateClasses}`}
                      onClick={() => onClose(false)}
                      aria-label={item.label}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      onClose(false);
                    }}
                    className={`${baseClasses} ${stateClasses}`}
                    aria-pressed={isActive}
                  >
                    {content}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 space-y-3">
              <Link
                to="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 hover:border-accent hover:text-primary"
                onClick={() => onClose(false)}
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Public site
              </Link>
              {onLogout ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose(false);
                    onLogout();
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:text-rose-800"
                >
                  <ArrowLeftOnRectangleIcon className="h-4 w-4" /> Sign out
                </button>
              ) : null}
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition.Root>
);

DashboardNavigationDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  roleMeta: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired,
  navigation: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string,
      menuLabel: PropTypes.string,
      description: PropTypes.string
    })
  ).isRequired,
  activeSectionId: PropTypes.string,
  onSelectSection: PropTypes.func.isRequired,
  onLogout: PropTypes.func
};

DashboardNavigationDrawer.defaultProps = {
  activeSectionId: null,
  onLogout: null
};

export default DashboardNavigationDrawer;
