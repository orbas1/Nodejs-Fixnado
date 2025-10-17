import { useMemo, useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import { useServicemanFinance } from '../ServicemanFinanceProvider.jsx';

const payoutMethodOptions = [
  { value: 'wallet', label: 'Wallet (Fixnado balance)' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash on completion' }
];

const payoutScheduleOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'on_completion', label: 'On completion' }
];

const currencyOptions = ['GBP', 'USD', 'EUR', 'KES', 'NGN'];

export default function ProfileSection() {
  const {
    profile: { draft, setDraft, save, saving, feedback, error },
    workspace
  } = useServicemanFinance();
  const [dirty, setDirty] = useState(false);

  const handleFieldChange = (field, value) => {
    setDirty(true);
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleBankFieldChange = (field, value) => {
    setDirty(true);
    setDraft((current) => ({ ...current, bankAccount: { ...current.bankAccount, [field]: value } }));
  };

  const effectiveCurrency = draft.currency || workspace?.profile?.currency || 'GBP';

  const saveProfile = async (event) => {
    event.preventDefault();
    await save(draft);
    setDirty(false);
  };

  const feedbackMessage = useMemo(() => {
    if (error) {
      return error.message ?? 'Unable to update payout settings';
    }
    return feedback;
  }, [feedback, error]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary">Payout profile</h3>
          <p className="text-sm text-slate-600 max-w-3xl">
            Define default payout methods, reimbursement rules, and taxation details. Changes apply to earnings created via the
            Serviceman control centre and Provider operations workspace.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={saveProfile} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save profile' : 'Saved'}
        </Button>
      </div>

      <form className="grid gap-6 md:grid-cols-2" onSubmit={saveProfile}>
        <div className="space-y-4">
          <Select
            id="finance-profile-currency"
            label="Default currency"
            value={draft.currency}
            onChange={(event) => handleFieldChange('currency', event.target.value)}
          >
            {currencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <TextInput
            id="finance-profile-base-rate"
            label={`Base hourly rate (${effectiveCurrency})`}
            type="number"
            min="0"
            step="0.01"
            value={draft.baseHourlyRate}
            onChange={(event) => handleFieldChange('baseHourlyRate', event.target.value)}
          />
          <TextInput
            id="finance-profile-overtime-rate"
            label={`Overtime rate (${effectiveCurrency})`}
            type="number"
            min="0"
            step="0.01"
            value={draft.overtimeRate}
            onChange={(event) => handleFieldChange('overtimeRate', event.target.value)}
          />
          <TextInput
            id="finance-profile-callout-fee"
            label={`Call-out fee (${effectiveCurrency})`}
            type="number"
            min="0"
            step="0.01"
            value={draft.calloutFee}
            onChange={(event) => handleFieldChange('calloutFee', event.target.value)}
          />
          <TextInput
            id="finance-profile-mileage-rate"
            label="Mileage rate (per km)"
            type="number"
            min="0"
            step="0.01"
            value={draft.mileageRate}
            onChange={(event) => handleFieldChange('mileageRate', event.target.value)}
          />
        </div>

        <div className="space-y-4">
          <Select
            id="finance-profile-method"
            label="Preferred payout method"
            value={draft.payoutMethod}
            onChange={(event) => handleFieldChange('payoutMethod', event.target.value)}
          >
            {payoutMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            id="finance-profile-schedule"
            label="Payout schedule"
            value={draft.payoutSchedule}
            onChange={(event) => handleFieldChange('payoutSchedule', event.target.value)}
          >
            {payoutScheduleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <TextInput
            id="finance-profile-tax-rate"
            label="Tax withholding (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={draft.taxRate}
            onChange={(event) => handleFieldChange('taxRate', event.target.value)}
          />
          <TextInput
            id="finance-profile-tax-id"
            label="Tax identifier"
            value={draft.taxIdentifier}
            onChange={(event) => handleFieldChange('taxIdentifier', event.target.value)}
            placeholder="e.g. UTR, TIN"
          />
          <TextArea
            id="finance-profile-instructions"
            label="Payout instructions"
            rows={3}
            value={draft.payoutInstructions}
            onChange={(event) => handleFieldChange('payoutInstructions', event.target.value)}
            placeholder="Describe manual approvals or reference numbers that finance teams should apply."
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <h4 className="text-sm font-semibold text-primary">Bank account (optional)</h4>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TextInput
              id="finance-profile-bank-name"
              label="Account name"
              value={draft.bankAccount.accountName}
              onChange={(event) => handleBankFieldChange('accountName', event.target.value)}
            />
            <TextInput
              id="finance-profile-bank-number"
              label="Account number"
              value={draft.bankAccount.accountNumber}
              onChange={(event) => handleBankFieldChange('accountNumber', event.target.value)}
            />
            <TextInput
              id="finance-profile-bank-sort"
              label="Sort code"
              value={draft.bankAccount.sortCode}
              onChange={(event) => handleBankFieldChange('sortCode', event.target.value)}
            />
            <TextInput
              id="finance-profile-bank-iban"
              label="IBAN"
              value={draft.bankAccount.iban}
              onChange={(event) => handleBankFieldChange('iban', event.target.value)}
            />
            <TextInput
              id="finance-profile-bank-bic"
              label="BIC / SWIFT"
              value={draft.bankAccount.bic}
              onChange={(event) => handleBankFieldChange('bic', event.target.value)}
            />
          </div>
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-500">
            {feedbackMessage ? (
              <span className={error ? 'text-rose-600' : 'text-emerald-600'}>{feedbackMessage}</span>
            ) : (
              <span>Last updated {workspace?.profile?.updatedAt ? new Date(workspace.profile.updatedAt).toLocaleString() : 'recently'}.</span>
            )}
          </div>
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save payout profile'}
          </Button>
        </div>
      </form>
    </section>
  );
}
