import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, FormField, StatusPill, TextInput, Checkbox } from '../../../../components/ui/index.js';

function formatDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

const DEFAULT_FILING_STATUS = 'scheduled';

function ProviderTaxManagementPanel({
  companyId,
  taxProfile,
  taxFilings,
  taxStats,
  enums,
  handlers,
  disabled
}) {
  const [profileForm, setProfileForm] = useState({
    registrationNumber: '',
    registrationCountry: '',
    registrationRegion: '',
    registrationStatus: 'not_registered',
    vatRegistered: false,
    registrationEffectiveFrom: '',
    defaultRate: '0.2',
    thresholdAmount: '',
    thresholdCurrency: 'GBP',
    filingFrequency: 'annual',
    nextFilingDueAt: '',
    lastFiledAt: '',
    accountingMethod: 'accrual',
    certificateUrl: '',
    exemptionReason: '',
    taxAdvisor: '',
    notes: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (!taxProfile) {
      return;
    }
    setProfileForm({
      registrationNumber: taxProfile.registrationNumber ?? '',
      registrationCountry: taxProfile.registrationCountry ?? '',
      registrationRegion: taxProfile.registrationRegion ?? '',
      registrationStatus: taxProfile.registrationStatus ?? 'not_registered',
      vatRegistered: Boolean(taxProfile.vatRegistered),
      registrationEffectiveFrom: formatDateInput(taxProfile.registrationEffectiveFrom),
      defaultRate: taxProfile.defaultRate !== undefined ? String(taxProfile.defaultRate) : '0',
      thresholdAmount:
        taxProfile.thresholdAmount !== null && taxProfile.thresholdAmount !== undefined
          ? String(taxProfile.thresholdAmount)
          : '',
      thresholdCurrency: taxProfile.thresholdCurrency ?? taxProfile.defaultCurrency ?? 'GBP',
      filingFrequency: taxProfile.filingFrequency ?? 'annual',
      nextFilingDueAt: formatDateInput(taxProfile.nextFilingDueAt),
      lastFiledAt: formatDateInput(taxProfile.lastFiledAt),
      accountingMethod: taxProfile.accountingMethod ?? 'accrual',
      certificateUrl: taxProfile.certificateUrl ?? '',
      exemptionReason: taxProfile.exemptionReason ?? '',
      taxAdvisor: taxProfile.taxAdvisor ?? '',
      notes: taxProfile.notes ?? ''
    });
    setProfileMessage(null);
    setProfileError(null);
  }, [taxProfile]);

  const filingDefaults = useMemo(
    () => ({
      id: null,
      periodStart: '',
      periodEnd: '',
      dueAt: '',
      filedAt: '',
      status: enums.taxFilingStatuses?.[0]?.value ?? DEFAULT_FILING_STATUS,
      taxableSalesAmount: '',
      taxCollectedAmount: '',
      taxDueAmount: '',
      currency: taxProfile?.defaultCurrency ?? 'GBP',
      referenceNumber: '',
      submittedBy: '',
      supportingDocumentUrl: '',
      notes: ''
    }),
    [enums.taxFilingStatuses, taxProfile?.defaultCurrency]
  );

  const [filingForm, setFilingForm] = useState(filingDefaults);
  const [filingSaving, setFilingSaving] = useState(false);
  const [filingMessage, setFilingMessage] = useState(null);
  const [filingError, setFilingError] = useState(null);

  useEffect(() => {
    setFilingForm(filingDefaults);
    setFilingMessage(null);
    setFilingError(null);
  }, [filingDefaults, companyId]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!companyId || !handlers.onUpdateTaxProfile) {
      return;
    }
    try {
      setProfileSaving(true);
      setProfileError(null);
      await handlers.onUpdateTaxProfile(companyId, {
        registrationNumber: profileForm.registrationNumber || null,
        registrationCountry: profileForm.registrationCountry || null,
        registrationRegion: profileForm.registrationRegion || null,
        registrationStatus: profileForm.registrationStatus,
        vatRegistered: Boolean(profileForm.vatRegistered),
        registrationEffectiveFrom: profileForm.registrationEffectiveFrom || null,
        defaultRate: parseNumber(profileForm.defaultRate) ?? 0,
        thresholdAmount: parseNumber(profileForm.thresholdAmount),
        thresholdCurrency: profileForm.thresholdCurrency || null,
        filingFrequency: profileForm.filingFrequency,
        nextFilingDueAt: profileForm.nextFilingDueAt || null,
        lastFiledAt: profileForm.lastFiledAt || null,
        accountingMethod: profileForm.accountingMethod,
        certificateUrl: profileForm.certificateUrl || null,
        exemptionReason: profileForm.exemptionReason || null,
        taxAdvisor: profileForm.taxAdvisor || null,
        notes: profileForm.notes || null
      });
      setProfileMessage('Tax profile saved');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save tax profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFilingSubmit = async (event) => {
    event.preventDefault();
    if (!companyId) return;
    const handler = filingForm.id ? handlers.onUpdateTaxFiling : handlers.onCreateTaxFiling;
    if (!handler) {
      return;
    }
    try {
      setFilingSaving(true);
      setFilingError(null);
      setFilingMessage(null);
      const payload = {
        periodStart: filingForm.periodStart || null,
        periodEnd: filingForm.periodEnd || null,
        dueAt: filingForm.dueAt || null,
        filedAt: filingForm.filedAt || null,
        status: filingForm.status,
        taxableSalesAmount: parseNumber(filingForm.taxableSalesAmount),
        taxCollectedAmount: parseNumber(filingForm.taxCollectedAmount),
        taxDueAmount: parseNumber(filingForm.taxDueAmount),
        currency: filingForm.currency || taxProfile?.defaultCurrency || 'GBP',
        referenceNumber: filingForm.referenceNumber || null,
        submittedBy: filingForm.submittedBy || null,
        supportingDocumentUrl: filingForm.supportingDocumentUrl || null,
        notes: filingForm.notes || null
      };
      const result = await handler(companyId, filingForm.id, payload);
      setFilingMessage(filingForm.id ? 'Tax filing updated' : 'Tax filing created');
      if (!filingForm.id && result?.id) {
        setFilingForm(filingDefaults);
      } else if (filingForm.id) {
        setFilingForm(filingDefaults);
      }
    } catch (error) {
      setFilingError(error instanceof Error ? error.message : 'Unable to save tax filing');
    } finally {
      setFilingSaving(false);
    }
  };

  const handleEditFiling = (filing) => {
    setFilingForm({
      id: filing.id,
      periodStart: formatDateInput(filing.periodStart),
      periodEnd: formatDateInput(filing.periodEnd),
      dueAt: formatDateInput(filing.dueAt),
      filedAt: formatDateInput(filing.filedAt),
      status: filing.status ?? enums.taxFilingStatuses?.[0]?.value ?? DEFAULT_FILING_STATUS,
      taxableSalesAmount:
        filing.taxableSalesAmount !== null && filing.taxableSalesAmount !== undefined
          ? String(filing.taxableSalesAmount)
          : '',
      taxCollectedAmount:
        filing.taxCollectedAmount !== null && filing.taxCollectedAmount !== undefined
          ? String(filing.taxCollectedAmount)
          : '',
      taxDueAmount:
        filing.taxDueAmount !== null && filing.taxDueAmount !== undefined ? String(filing.taxDueAmount) : '',
      currency: filing.currency ?? taxProfile?.defaultCurrency ?? 'GBP',
      referenceNumber: filing.referenceNumber ?? '',
      submittedBy: filing.submittedBy ?? '',
      supportingDocumentUrl: filing.supportingDocumentUrl ?? '',
      notes: filing.notes ?? ''
    });
    setFilingMessage(null);
    setFilingError(null);
  };

  const handleDeleteFiling = async (filingId) => {
    if (!companyId || !handlers.onDeleteTaxFiling) {
      return;
    }
    try {
      await handlers.onDeleteTaxFiling(companyId, filingId);
      setFilingMessage('Tax filing deleted');
    } catch (error) {
      setFilingError(error instanceof Error ? error.message : 'Unable to delete tax filing');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Tax overview</h4>
            <p className="mt-1 text-sm text-slate-500">
              Govern VAT registration, filing cadence, and compliance readiness for this SME.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-secondary/40 p-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Default VAT rate</p>
              <p className="text-lg font-semibold text-primary">{(taxStats?.defaultRate ?? 0) * 100}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-secondary/40 p-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Next filing due</p>
              <p className="text-lg font-semibold text-primary">
                {taxStats?.nextDueAt ? new Date(taxStats.nextDueAt).toLocaleDateString() : 'No schedule'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-secondary/40 p-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Open filings</p>
              <p className="text-lg font-semibold text-primary">{taxStats?.overdueCount ?? 0}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          {profileError ? <StatusPill tone="danger">{profileError}</StatusPill> : null}
          {profileMessage ? <StatusPill tone="success">{profileMessage}</StatusPill> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="tax-registration-number" label="VAT registration number">
              <TextInput
                id="tax-registration-number"
                value={profileForm.registrationNumber}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, registrationNumber: event.target.value }))
                }
                disabled={disabled || profileSaving}
              />
            </FormField>
            <FormField id="tax-registration-country" label="Registration country">
              <TextInput
                id="tax-registration-country"
                value={profileForm.registrationCountry}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, registrationCountry: event.target.value.toUpperCase() }))
                }
                placeholder="GB"
                maxLength={3}
                disabled={disabled || profileSaving}
              />
            </FormField>
            <FormField id="tax-registration-region" label="Registration region">
              <TextInput
                id="tax-registration-region"
                value={profileForm.registrationRegion}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, registrationRegion: event.target.value }))
                }
                disabled={disabled || profileSaving}
              />
            </FormField>
            <FormField id="tax-registration-status" label="Registration status">
              <select
                id="tax-registration-status"
                value={profileForm.registrationStatus}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, registrationStatus: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                disabled={disabled || profileSaving}
              >
                {(enums.taxRegistrationStatuses ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <Checkbox
            label="VAT registered"
            checked={profileForm.vatRegistered}
            onChange={(event) =>
              setProfileForm((current) => ({ ...current, vatRegistered: event.target.checked }))
            }
            disabled={disabled || profileSaving}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="tax-registration-effective" label="Registration effective from">
              <TextInput
                id="tax-registration-effective"
                type="date"
                value={profileForm.registrationEffectiveFrom}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, registrationEffectiveFrom: event.target.value }))
                }
                disabled={disabled || profileSaving}
              />
            </FormField>
            <FormField id="tax-default-rate" label="Default VAT rate">
              <TextInput
                id="tax-default-rate"
                type="number"
                step="0.01"
                value={profileForm.defaultRate}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, defaultRate: event.target.value }))
                }
                disabled={disabled || profileSaving}
              />
            </FormField>
            <FormField id="tax-threshold-amount" label="Registration threshold">
              <TextInput
                id="tax-threshold-amount"
                type="number"
                value={profileForm.thresholdAmount}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, thresholdAmount: event.target.value }))
                }
                disabled={disabled || profileSaving}
              />
            </FormField>
            <FormField id="tax-threshold-currency" label="Threshold currency">
              <TextInput
                id="tax-threshold-currency"
                value={profileForm.thresholdCurrency}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, thresholdCurrency: event.target.value.toUpperCase() }))
                }
                disabled={disabled || profileSaving}
                maxLength={3}
              />
            </FormField>
            <FormField id="tax-filing-frequency" label="Filing frequency">
              <select
                id="tax-filing-frequency"
                value={profileForm.filingFrequency}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, filingFrequency: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                disabled={disabled || profileSaving}
              >
                {(enums.taxFilingFrequencies ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="tax-next-due" label="Next filing due">
              <TextInput
                id="tax-next-due"
                type="date"
                value={profileForm.nextFilingDueAt}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, nextFilingDueAt: event.target.value }))
                }
                disabled={disabled || profileSaving}
              />
            </FormField>
            <FormField id="tax-last-filed" label="Last filed">
              <TextInput
                id="tax-last-filed"
                type="date"
                value={profileForm.lastFiledAt}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, lastFiledAt: event.target.value }))
                }
                disabled={disabled || profileSaving}
              />
            </FormField>
            <FormField id="tax-accounting-method" label="Accounting method">
              <select
                id="tax-accounting-method"
                value={profileForm.accountingMethod}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, accountingMethod: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                disabled={disabled || profileSaving}
              >
                {(enums.taxAccountingMethods ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField id="tax-certificate" label="Certificate URL">
            <TextInput
              id="tax-certificate"
              value={profileForm.certificateUrl}
              onChange={(event) => setProfileForm((current) => ({ ...current, certificateUrl: event.target.value }))}
              disabled={disabled || profileSaving}
            />
          </FormField>
          <FormField id="tax-exemption" label="Exemption reason">
            <TextInput
              id="tax-exemption"
              value={profileForm.exemptionReason}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, exemptionReason: event.target.value }))
              }
              disabled={disabled || profileSaving}
            />
          </FormField>
          <FormField id="tax-advisor" label="Tax advisor">
            <TextInput
              id="tax-advisor"
              value={profileForm.taxAdvisor}
              onChange={(event) => setProfileForm((current) => ({ ...current, taxAdvisor: event.target.value }))}
              disabled={disabled || profileSaving}
            />
          </FormField>
          <FormField id="tax-notes" label="Notes">
            <textarea
              id="tax-notes"
              value={profileForm.notes}
              onChange={(event) => setProfileForm((current) => ({ ...current, notes: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
              disabled={disabled || profileSaving}
            />
          </FormField>
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={disabled || profileSaving} loading={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save tax profile'}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Tax filings</h4>
            <p className="mt-1 text-sm text-slate-500">
              Maintain quarterly and annual submissions with supporting evidence.
            </p>
          </div>
          {filingMessage ? <StatusPill tone="success">{filingMessage}</StatusPill> : null}
          {filingError ? <StatusPill tone="danger">{filingError}</StatusPill> : null}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Tax due</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {taxFilings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    No tax filings recorded yet.
                  </td>
                </tr>
              ) : (
                taxFilings.map((filing) => (
                  <tr key={filing.id} className="hover:bg-secondary/30">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">
                          {filing.periodStart
                            ? new Date(filing.periodStart).toLocaleDateString()
                            : 'Unspecified'}
                          {' — '}
                          {filing.periodEnd ? new Date(filing.periodEnd).toLocaleDateString() : 'Unspecified'}
                        </span>
                        {filing.referenceNumber ? (
                          <span className="text-xs text-slate-500">Ref: {filing.referenceNumber}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {filing.dueAt ? new Date(filing.dueAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill tone={filing.status === 'overdue' ? 'danger' : 'neutral'}>
                        {filing.statusLabel ?? filing.status}
                      </StatusPill>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {filing.taxDueAmount !== null && filing.taxDueAmount !== undefined
                        ? `${filing.currency ?? 'GBP'} ${filing.taxDueAmount.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleEditFiling(filing)}
                          disabled={disabled || filingSaving}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDeleteFiling(filing.id)}
                          disabled={disabled || filingSaving}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <form onSubmit={handleFilingSubmit} className="mt-6 space-y-4 rounded-xl border border-dashed border-accent/40 p-4">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-primary">
            {filingForm.id ? 'Update filing' : 'Add tax filing'}
          </h5>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="tax-filing-period-start" label="Period start">
              <TextInput
                id="tax-filing-period-start"
                type="date"
                value={filingForm.periodStart}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, periodStart: event.target.value }))
                }
                disabled={disabled || filingSaving}
                required
              />
            </FormField>
            <FormField id="tax-filing-period-end" label="Period end">
              <TextInput
                id="tax-filing-period-end"
                type="date"
                value={filingForm.periodEnd}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, periodEnd: event.target.value }))
                }
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-due" label="Due date">
              <TextInput
                id="tax-filing-due"
                type="date"
                value={filingForm.dueAt}
                onChange={(event) => setFilingForm((current) => ({ ...current, dueAt: event.target.value }))}
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-filed" label="Filed on">
              <TextInput
                id="tax-filing-filed"
                type="date"
                value={filingForm.filedAt}
                onChange={(event) => setFilingForm((current) => ({ ...current, filedAt: event.target.value }))}
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-status" label="Status">
              <select
                id="tax-filing-status"
                value={filingForm.status}
                onChange={(event) => setFilingForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                disabled={disabled || filingSaving}
              >
                {(enums.taxFilingStatuses ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="tax-filing-currency" label="Currency">
              <TextInput
                id="tax-filing-currency"
                value={filingForm.currency}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))
                }
                maxLength={3}
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-taxable" label="Taxable sales">
              <TextInput
                id="tax-filing-taxable"
                type="number"
                value={filingForm.taxableSalesAmount}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, taxableSalesAmount: event.target.value }))
                }
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-collected" label="Tax collected">
              <TextInput
                id="tax-filing-collected"
                type="number"
                value={filingForm.taxCollectedAmount}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, taxCollectedAmount: event.target.value }))
                }
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-due-amount" label="Tax due">
              <TextInput
                id="tax-filing-due-amount"
                type="number"
                value={filingForm.taxDueAmount}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, taxDueAmount: event.target.value }))
                }
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-reference" label="Reference">
              <TextInput
                id="tax-filing-reference"
                value={filingForm.referenceNumber}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, referenceNumber: event.target.value }))
                }
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-submitted-by" label="Submitted by">
              <TextInput
                id="tax-filing-submitted-by"
                value={filingForm.submittedBy}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, submittedBy: event.target.value }))
                }
                disabled={disabled || filingSaving}
              />
            </FormField>
            <FormField id="tax-filing-support" label="Supporting document URL">
              <TextInput
                id="tax-filing-support"
                value={filingForm.supportingDocumentUrl}
                onChange={(event) =>
                  setFilingForm((current) => ({ ...current, supportingDocumentUrl: event.target.value }))
                }
                disabled={disabled || filingSaving}
              />
            </FormField>
          </div>
          <FormField id="tax-filing-notes" label="Notes">
            <textarea
              id="tax-filing-notes"
              value={filingForm.notes}
              onChange={(event) => setFilingForm((current) => ({ ...current, notes: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
              disabled={disabled || filingSaving}
            />
          </FormField>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {filingForm.id ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setFilingForm(filingDefaults)}
                disabled={disabled || filingSaving}
              >
                Cancel edit
              </Button>
            ) : (
              <span className="text-xs text-slate-500">All submissions trigger finance compliance notifications.</span>
            )}
            <Button type="submit" size="sm" disabled={disabled || filingSaving} loading={filingSaving}>
              {filingForm.id ? 'Update filing' : 'Add filing'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

ProviderTaxManagementPanel.propTypes = {
  companyId: PropTypes.string,
  taxProfile: PropTypes.shape({
    registrationNumber: PropTypes.string,
    registrationCountry: PropTypes.string,
    registrationRegion: PropTypes.string,
    registrationStatus: PropTypes.string,
    vatRegistered: PropTypes.bool,
    registrationEffectiveFrom: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    defaultRate: PropTypes.number,
    thresholdAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    thresholdCurrency: PropTypes.string,
    filingFrequency: PropTypes.string,
    nextFilingDueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    lastFiledAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    accountingMethod: PropTypes.string,
    certificateUrl: PropTypes.string,
    exemptionReason: PropTypes.string,
    taxAdvisor: PropTypes.string,
    notes: PropTypes.string,
    defaultCurrency: PropTypes.string
  }),
  taxFilings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      periodStart: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      periodEnd: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      filedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      status: PropTypes.string,
      statusLabel: PropTypes.string,
      taxableSalesAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      taxCollectedAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      taxDueAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string,
      referenceNumber: PropTypes.string,
      submittedBy: PropTypes.string,
      supportingDocumentUrl: PropTypes.string,
      notes: PropTypes.string
    })
  ),
  taxStats: PropTypes.shape({
    overdueCount: PropTypes.number,
    nextDueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    lastFiledAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    rolling12mCollected: PropTypes.number,
    rolling12mDue: PropTypes.number,
    vatRegistered: PropTypes.bool,
    defaultRate: PropTypes.number
  }),
  enums: PropTypes.shape({
    taxRegistrationStatuses: PropTypes.array,
    taxAccountingMethods: PropTypes.array,
    taxFilingFrequencies: PropTypes.array,
    taxFilingStatuses: PropTypes.array
  }),
  handlers: PropTypes.shape({
    onUpdateTaxProfile: PropTypes.func,
    onCreateTaxFiling: PropTypes.func,
    onUpdateTaxFiling: PropTypes.func,
    onDeleteTaxFiling: PropTypes.func
  }),
  disabled: PropTypes.bool
};

ProviderTaxManagementPanel.defaultProps = {
  companyId: null,
  taxProfile: null,
  taxFilings: [],
  taxStats: null,
  enums: {},
  handlers: {},
  disabled: false
};

export default ProviderTaxManagementPanel;
