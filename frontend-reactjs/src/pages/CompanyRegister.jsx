import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding';
import { registerUser, loginUser } from '../api/sessionClient.js';
import { initialiseSessionFromLogin } from '../utils/sessionStorage.js';

const INITIAL_FORM = {
  businessName: '',
  legalStructure: 'sole trader',
  contactFirstName: '',
  contactLastName: '',
  contactEmail: '',
  password: '',
  confirmPassword: '',
  serviceRegions: '',
  marketplaceIntent: '',
  uploadInsurance: false,
  consentIdentity: false,
  acceptPolicies: false
};

function buildContactName(firstName, lastName) {
  return [firstName, lastName]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join(' ');
}

export default function CompanyRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const formValid = useMemo(() => {
    if (!form.uploadInsurance || !form.consentIdentity || !form.acceptPolicies) {
      return false;
    }
    if (!form.businessName.trim() || !form.contactFirstName.trim() || !form.contactLastName.trim()) {
      return false;
    }
    if (!form.contactEmail.trim() || !form.password || form.password !== form.confirmPassword) {
      return false;
    }
    return true;
  }, [form]);

  const handleChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!formValid) {
      setError('Complete all mandatory fields, agree to the checks, and ensure your passwords match.');
      return;
    }

    setSubmitting(true);

    try {
      const contactName = buildContactName(form.contactFirstName, form.contactLastName);
      await registerUser({
        firstName: form.contactFirstName.trim(),
        lastName: form.contactLastName.trim(),
        email: form.contactEmail.trim(),
        password: form.password,
        type: 'company',
        company: {
          legalStructure: form.legalStructure,
          contactName,
          contactEmail: form.contactEmail.trim(),
          serviceRegions: form.serviceRegions.trim(),
          marketplaceIntent: form.marketplaceIntent.trim()
        }
      });

      const loginPayload = await loginUser({
        email: form.contactEmail.trim(),
        password: form.password,
        rememberMe: true
      });

      initialiseSessionFromLogin(loginPayload);
      setStatus('Company profile created. Redirecting you to the provider workspace...');
      setTimeout(() => navigate('/dashboards/provider', { replace: true }), 900);
    } catch (caught) {
      console.error('[company-register] unable to provision company account', caught);
      setError(caught?.message ?? 'Company registration failed. Try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-2xl shadow-accent/10">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Fixnado" className="h-12 w-12 object-contain" loading="lazy" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">Company & sole trader onboarding</h1>
            <p className="text-sm text-slate-500">Unlock team dashboards, service zones, and marketplace shops.</p>
          </div>
        </div>
        <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Business name
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                value={form.businessName}
                onChange={(event) => handleChange({ businessName: event.target.value })}
                required
                autoComplete="organization"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Legal structure
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                value={form.legalStructure}
                onChange={(event) => handleChange({ legalStructure: event.target.value })}
              >
                <option value="sole trader">Sole trader</option>
                <option value="company">Company</option>
                <option value="partnership">Partnership</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Contact first name
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                value={form.contactFirstName}
                onChange={(event) => handleChange({ contactFirstName: event.target.value })}
                required
                autoComplete="given-name"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Contact last name
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                value={form.contactLastName}
                onChange={(event) => handleChange({ contactLastName: event.target.value })}
                required
                autoComplete="family-name"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Contact email
              <input
                type="email"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                value={form.contactEmail}
                onChange={(event) => handleChange({ contactEmail: event.target.value })}
                required
                autoComplete="email"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Marketplace password
              <input
                type="password"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                value={form.password}
                onChange={(event) => handleChange({ password: event.target.value })}
                required
                autoComplete="new-password"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-slate-600">
            Confirm password
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              value={form.confirmPassword}
              onChange={(event) => handleChange({ confirmPassword: event.target.value })}
              required
              autoComplete="new-password"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Service regions
            <textarea
              className="mt-1 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="List your preferred service zones or upload geojson"
              value={form.serviceRegions}
              onChange={(event) => handleChange({ serviceRegions: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Marketplace intent
            <textarea
              className="mt-1 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="Describe items you plan to sell or rent"
              value={form.marketplaceIntent}
              onChange={(event) => handleChange({ marketplaceIntent: event.target.value })}
            />
          </label>
          <div className="grid gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm text-slate-600">
            <p className="font-semibold text-primary">Verification checklist</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={form.uploadInsurance}
                onChange={(event) => handleChange({ uploadInsurance: event.target.checked })}
              />
              I will upload liability insurance
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={form.consentIdentity}
                onChange={(event) => handleChange({ consentIdentity: event.target.checked })}
              />
              I consent to identity verification
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={form.acceptPolicies}
                onChange={(event) => handleChange({ acceptPolicies: event.target.checked })}
              />
              I agree to marketplace policies
            </label>
          </div>
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          <button
            type="submit"
            disabled={submitting || !formValid}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
}
