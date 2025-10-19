import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import RouteErrorBoundary from '../../components/error/RouteErrorBoundary.jsx';
import PersonaRouteLoader from '../components/PersonaRouteLoader.jsx';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/40 to-white">
      <Header />
      <main id="main-content" className="flex min-h-[60vh] flex-1 flex-col">
        <Suspense fallback={<PersonaRouteLoader persona="public" qa="route-loader.public" />}>
          <RouteErrorBoundary boundaryId="route-public" metadata={{ surface: 'public' }}>
            <Outlet />
          </RouteErrorBoundary>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
