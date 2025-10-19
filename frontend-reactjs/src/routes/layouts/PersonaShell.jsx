import { Fragment, Suspense } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Outlet } from 'react-router-dom';
import RouteErrorBoundary from '../../components/error/RouteErrorBoundary.jsx';
import PersonaRouteLoader from '../components/PersonaRouteLoader.jsx';

export default function PersonaShell({
  persona,
  guard: GuardComponent,
  loaderQa,
  loaderTitle,
  loaderDescription,
  className,
  contentClassName,
  metadata,
  guardProps
}) {
  const Guard = GuardComponent || Fragment;

  return (
    <Guard {...(guardProps || {})}>
      <div
        className={clsx('min-h-screen bg-slate-50 text-slate-900', className)}
        data-qa={`persona-shell.${persona}`}
      >
        <main id="main-content" className={clsx('flex min-h-[60vh] flex-1 flex-col', contentClassName)}>
          <Suspense
            fallback={
              <PersonaRouteLoader
                persona={persona}
                qa={loaderQa ?? `route-loader.${persona}`}
                title={loaderTitle}
                description={loaderDescription}
              />
            }
          >
            <RouteErrorBoundary
              boundaryId={`route-${persona}`}
              metadata={{ surface: persona, ...metadata }}
            >
              <Outlet />
            </RouteErrorBoundary>
          </Suspense>
        </main>
      </div>
    </Guard>
  );
}

PersonaShell.propTypes = {
  persona: PropTypes.string.isRequired,
  guard: PropTypes.elementType,
  loaderQa: PropTypes.string,
  loaderTitle: PropTypes.string,
  loaderDescription: PropTypes.string,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  metadata: PropTypes.object,
  guardProps: PropTypes.object
};

PersonaShell.defaultProps = {
  guard: undefined,
  loaderQa: undefined,
  loaderTitle: undefined,
  loaderDescription: undefined,
  className: undefined,
  contentClassName: undefined,
  metadata: undefined,
  guardProps: undefined
};
