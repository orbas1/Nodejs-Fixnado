import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const actionStyles = {
  primary:
    'inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  secondary:
    'inline-flex items-center justify-center rounded-full border border-primary/30 bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white'
};

function renderAction(action) {
  const className = actionStyles[action.variant ?? 'secondary'];

  if (action.to) {
    return (
      <Link key={action.label} to={action.to} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button
      key={action.label}
      type="button"
      onClick={action.onClick}
      className={className}
    >
      {action.label}
    </button>
  );
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  meta
}) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="text-slate-500 transition hover:text-primary focus:outline-none focus-visible:text-primary"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-primary">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-5">
            {eyebrow && (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                {eyebrow}
              </span>
            )}
            <div>
              <h1 className="text-3xl font-semibold text-primary md:text-4xl lg:text-5xl">{title}</h1>
              {description && <p className="mt-4 text-base text-slate-600 md:text-lg">{description}</p>}
            </div>
            {actions.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {actions.map((action) => renderAction(action))}
              </div>
            )}
          </div>

          <dl className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-lg shadow-primary/5">
            {meta.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{item.label}</dt>
                <dd className={clsx('text-lg font-semibold text-primary', item.emphasis && 'text-2xl md:text-3xl')}>
                  {item.value}
                </dd>
                {item.caption && <p className="text-xs text-slate-500">{item.caption}</p>}
              </div>
            ))}
          </dl>
        </div>
      </div>
    </header>
  );
}

PageHeader.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string
    })
  ),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(['primary', 'secondary'])
    })
  ),
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      caption: PropTypes.string,
      emphasis: PropTypes.bool
    })
  )
};

PageHeader.defaultProps = {
  eyebrow: undefined,
  description: undefined,
  breadcrumbs: [],
  actions: [],
  meta: []
};
