import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CompanyRegister from './pages/CompanyRegister.jsx';
import Feed from './pages/Feed.jsx';
import BusinessFront from './pages/BusinessFront.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';
import EnterprisePanel from './pages/EnterprisePanel.jsx';
import Search from './pages/Search.jsx';
import Services from './pages/Services.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ThemeStudio from './pages/ThemeStudio.jsx';
import TelemetryDashboard from './pages/TelemetryDashboard.jsx';
import Communications from './pages/Communications.jsx';

function App() {
  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/company" element={<CompanyRegister />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/provider/dashboard" element={<ProviderDashboard />} />
          <Route path="/enterprise/panel" element={<EnterprisePanel />} />
          <Route path="/providers" element={<BusinessFront />} />
          <Route path="/providers/:slug" element={<BusinessFront />} />
          <Route path="/search" element={<Search />} />
          <Route path="/services" element={<Services />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/theme-studio" element={<ThemeStudio />} />
          <Route path="/admin/telemetry" element={<TelemetryDashboard />} />
          <Route path="/communications" element={<Communications />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
