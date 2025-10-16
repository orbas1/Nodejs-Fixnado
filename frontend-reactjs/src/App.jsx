import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import SkipToContent from './components/accessibility/SkipToContent.jsx';
import Spinner from './components/ui/Spinner.jsx';
import FloatingChatLauncher from './components/communications/FloatingChatLauncher.jsx';
import RouteErrorBoundary from './components/error/RouteErrorBoundary.jsx';
import { useLocale } from './hooks/useLocale.js';
import { useSession } from './hooks/useSession.js';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute.jsx';
import ProviderProtectedRoute from './components/auth/ProviderProtectedRoute.jsx';
import ConsentBanner from './components/legal/ConsentBanner.jsx';

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
const Tools = lazy(() => import('./pages/Tools.jsx'));
const Materials = lazy(() => import('./pages/Materials.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminHomeBuilder = lazy(() => import('./features/homeBuilder/AdminHomeBuilderPage.jsx'));
const AdminMonetization = lazy(() => import('./pages/AdminMonetization.jsx'));
const ThemeStudio = lazy(() => import('./pages/ThemeStudio.jsx'));
const TelemetryDashboard = lazy(() => import('./pages/TelemetryDashboard.jsx'));
const Communications = lazy(() => import('./pages/Communications.jsx'));
const CreationStudio = lazy(() => import('./pages/CreationStudio.jsx'));
const DashboardHub = lazy(() => import('./pages/DashboardHub.jsx'));
const RoleDashboard = lazy(() => import('./pages/RoleDashboard.jsx'));
const FinanceOverview = lazy(() => import('./pages/FinanceOverview.jsx'));
const GeoMatching = lazy(() => import('./pages/GeoMatching.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'));
const AdminBlog = lazy(() => import('./pages/AdminBlog.jsx'));
const AdminZones = lazy(() => import('./pages/AdminZones.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings.jsx'));
const CompliancePortal = lazy(() => import('./pages/CompliancePortal.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function App() {
  const { t } = useLocale();
  const location = useLocation();
  const { isAuthenticated } = useSession();
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
          <RouteErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/company" element={<CompanyRegister />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route
                path="/provider/storefront"
                element={
                  <ProviderProtectedRoute>
                    <ProviderStorefront />
                  </ProviderProtectedRoute>
                }
              />
              <Route path="/enterprise/panel" element={<Navigate to="/dashboards/enterprise/panel" replace />} />
              <Route path="/providers" element={<BusinessFront />} />
              <Route path="/providers/:slug" element={<BusinessFront />} />
              <Route path="/search" element={<Search />} />
              <Route path="/services" element={<Services />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
              <Route path="/compliance/data-requests" element={<CompliancePortal />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
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
                path="/admin/home-builder"
                element={
                  <AdminProtectedRoute>
                    <AdminHomeBuilder />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/blog"
                element={
                  <AdminProtectedRoute>
                    <AdminBlog />
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
              <Route
                path="/admin/zones"
                element={
                  <AdminProtectedRoute>
                    <AdminZones />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/communications" element={<Communications />} />
              <Route path="/creation-studio" element={<CreationStudio />} />
              <Route path="/operations/geo-matching" element={<GeoMatching />} />
              <Route path="/dashboards" element={<DashboardHub />} />
              <Route path="/dashboards/finance" element={<FinanceOverview />} />
              <Route path="/dashboards/enterprise/panel" element={<EnterprisePanel />} />
              <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteErrorBoundary>
        </Suspense>
      </main>
      {!isDashboardExperience && <Footer />}
      {!isDashboardExperience && (
        <FloatingChatLauncher isAuthenticated={isAuthenticated} />
      )}
      <ConsentBanner />
    </div>
  );
}

export default App;
