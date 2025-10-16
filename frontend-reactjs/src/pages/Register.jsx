import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SocialAuthButtons from '../components/auth/SocialAuthButtons.jsx';
import { registerUser, loginUser } from '../api/sessionClient.js';
import { initialiseSessionFromLogin } from '../utils/sessionStorage.js';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  street: '',
  addressLine2: '',
  town: '',
  city: '',
  country: '',
  postcode: '',
  dob: ''
};

function buildAddress({ street, addressLine2, town, city, postcode, country }) {
  return [street, addressLine2, [town, city].filter(Boolean).join(', '), postcode, country]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join('\n');
}

export default function Register() {
  const navigate = useNavigate();
  const controlWidthClass = 'w-full max-w-sm';
  const fieldGroupClass = 'w-full max-w-2xl';
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const age = useMemo(() => {
    if (!form.dob) {
      return null;
    }
    const dob = new Date(form.dob);
    if (Number.isNaN(dob.getTime())) {
      return null;
    }
    const diff = Date.now() - dob.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
  }, [form.dob]);

  const handleChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setStatus('');

    try {
      await registerUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        type: 'user',
        address: buildAddress(form),
        age: age ?? undefined
      });

      const loginPayload = await loginUser({
        email: form.email.trim(),
        password: form.password,
        rememberMe: true
      });

      initialiseSessionFromLogin(loginPayload);
      setStatus('Account created successfully. Redirecting you to your feed...');
      setTimeout(() => navigate('/feed', { replace: true }), 900);
    } catch (caught) {
      console.error('[register] unable to complete registration', caught);
      setError(caught?.message ?? 'Registration failed. Double check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-12">
      <div className="grid gap-10 rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-2xl shadow-accent/10 md:grid-cols-2">
        <div className="max-w-sm">
          <h1 className="text-3xl font-semibold text-primary">Join the Fixnado marketplace</h1>
          <p className="mt-3 text-sm text-slate-500">
            Create an account to book trusted crews, sell your expertise, or stock up on the tools and materials you need on demand.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              Escrow-backed payments that release when the work is done.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              Verified pros with live availability across every service zone.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              Marketplace access for rental gear, consumables, and delivery scheduling.
            </li>
          </ul>
        </div>
        <form className="grid gap-5 justify-items-center" onSubmit={handleSubmit}>
          <div className={`grid ${fieldGroupClass} gap-4 md:grid-cols-2 md:gap-5`}>
            <label className={`flex w-full max-w-sm flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-first-name">
              First name
              <input
                id="register-first-name"
                type="text"
                required
                value={form.firstName}
                onChange={(event) => handleChange({ firstName: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                autoComplete="given-name"
              />
            </label>
            <label className={`flex w-full max-w-sm flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-last-name">
              Last name
              <input
                id="register-last-name"
                type="text"
                required
                value={form.lastName}
                onChange={(event) => handleChange({ lastName: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                autoComplete="family-name"
              />
            </label>
          </div>
          <label className={`flex ${controlWidthClass} flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-email">
            Email
            <input
              id="register-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => handleChange({ email: event.target.value })}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              autoComplete="email"
            />
          </label>
          <label className={`flex ${controlWidthClass} flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-password">
            Password
            <input
              id="register-password"
              type="password"
              required
              value={form.password}
              onChange={(event) => handleChange({ password: event.target.value })}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              autoComplete="new-password"
            />
          </label>
          <div className={`grid ${fieldGroupClass} gap-4`}>
            <label className={`flex w-full flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-street">
              Street address
              <input
                id="register-street"
                type="text"
                autoComplete="address-line1"
                required
                value={form.street}
                onChange={(event) => handleChange({ street: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            <label className={`flex w-full flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-address-line2">
              Address line 2 (optional)
              <input
                id="register-address-line2"
                type="text"
                autoComplete="address-line2"
                value={form.addressLine2}
                onChange={(event) => handleChange({ addressLine2: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <div className={`grid ${fieldGroupClass} gap-4 md:grid-cols-2`}>
            <label className={`flex w-full flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-town">
              Town / district
              <input
                id="register-town"
                type="text"
                autoComplete="address-level3"
                value={form.town}
                onChange={(event) => handleChange({ town: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            <label className={`flex w-full flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-city">
              City
              <input
                id="register-city"
                type="text"
                autoComplete="address-level2"
                required
                value={form.city}
                onChange={(event) => handleChange({ city: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <div className={`grid ${fieldGroupClass} gap-4 md:grid-cols-2`}>
            <label className={`flex w-full flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-country">
              Country
              <input
                id="register-country"
                type="text"
                autoComplete="country-name"
                required
                value={form.country}
                onChange={(event) => handleChange({ country: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            <label className={`flex w-full flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-postcode">
              Postcode
              <input
                id="register-postcode"
                type="text"
                autoComplete="postal-code"
                required
                value={form.postcode}
                onChange={(event) => handleChange({ postcode: event.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <label className={`flex ${controlWidthClass} flex-col text-left text-sm font-medium text-slate-600`} htmlFor="register-dob">
            Date of birth
            <input
              id="register-dob"
              type="date"
              required
              value={form.dob}
              onChange={(event) => handleChange({ dob: event.target.value })}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          {error ? <p className="w-full max-w-sm text-sm font-semibold text-rose-600">{error}</p> : null}
          {status ? <p className="w-full max-w-sm text-sm text-emerald-600">{status}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className={`${controlWidthClass} rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-400`}
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
          <p className="w-full max-w-sm text-xs text-slate-500">
            Start as a customer profile today—once you are in the dashboard you can register as a service professional,
            upgrade to SME/enterprise access, or onboard your business from the dedicated flows.
          </p>
          <SocialAuthButtons className="mt-2" />
          <p className="text-xs text-slate-500">
            By continuing you agree to our terms of service and privacy policy.
          </p>
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent">
              Log in
            </Link>
          </p>
          <p className="text-sm text-slate-500">
            Ready to bring your business onboard right away?{' '}
            <Link to="/register/company" className="font-semibold text-accent">
              Start the SME/company sign-up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
