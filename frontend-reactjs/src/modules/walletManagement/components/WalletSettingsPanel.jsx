import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, StatusPill, TextInput } from '../../../components/ui/index.js';

export default function WalletSettingsPanel({
  form,
  onFormChange,
  onAllowedOwnerToggle,
  onSubmit,
  ownerOptions,
  dirty,
  saving,
  status
}) {
  return (
    <Card className="space-y-6 border-slate-200 bg-white shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-primary">Wallet guardrails</h2>
        <p className="text-sm text-slate-600">
          Configure platform-wide wallet eligibility, payout rails, and compliance notifications.
        </p>
      </header>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Checkbox
            label="Wallet programme enabled"
            checked={form.walletEnabled}
            onChange={(event) => onFormChange((current) => ({ ...current, walletEnabled: event.target.checked }))}
            description="Disabling hides wallet balances and prevents ledger adjustments."
          />
          <TextInput
            label="Balance warning threshold"
            type="number"
            min="0"
            value={form.minBalanceWarning}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, minBalanceWarning: event.target.value }))
            }
            hint="Operators are alerted when balances fall below this amount."
          />
          <TextInput
            label="Automatic payout cadence (days)"
            type="number"
            min="1"
            value={form.autoPayoutCadenceDays}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, autoPayoutCadenceDays: event.target.value }))
            }
            hint="Controls scheduled wallet settlements for approved providers."
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-primary">Eligible owner types</p>
          <div className="grid gap-2 md:grid-cols-2">
            {ownerOptions.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={form.allowedOwnerTypes.includes(option.value)}
                onChange={() => onAllowedOwnerToggle(option.value)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="space-y-3 border-primary/20 bg-primary/5">
            <header className="flex items-center gap-2 text-sm font-semibold text-primary">
              <WalletIcon aria-hidden="true" className="h-5 w-5" /> Stripe Connect
            </header>
            <Checkbox
              label="Enable Stripe payouts"
              checked={form.fundingRails.stripeConnect.enabled}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  fundingRails: {
                    ...current.fundingRails,
                    stripeConnect: {
                      ...current.fundingRails.stripeConnect,
                      enabled: event.target.checked
                    }
                  }
                }))
              }
            />
            <TextInput
              label="Stripe account ID"
              value={form.fundingRails.stripeConnect.accountId}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  fundingRails: {
                    ...current.fundingRails,
                    stripeConnect: {
                      ...current.fundingRails.stripeConnect,
                      accountId: event.target.value
                    }
                  }
                }))
              }
            />
            <Checkbox
              label="Auto-capture payouts"
              checked={form.fundingRails.stripeConnect.autoCapture}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  fundingRails: {
                    ...current.fundingRails,
                    stripeConnect: {
                      ...current.fundingRails.stripeConnect,
                      autoCapture: event.target.checked
                    }
                  }
                }))
              }
              description="Enforce automatic Stripe transfers when payouts are approved."
            />
          </Card>

          <Card className="space-y-3 border-slate-200 bg-slate-50/80">
            <header className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <DocumentTextIcon aria-hidden="true" className="h-5 w-5" /> Bank transfer fallback
            </header>
            <Checkbox
              label="Enable manual bank transfer instructions"
              checked={form.fundingRails.bankTransfer.enabled}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  fundingRails: {
                    ...current.fundingRails,
                    bankTransfer: {
                      ...current.fundingRails.bankTransfer,
                      enabled: event.target.checked
                    }
                  }
                }))
              }
            />
            <TextInput
              label="Instructions"
              value={form.fundingRails.bankTransfer.instructions}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  fundingRails: {
                    ...current.fundingRails,
                    bankTransfer: {
                      ...current.fundingRails.bankTransfer,
                      instructions: event.target.value
                    }
                  }
                }))
              }
              hint="Displayed when automated payouts are unavailable."
            />
          </Card>

          <Card className="space-y-3 border-slate-200 bg-slate-50/80">
            <header className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <AdjustmentsHorizontalIcon aria-hidden="true" className="h-5 w-5" /> Manual adjustments
            </header>
            <Checkbox
              label="Allow manual float adjustments"
              checked={form.fundingRails.manual.enabled}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  fundingRails: {
                    ...current.fundingRails,
                    manual: {
                      ...current.fundingRails.manual,
                      enabled: event.target.checked
                    }
                  }
                }))
              }
            />
            <TextInput
              label="Operational notes"
              value={form.fundingRails.manual.notes}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  fundingRails: {
                    ...current.fundingRails,
                    manual: {
                      ...current.fundingRails.manual,
                      notes: event.target.value
                    }
                  }
                }))
              }
            />
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Terms URL"
            value={form.compliance.termsUrl}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                compliance: { ...current.compliance, termsUrl: event.target.value }
              }))
            }
          />
          <TextInput
            label="Fallback hold days"
            type="number"
            min="1"
            value={form.compliance.fallbackHoldDays}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                compliance: { ...current.compliance, fallbackHoldDays: event.target.value }
              }))
            }
          />
          <Checkbox
            label="KYC required before withdrawals"
            checked={form.compliance.kycRequired}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                compliance: { ...current.compliance, kycRequired: event.target.checked }
              }))
            }
          />
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            AML checklist
            <textarea
              value={form.compliance.amlChecklist}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  compliance: { ...current.compliance, amlChecklist: event.target.value }
                }))
              }
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Document enhanced due diligence requirements for manual reviews."
            />
          </label>
          <TextInput
            label="Escalation emails"
            value={form.compliance.escalationEmailsText}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                compliance: { ...current.compliance, escalationEmailsText: event.target.value }
              }))
            }
            hint="Comma separated list of compliance contacts."
            className="md:col-span-2"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Low balance notification emails"
            value={form.notifications.lowBalanceEmailsText}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                notifications: { ...current.notifications, lowBalanceEmailsText: event.target.value }
              }))
            }
            hint="Comma separated email recipients."
          />
          <TextInput
            label="Large transaction threshold"
            type="number"
            min="0"
            value={form.notifications.largeTransactionThreshold}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                notifications: { ...current.notifications, largeTransactionThreshold: event.target.value }
              }))
            }
          />
          <TextInput
            label="Slack webhook"
            value={form.notifications.slackWebhook}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                notifications: { ...current.notifications, slackWebhook: event.target.value }
              }))
            }
            className="md:col-span-2"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4">
          <Button type="submit" icon={ShieldCheckIcon} disabled={!dirty || saving} loading={saving}>
            Save settings
          </Button>
          {status ? <StatusPill tone={status === 'Settings updated' ? 'success' : 'warning'}>{status}</StatusPill> : null}
          {!dirty && !saving ? (
            <p className="text-xs text-slate-500">All changes saved. Wallet guardrails are in effect.</p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

WalletSettingsPanel.propTypes = {
  form: PropTypes.object.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onAllowedOwnerToggle: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  ownerOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
  dirty: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  status: PropTypes.string
};
