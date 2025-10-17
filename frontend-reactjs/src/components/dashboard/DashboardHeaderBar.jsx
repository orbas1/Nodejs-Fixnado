import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Bars3BottomLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftOnRectangleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import DashboardToggleSummary from './DashboardToggleSummary.jsx';

const resultBadge = {
  section: 'Section',
  card: 'Summary',
  column: 'Stage',
  item: 'Work Item',
  record: 'Record',
  configuration: 'Setting',
  panel: 'Setting'
};

const DashboardHeaderBar = ({
  activeSection,
  persona,
  roleMeta,
  lastRefreshedLabel,
  toggleMeta,
  toggleReason,
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectResult,
  registeredRoles,
  onSwitchRole,
  onRefresh,
  loading,
  exportHref,
  onLogout,
  onOpenMobileNav,
  onOpenWorkspace
}) => {
  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className="sticky top-0 z-10 border-b border-accent/10 bg-white/90 backdrop-blur px-8 py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 shadow-sm transition hover:border-accent hover:text-primary"
          >
            <Bars3BottomLeftIcon className="h-5 w-5 text-accent" /> Menu
          </button>
          {lastRefreshedLabel ? <p className="text-xs text-primary/60">Refreshed {lastRefreshedLabel}</p> : null}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-primary">{activeSection?.label ?? roleMeta.name}</h1>
            {persona ? (
              <span className="rounded-full border border-slate-200 bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
                {persona}
              </span>
            ) : null}
          </div>
          {lastRefreshedLabel ? (
            <p className="hidden text-xs text-primary/60 lg:block">Refreshed {lastRefreshedLabel}</p>
          ) : null}
          <DashboardToggleSummary toggle={toggleMeta} reason={toggleReason} />
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full flex-col gap-2 sm:w-64">
            <label className="text-xs uppercase tracking-wide text-primary/60" htmlFor="roleSwitcher">
              Switch workspace
            </label>
            <select
              id="roleSwitcher"
              value={roleMeta.id}
              onChange={(event) => onSwitchRole(event.target.value)}
              className="rounded-xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {registeredRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search jobs, orders, analytics, automations..."
              className="w-full rounded-full bg-white border border-accent/20 py-3 pl-12 pr-4 text-sm text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {searchResults.length > 0 ? (
              <div className="absolute inset-x-0 top-14 z-20 rounded-2xl border border-accent/10 bg-white shadow-glow">
                <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => onSelectResult(result)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary"
                      >
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-primary/80">
                          {resultBadge[result.type] ?? 'Result'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-primary">{result.label}</p>
                          <p className="text-xs text-slate-500">{result.description}</p>
                        </div>
                        <ArrowTopRightOnSquareIcon className="mt-1 h-4 w-4 text-slate-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:self-end">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 hover:border-accent hover:text-primary"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Public site
            </Link>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:text-rose-800"
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4" /> Sign out
              </button>
            ) : null}
            {onOpenWorkspace ? (
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 transition hover:border-accent hover:text-primary"
              >
                <ArrowsPointingOutIcon className="h-4 w-4" /> Expand
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 hover:border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            {exportHref ? (
              <a
                href={exportHref}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90"
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Download CSV
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardHeaderBar.propTypes = {
  activeSection: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string
  }),
  persona: PropTypes.string,
  roleMeta: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  lastRefreshedLabel: PropTypes.string,
  toggleMeta: PropTypes.shape({
    state: PropTypes.string,
    rollout: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    owner: PropTypes.string,
    ticket: PropTypes.string,
    lastModifiedAt: PropTypes.string
  }),
  toggleReason: PropTypes.string,
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      targetSection: PropTypes.string
    })
  ).isRequired,
  onSelectResult: PropTypes.func.isRequired,
  registeredRoles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onSwitchRole: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  exportHref: PropTypes.string,
  onLogout: PropTypes.func,
  onOpenMobileNav: PropTypes.func.isRequired,
  onOpenWorkspace: PropTypes.func
};

DashboardHeaderBar.defaultProps = {
  activeSection: null,
  persona: null,
  lastRefreshedLabel: null,
  toggleMeta: null,
  toggleReason: null,
  loading: false,
  exportHref: null,
  onLogout: null,
  onOpenWorkspace: null
};

export default DashboardHeaderBar;
