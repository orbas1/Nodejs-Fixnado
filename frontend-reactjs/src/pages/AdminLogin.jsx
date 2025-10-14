import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, LockClosedIcon, KeyIcon } from '@heroicons/react/24/outline';
import { LOGO_URL } from '../constants/branding';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';

const INITIAL_FORM = {
  email: '',
  password: '',
  securityToken: ''
};

function Field({ id, label, type = 'text', value, onChange, autoComplete, icon: Icon, helper, required = true }) {
  return (
    <label className="group grid gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-primary/80 flex items-center gap-2">
        {Icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange}
        required={required}
        className="w-full rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-primary shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {helper ? <p className="text-xs text-primary/60">{helper}</p> : null}
    </label>
  );
}

Field.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  autoComplete: PropTypes.string,
  icon: PropTypes.elementType,
  helper: PropTypes.string,
  required: PropTypes.bool
};

Field.defaultProps = {
  type: 'text',
  autoComplete: undefined,
  icon: null,
  helper: null,
  required: true
};

export default function AdminLogin() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, error } = useAdminSession();

  const redirectPath = useMemo(() => {
    const fromState = location.state;
    if (fromState?.from?.pathname) {
      return fromState.from.pathname;
    }
    return '/admin/dashboard';
  }, [location.state]);

  const bannerMessage = useMemo(() => {
    if (location.state?.reason === 'sessionExpired') {
      return 'Your secure admin session ended. Please authenticate again to continue.';
    }
    if (location.state?.reason === 'signedOut') {
      return 'You have been signed out. Sign in again to access the admin control tower.';
    }
    return null;
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, redirectPath]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const email = form.email.trim();
    const password = form.password.trim();
    const securityToken = form.securityToken.trim();

    if (!email || !password || !securityToken) {
      setFormError('Email, password, and security token are required to access admin controls.');
      return;
    }

    try {
      await login({ email, password, securityToken });
      navigate(redirectPath, { replace: true });
    } catch (caught) {
      setFormError(caught?.message ?? 'Unable to authenticate admin user.');
    }
  };

  const errorMessage = formError || error?.message || null;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/20 px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,69,224,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.14),_transparent_60%)]" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-primary/10 bg-white/90 shadow-2xl shadow-primary/15 backdrop-blur">
        <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
          <div className="px-10 py-12 sm:px-14">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Fixnado" className="h-12 w-12 rounded-2xl border border-primary/20 bg-white object-contain p-2" loading="lazy" />
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.4em] text-primary/50">Admin operations</p>
                <h1 className="text-3xl font-semibold text-primary">Control tower access</h1>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-primary/70">
              Hardened authentication for Fixnado administrators. Use your corporate credentials and rotating hardware token to
              unlock dispute, compliance, and automation controls.
            </p>

            {bannerMessage ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-700">
                {bannerMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <form className="mt-8 grid gap-6" onSubmit={handleSubmit} noValidate>
              <Field
                id="email"
                label="Admin email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                icon={ShieldCheckIcon}
                helper="Only whitelisted domains are authorised for the Fixnado control plane."
              />
              <Field
                id="password"
                label="Password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                icon={LockClosedIcon}
                helper="Minimum 12 characters with hardware-backed MFA enforced."
              />
              <Field
                id="securityToken"
                label="Security token"
                type="text"
                value={form.securityToken}
                onChange={handleChange}
                autoComplete="one-time-code"
                icon={KeyIcon}
                helper="Enter the rotating token from your Fixnado authenticator module."
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                <ShieldCheckIcon className={`h-5 w-5 ${loading ? 'animate-pulse' : ''}`} aria-hidden="true" />
                {loading ? 'Verifying credentials…' : 'Access admin dashboard'}
              </button>
              <p className="text-xs text-primary/60">
                Sessions automatically expire after periods of inactivity. Contact security operations if you need emergency access
                or hardware token resets.
              </p>
            </form>
          </div>
          <aside className="hidden flex-col justify-between border-l border-primary/10 bg-gradient-to-b from-primary/5 via-white to-secondary/10 px-10 py-12 md:flex">
            <div className="space-y-6">
              <div className="rounded-2xl border border-primary/20 bg-white/70 p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary">Command readiness checklist</p>
                <ul className="mt-4 space-y-3 text-sm text-primary/70">
                  <li>• Review overnight dispute escalations and compliance holdouts.</li>
                  <li>• Confirm automation deployments in sandbox before promoting to live queues.</li>
                  <li>• Sync with treasury on escrow movements over £100k.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-white/70 p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary">Need assistance?</p>
                <p className="mt-2 text-sm text-primary/70">
                  Reach the 24/7 security desk on +44 20 1234 5678 or security@fixnado.com. We track all access requests and
                  incident bridges.
                </p>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary/40">Fixnado enterprise</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
