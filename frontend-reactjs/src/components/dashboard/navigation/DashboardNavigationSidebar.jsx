import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Bars3BottomLeftIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import getNavIcon from './navigationUtils.js';

const DashboardNavigationSidebar = ({
  collapsed,
  onToggleCollapse,
  roleMeta,
  navigation,
  activeSectionId,
  onSelectSection
}) => (
  <aside
    className={`hidden lg:flex ${collapsed ? 'w-24' : 'w-80 xl:w-96'} flex-col border-r border-accent/10 bg-gradient-to-b from-white via-secondary/40 to-white transition-[width] duration-300`}
  >
    <div className="flex items-center justify-between border-b border-accent/10 px-6 py-5">
      <Link to="/dashboards" className="flex items-center gap-2 text-primary" title="Dashboard hub">
        <Bars3BottomLeftIcon className="h-6 w-6 text-accent" />
        {!collapsed ? (
          <div className="leading-tight">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Fixnado</p>
            <p className="text-lg font-semibold">{roleMeta.name}</p>
          </div>
        ) : null}
      </Link>
      <button
        type="button"
        onClick={onToggleCollapse}
        className="rounded-full border border-accent/20 bg-white p-2 text-slate-500 transition hover:border-accent hover:text-accent"
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        <Squares2X2Icon className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
      {navigation.map((item) => {
        const isActive = item.id === activeSectionId;
        const Icon = getNavIcon(item);
        const baseClasses = 'group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition';
        const stateClasses = isActive
          ? 'border-accent bg-accent text-white shadow-glow'
          : 'border-transparent bg-white/80 text-primary/80 hover:border-accent/40 hover:text-primary';
        const spacingClasses = collapsed ? 'justify-center px-2' : '';
        const iconClasses = isActive
          ? 'bg-white/20 text-white'
          : 'bg-secondary text-primary group-hover:bg-accent/10 group-hover:text-accent';
        const content = (
          <>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClasses}`}>
              <Icon className="h-5 w-5" />
            </span>
            {!collapsed ? (
              <div className="flex-1">
                <p className="text-sm font-semibold" title={item.label}>
                  {item.menuLabel}
                </p>
                {item.description ? <p className="sr-only">{item.description}</p> : null}
              </div>
            ) : null}
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.id}
              to={item.href}
              className={`${baseClasses} ${stateClasses} ${spacingClasses}`}
              title={collapsed ? item.label : undefined}
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
            onClick={() => onSelectSection(item.id)}
            className={`${baseClasses} ${stateClasses} ${spacingClasses}`}
            title={collapsed ? item.label : undefined}
            aria-pressed={isActive}
          >
            {content}
          </button>
        );
      })}
    </nav>
  </aside>
);

DashboardNavigationSidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
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
  onSelectSection: PropTypes.func.isRequired
};

DashboardNavigationSidebar.defaultProps = {
  activeSectionId: null
};

export default DashboardNavigationSidebar;
