import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import SkipToContent from './components/accessibility/SkipToContent.jsx';
import Spinner from './components/ui/Spinner.jsx';
import { useLocale } from './hooks/useLocale.js';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const CompanyRegister = lazy(() => import('./pages/CompanyRegister.jsx'));
const Feed = lazy(() => import('./pages/Feed.jsx'));
const BusinessFront = lazy(() => import('./pages/BusinessFront.jsx'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard.jsx'));
const ProviderStorefront = lazy(() => import('./pages/ProviderStorefront.jsx'));
const EnterprisePanel = lazy(() => import('./pages/EnterprisePanel.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminMonetization = lazy(() => import('./pages/AdminMonetization.jsx'));
const ThemeStudio = lazy(() => import('./pages/ThemeStudio.jsx'));
const TelemetryDashboard = lazy(() => import('./pages/TelemetryDashboard.jsx'));
const Communications = lazy(() => import('./pages/Communications.jsx'));
const DashboardHub = lazy(() => import('./pages/DashboardHub.jsx'));
const RoleDashboard = lazy(() => import('./pages/RoleDashboard.jsx'));
const GeoMatching = lazy(() => import('./pages/GeoMatching.jsx'));

function App() {
  const { t } = useLocale();
  const location = useLocation();
  const isDashboardExperience = location.pathname.startsWith('/dashboards');

  return (
    <div className={`min-h-screen flex flex-col ${isDashboardExperience ? 'bg-slate-50' : 'gradient-bg'}`}>
      <SkipToContent />
      {!isDashboardExperience && <Header />}
      <main className="flex-1" id="main-content">
        <Suspense
          fallback={
            <div
              className="flex min-h-[50vh] items-center justify-center"
              role="status"
              aria-live="polite"
              data-qa="route-loader"
            >
              <Spinner className="h-8 w-8 text-primary" />
              <span className="sr-only">{t('common.loading')}</span>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/company" element={<CompanyRegister />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/provider/dashboard" element={<ProviderDashboard />} />
            <Route path="/provider/storefront" element={<ProviderStorefront />} />
            <Route path="/enterprise/panel" element={<EnterprisePanel />} />
            <Route path="/providers" element={<BusinessFront />} />
            <Route path="/providers/:slug" element={<BusinessFront />} />
            <Route path="/search" element={<Search />} />
            <Route path="/services" element={<Services />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/monetisation"
              element={
                <AdminProtectedRoute>
                  <AdminMonetization />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/theme-studio"
              element={
                <AdminProtectedRoute>
                  <ThemeStudio />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/telemetry"
              element={
                <AdminProtectedRoute>
                  <TelemetryDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route path="/communications" element={<Communications />} />
            <Route path="/operations/geo-matching" element={<GeoMatching />} />
            <Route path="/dashboards" element={<DashboardHub />} />
            <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
          </Routes>
        </Suspense>
      </main>
      {!isDashboardExperience && <Footer />}
    </div>
  );
}

export default App;
