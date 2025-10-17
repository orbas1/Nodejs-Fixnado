import { useMemo } from 'react';
import Button from '../../../../components/ui/Button.jsx';
import { useServicemanTax } from '../ServicemanTaxProvider.jsx';

const defaultDraft = (profile = {}) => ({
  filingStatus: profile.filingStatus ?? 'sole_trader',
  residencyCountry: profile.residencyCountry ?? '',
  residencyRegion: profile.residencyRegion ?? '',
  vatRegistered: Boolean(profile.vatRegistered),
  vatNumber: profile.vatNumber ?? '',
  utrNumber: profile.utrNumber ?? '',
  companyNumber: profile.companyNumber ?? '',
  taxAdvisorName: profile.taxAdvisorName ?? '',
  taxAdvisorEmail: profile.taxAdvisorEmail ?? '',
  taxAdvisorPhone: profile.taxAdvisorPhone ?? '',
  remittanceCycle: profile.remittanceCycle ?? 'monthly',
  withholdingRate: profile.withholdingRate != null ? String(profile.withholdingRate) : '',
  lastFilingSubmittedAt: profile.lastFilingSubmittedAt ? profile.lastFilingSubmittedAt.slice(0, 10) : '',
  nextDeadlineAt: profile.nextDeadlineAt ? profile.nextDeadlineAt.slice(0, 10) : '',
  notes: profile.notes ?? ''
});

export default function TaxProfileCard() {
  const {
    workspace,
    profileDraft,
    handleProfileFieldChange,
    saveProfile,
    profileSaving,
    profileFeedback,
    profileError,
    permissions,
    setProfileDraft
  } = useServicemanTax();

  const metadata = workspace?.metadata ?? {};
  const canEdit = permissions?.canManageProfile !== false;

  const filingStatusOptions = useMemo(() => {
    const options = metadata.profileFilingStatuses?.length
      ? metadata.profileFilingStatuses
      : ['sole_trader', 'limited_company', 'partnership', 'umbrella', 'other'];
    return options.map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [metadata.profileFilingStatuses]);

  const remittanceOptions = useMemo(() => {
    const options = metadata.remittanceCycles?.length
      ? metadata.remittanceCycles
      : ['monthly', 'quarterly', 'annually', 'ad_hoc'];
    return options.map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [metadata.remittanceCycles]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await saveProfile(profileDraft);
  };

  const resetDraft = () => {
    setProfileDraft(defaultDraft(workspace?.profile ?? {}));
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Tax profile</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Configure the servicing entity’s tax posture, residency, and advisor relationships. This data powers deadlines,
            automation rules, and compliance exports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={resetDraft} disabled={profileSaving}>
            Reset changes
          </Button>
          <Button type="submit" form="serviceman-tax-profile-form" disabled={!canEdit || profileSaving}>
            {profileSaving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </div>

      <form id="serviceman-tax-profile-form" className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filing status</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.filingStatus}
              onChange={(event) => handleProfileFieldChange('filingStatus', event.target.value)}
              disabled={!canEdit}
            >
              {filingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remittance cadence</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.remittanceCycle}
              onChange={(event) => handleProfileFieldChange('remittanceCycle', event.target.value)}
              disabled={!canEdit}
            >
              {remittanceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax residency country</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 uppercase tracking-wide text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              maxLength={2}
              value={profileDraft.residencyCountry}
              onChange={(event) => handleProfileFieldChange('residencyCountry', event.target.value.toUpperCase())}
              placeholder="GB"
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax residency region</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.residencyRegion}
              onChange={(event) => handleProfileFieldChange('residencyRegion', event.target.value)}
              placeholder="England"
              disabled={!canEdit}
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 md:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={profileDraft.vatRegistered}
              onChange={(event) => handleProfileFieldChange('vatRegistered', event.target.checked)}
              disabled={!canEdit}
            />
            <span>
              VAT registered
              <span className="block text-xs text-slate-500">Enable to track VAT returns, MTD compliance, and VAT numbers.</span>
            </span>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">VAT number</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.vatNumber}
              onChange={(event) => handleProfileFieldChange('vatNumber', event.target.value)}
              placeholder="GB123456789"
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">UTR</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.utrNumber}
              onChange={(event) => handleProfileFieldChange('utrNumber', event.target.value)}
              placeholder="Unique Taxpayer Reference"
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company number</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.companyNumber}
              onChange={(event) => handleProfileFieldChange('companyNumber', event.target.value)}
              placeholder="Companies House reference"
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax advisor name</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.taxAdvisorName}
              onChange={(event) => handleProfileFieldChange('taxAdvisorName', event.target.value)}
              placeholder="Accounting partner"
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax advisor email</span>
            <input
              type="email"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.taxAdvisorEmail}
              onChange={(event) => handleProfileFieldChange('taxAdvisorEmail', event.target.value)}
              placeholder="advisor@firm.com"
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax advisor phone</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.taxAdvisorPhone}
              onChange={(event) => handleProfileFieldChange('taxAdvisorPhone', event.target.value)}
              placeholder="+44 0000 000000"
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Withholding rate (%)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.withholdingRate}
              onChange={(event) => handleProfileFieldChange('withholdingRate', event.target.value)}
              placeholder="20"
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last filing submitted</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.lastFilingSubmittedAt}
              onChange={(event) => handleProfileFieldChange('lastFilingSubmittedAt', event.target.value)}
              disabled={!canEdit}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next deadline</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={profileDraft.nextDeadlineAt}
              onChange={(event) => handleProfileFieldChange('nextDeadlineAt', event.target.value)}
              disabled={!canEdit}
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
          <textarea
            rows={4}
            className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={profileDraft.notes}
            onChange={(event) => handleProfileFieldChange('notes', event.target.value)}
            placeholder="Internal notes about tax history, compliance obligations, or adviser agreements."
            disabled={!canEdit}
          />
        </label>
        {profileFeedback ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {profileFeedback}
          </div>
        ) : null}
        {profileError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {profileError.message ?? 'Failed to save tax profile'}
          </div>
        ) : null}
        {!canEdit ? (
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            You have read-only access. Contact an administrator to update profile permissions.
          </p>
        ) : null}
      </form>
    </section>
  );
}
