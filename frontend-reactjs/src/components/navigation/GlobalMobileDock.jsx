import PropTypes from 'prop-types';
import clsx from 'clsx';
import { NavLink, useLocation } from 'react-router-dom';

function GlobalMobileDock({ links }) {
  const { pathname } = useLocation();

  if (!links.length) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
      aria-label="Global quick navigation"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between gap-1 px-2 py-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id} className="flex-1">
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition',
                    isActive || (item.activeMatch && pathname.startsWith(item.activeMatch))
                      ? 'bg-accent/10 text-accent shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null}
                <span className="leading-tight">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

GlobalMobileDock.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      activeMatch: PropTypes.string
    })
  ).isRequired
};

GlobalMobileDock.defaultProps = {};

export default GlobalMobileDock;
