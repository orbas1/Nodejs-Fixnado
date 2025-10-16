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
const AdminDisputeHealthHistory = lazy(() => import('./pages/AdminDisputeHealthHistory.jsx'));
const AdminHomeBuilder = lazy(() => import('./features/homeBuilder/AdminHomeBuilderPage.jsx'));
const AdminMonetization = lazy(() => import('./pages/AdminMonetization.jsx'));
const AdminProfile = lazy(() => import('./pages/AdminProfile.jsx'));
const AdminPreferences = lazy(() => import('./pages/AdminPreferences.jsx'));
const AdminEnterprise = lazy(() => import('./pages/AdminEnterprise.jsx'));
const AppearanceManagement = lazy(() => import('./pages/AppearanceManagement.jsx'));
const AdminInbox = lazy(() => import('./pages/AdminInbox.jsx'));
const AdminRentals = lazy(() => import('./pages/AdminRentals.jsx'));
const AdminPurchaseManagement = lazy(() => import('./pages/AdminPurchaseManagement.jsx'));
const AdminWebsiteManagement = lazy(() => import('./pages/AdminWebsiteManagement.jsx'));
const AdminLiveFeedAuditing = lazy(() => import('./pages/AdminLiveFeedAuditing.jsx'));
const AdminSystemSettings = lazy(() => import('./pages/AdminSystemSettings.jsx'));
const ThemeStudio = lazy(() => import('./pages/ThemeStudio.jsx'));
const TelemetryDashboard = lazy(() => import('./pages/TelemetryDashboard.jsx'));
const AdminMarketplace = lazy(() => import('./pages/AdminMarketplace.jsx'));
const AdminTaxonomy = lazy(() => import('./pages/AdminTaxonomy.jsx'));
const Communications = lazy(() => import('./pages/Communications.jsx'));
const CreationStudio = lazy(() => import('./pages/CreationStudio.jsx'));
const DashboardHub = lazy(() => import('./pages/DashboardHub.jsx'));
const RoleDashboard = lazy(() => import('./pages/RoleDashboard.jsx'));
const OrderWorkspace = lazy(() => import('./pages/OrderWorkspace.jsx'));
const FinanceOverview = lazy(() => import('./pages/FinanceOverview.jsx'));
const GeoMatching = lazy(() => import('./pages/GeoMatching.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'));
const AdminBlog = lazy(() => import('./pages/AdminBlog.jsx'));
const AdminZones = lazy(() => import('./pages/AdminZones.jsx'));
const AdminLegal = lazy(() => import('./pages/AdminLegal.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings.jsx'));
const CustomerSettingsDevPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/CustomerSettingsDevPreview.jsx'))
  : null;
const CompliancePortal = lazy(() => import('./pages/CompliancePortal.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const AdminSeo = lazy(() => import('./pages/AdminSeo.jsx'));

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
              <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
              <Route path="/account/profile" element={<Profile />} />
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
                path="/admin/profile"
                element={
                  <AdminProtectedRoute>
                    <AdminProfile />
                path="/admin/disputes/health/:bucketId/history"
                element={
                  <AdminProtectedRoute>
                    <AdminDisputeHealthHistory />
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
                path="/admin/rentals"
                element={
                  <AdminProtectedRoute>
                    <AdminRentals />
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
                path="/admin/preferences"
                element={
                  <AdminProtectedRoute>
                    <AdminPreferences />
                path="/admin/enterprise"
                element={
                  <AdminProtectedRoute>
                    <AdminEnterprise />
                path="/admin/marketplace"
                element={
                  <AdminProtectedRoute>
                    <AdminMarketplace />
                path="/admin/appearance"
                element={
                  <AdminProtectedRoute>
                    <AppearanceManagement />
                path="/admin/inbox"
                element={
                  <AdminProtectedRoute>
                    <AdminInbox />
                path="/admin/purchases"
                element={
                  <AdminProtectedRoute>
                    <AdminPurchaseManagement />
                path="/admin/website-management"
                element={
                  <AdminProtectedRoute>
                    <AdminWebsiteManagement />
                path="/admin/live-feed/auditing"
                element={
                  <AdminProtectedRoute>
                    <AdminLiveFeedAuditing />
                path="/admin/system-settings"
                element={
                  <AdminProtectedRoute>
                    <AdminSystemSettings />
                path="/admin/taxonomy"
                element={
                  <AdminProtectedRoute>
                    <AdminTaxonomy />
                path="/admin/seo"
                element={
                  <AdminProtectedRoute>
                    <AdminSeo />
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
              <Route
                path="/admin/legal/:slug?"
                element={
                  <AdminProtectedRoute>
                    <AdminLegal />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/communications" element={<Communications />} />
              <Route path="/creation-studio" element={<CreationStudio />} />
              <Route path="/operations/geo-matching" element={<GeoMatching />} />
              <Route path="/dashboards" element={<DashboardHub />} />
              <Route path="/dashboards/finance" element={<FinanceOverview />} />
              <Route path="/dashboards/enterprise/panel" element={<EnterprisePanel />} />
              <Route path="/dashboards/orders/:orderId" element={<OrderWorkspace />} />
              <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/:slug" element={<Terms />} />
              {import.meta.env.DEV && CustomerSettingsDevPreview ? (
                <Route path="/dev/customer-settings" element={<CustomerSettingsDevPreview />} />
              ) : null}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteErrorBoundary>
        </Suspense>
      </main>
      {!isDashboardExperience && <Footer />}
      <FloatingChatLauncher isAuthenticated={isAuthenticated} />
      <ConsentBanner />
    </div>
  );
}

export default App;
