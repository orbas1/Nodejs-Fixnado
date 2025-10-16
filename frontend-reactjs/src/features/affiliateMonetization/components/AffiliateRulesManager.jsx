import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  Checkbox,
  SegmentedControl,
  StatusPill,
  TextInput,
  Textarea
} from '../../../components/ui/index.js';

export default function AffiliateRulesManager({
  rules,
  performance,
  currencyFormatter,
  ruleEditorOpen,
  ruleDraft,
  onOpenEditor,
  onCloseEditor,
  onRuleFieldChange,
  onRuleRecurrenceChange,
  onRuleToggle,
  onRuleMetadataChange,
  onRuleSubmit,
  onDeactivateRule,
  onRefresh,
  loading,
  saving,
  error,
  success,
  recurrenceOptions,
  value
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-primary">Commission rules</h3>
          <p className="text-sm text-slate-600">
            Align payout tiers across web and mobile. Editing a rule updates the ledger and partner dashboards instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={() => onOpenEditor()}>
            Add commission rule
          </Button>
          <Button type="button" variant="ghost" size="sm" icon={ArrowPathIcon} onClick={onRefresh} disabled={loading}>
            Refresh list
          </Button>
        </div>
      </div>

      {error ? (
        <StatusPill tone="danger" icon={ExclamationTriangleIcon}>
          {error}
        </StatusPill>
      ) : null}
      {success ? (
        <StatusPill tone="success" icon={CheckCircleIcon}>
          {success}
        </StatusPill>
      ) : null}

      {ruleEditorOpen ? (
        <Card padding="lg" className="space-y-6 border-primary/20 bg-white shadow-lg shadow-primary/10">
          <form className="space-y-6" onSubmit={onRuleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Rule name" value={ruleDraft.name} onChange={onRuleFieldChange('name')} required />
              <TextInput label="Tier label" value={ruleDraft.tierLabel} onChange={onRuleFieldChange('tierLabel')} required />
              <TextInput
                label="Commission rate (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={ruleDraft.commissionRate}
                onChange={onRuleFieldChange('commissionRate')}
                required
              />
              <TextInput
                label="Priority"
                type="number"
                value={ruleDraft.priority}
                onChange={onRuleFieldChange('priority')}
                hint="Lower numbers win when multiple rules match."
              />
              <TextInput
                label="Minimum transaction value"
                type="number"
                min="0"
                step="0.01"
                value={ruleDraft.minTransactionValue}
                onChange={onRuleFieldChange('minTransactionValue')}
              />
              <TextInput
                label="Maximum transaction value"
                type="number"
                min="0"
                step="0.01"
                value={ruleDraft.maxTransactionValue ?? ''}
                onChange={onRuleFieldChange('maxTransactionValue')}
                optionalLabel="optional"
              />
              <TextInput
                label="Currency"
                value={ruleDraft.currency}
                onChange={onRuleFieldChange('currency')}
                hint="ISO currency code"
              />
            </div>

            <div className="space-y-4">
              <SegmentedControl
                name="Recurrence type"
                value={ruleDraft.recurrenceType}
                options={recurrenceOptions}
                onChange={onRuleRecurrenceChange}
                size="sm"
              />
              {ruleDraft.recurrenceType === 'finite' ? (
                <TextInput
                  label="Recurrence limit"
                  type="number"
                  min="1"
                  value={ruleDraft.recurrenceLimit}
                  onChange={onRuleFieldChange('recurrenceLimit')}
                />
              ) : null}
              <Checkbox label="Rule is active" checked={Boolean(ruleDraft.isActive)} onChange={onRuleToggle('isActive')} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Badge colour"
                value={ruleDraft.metadata.badgeColor}
                onChange={onRuleMetadataChange('badgeColor')}
              />
              <TextInput
                label="Badge icon"
                value={ruleDraft.metadata.badgeIcon}
                onChange={onRuleMetadataChange('badgeIcon')}
                optionalLabel="optional"
              />
              <TextInput
                label="Landing page URL"
                value={ruleDraft.metadata.landingPageUrl}
                onChange={onRuleMetadataChange('landingPageUrl')}
                optionalLabel="optional"
              />
              <Textarea
                label="Summary"
                value={ruleDraft.metadata.summary}
                onChange={onRuleMetadataChange('summary')}
                minRows={3}
                optionalLabel="optional"
              />
            </div>
            <Textarea
              label="Perks"
              value={ruleDraft.metadata.perksText}
              onChange={onRuleMetadataChange('perksText')}
              hint="List each perk on a new line."
            />
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onCloseEditor} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} iconPosition="end">
                {ruleDraft.id ? 'Update rule' : 'Create rule'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card padding="lg" className="space-y-4 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
        {rules.length === 0 ? (
          <p className="text-sm text-slate-500">No commission tiers configured yet. Add a rule to start tracking partner earnings.</p>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-primary">{rule.name}</p>
                    <StatusPill tone={rule.isActive ? 'success' : 'warning'}>{rule.isActive ? 'Active' : 'Paused'}</StatusPill>
                  </div>
                  <p className="text-sm text-slate-600">
                    {rule.tierLabel} • {Number.parseFloat(rule.commissionRate ?? 0).toFixed(2)}% •{' '}
                    {rule.minTransactionValue != null ? `≥ ${Number(rule.minTransactionValue).toLocaleString()}` : 'No minimum'}
                    {rule.maxTransactionValue != null ? ` – ${Number(rule.maxTransactionValue).toLocaleString()}` : ' and above'}
                    {rule.recurrenceType === 'finite'
                      ? ` • ${rule.recurrenceLimit ?? 0} conversions`
                      : rule.recurrenceType === 'infinite'
                      ? ' • Infinite recurrence'
                      : ' • First conversion'}
                  </p>
                  {rule.metadata?.summary ? <p className="text-xs text-slate-500">{rule.metadata.summary}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => onOpenEditor(rule)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={TrashIcon}
                    onClick={() => onDeactivateRule(rule.id)}
                    disabled={!rule.isActive || saving}
                  >
                    Pause
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card padding="lg" className="space-y-4 border-slate-200 bg-white/90 shadow-lg shadow-primary/5 xl:col-span-2">
          <header className="space-y-1">
            <h3 className="text-xl font-semibold text-primary">Top affiliate performance</h3>
            <p className="text-sm text-slate-600">Monitor the partners influencing the most revenue this cycle.</p>
          </header>
          <div className="space-y-3">
            {performance.length === 0 ? (
              <p className="text-sm text-slate-500">
                No referral activity captured yet. Once partners start converting leads, their performance will appear here.
              </p>
            ) : (
              performance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                      <p className="text-base font-semibold text-primary">
                        {record.referralCode ? record.referralCode.toUpperCase() : 'Affiliate partner'}
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {(record.tierLabel || 'Untiered').toUpperCase()} • {record.status}
                    </p>
                    <p className="text-sm text-slate-600">
                      {currencyFormatter.format(record.totalCommissionEarned ?? 0)} earned • {currencyFormatter.format(record.lifetimeRevenue ?? 0)} influenced
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p className="font-semibold text-primary">{record.totalReferred ?? 0} referrals</p>
                    <p>Pending {currencyFormatter.format(record.pendingCommission ?? 0)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card padding="lg" className="space-y-4 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
          <header className="space-y-1">
            <h3 className="text-xl font-semibold text-primary">Affiliate resource preview</h3>
            <p className="text-sm text-slate-600">Quick-launch assets your partner managers can open in a new tab.</p>
          </header>
          <div className="space-y-3">
            {value.resources?.length ? (
              value.resources.map((resource, index) => (
                <div
                  key={`resource-preview-${resource.id || index}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-primary">{resource.label || 'Untitled resource'}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{resource.type}</p>
                    {resource.description ? <p className="text-sm text-slate-600">{resource.description}</p> : null}
                    {resource.rolesText ? <p className="text-xs text-slate-500">Visible to: {resource.rolesText}</p> : null}
                  </div>
                  {resource.url ? (
                    <Button
                      as="a"
                      variant="ghost"
                      size="sm"
                      icon={ArrowTopRightOnSquareIcon}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </Button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Resources saved above will appear here for a quick preview.</p>
            )}
          </div>
        </Card>
        <Card padding="lg" className="space-y-4 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
          <header className="space-y-1">
            <h3 className="text-xl font-semibold text-primary">Asset library preview</h3>
            <p className="text-sm text-slate-600">Visualise downloadable artwork and collateral before publishing.</p>
          </header>
          <div className="space-y-3">
            {value.assetLibrary?.length ? (
              value.assetLibrary.map((asset, index) => (
                <div
                  key={`asset-preview-${asset.id || index}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    {asset.previewUrl ? (
                      <img
                        src={asset.previewUrl}
                        alt={asset.label || 'Affiliate asset preview'}
                        loading="lazy"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                        {asset.type?.slice(0, 2) || 'AS'}
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-primary">{asset.label || 'Untitled asset'}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{asset.type}</p>
                      {asset.description ? <p className="text-sm text-slate-600">{asset.description}</p> : null}
                    </div>
                  </div>
                  {asset.url ? (
                    <Button
                      as="a"
                      variant="ghost"
                      size="sm"
                      icon={ArrowTopRightOnSquareIcon}
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </Button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Assets added above will appear here with previews and quick links.</p>
            )}
          </div>
        </Card>
      </section>
    </section>
  );
}

AffiliateRulesManager.propTypes = {
  rules: PropTypes.array.isRequired,
  performance: PropTypes.array.isRequired,
  currencyFormatter: PropTypes.instanceOf(Intl.NumberFormat).isRequired,
  ruleEditorOpen: PropTypes.bool.isRequired,
  ruleDraft: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    tierLabel: PropTypes.string,
    commissionRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    priority: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    minTransactionValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxTransactionValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    recurrenceType: PropTypes.string,
    recurrenceLimit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isActive: PropTypes.bool,
    metadata: PropTypes.shape({
      badgeColor: PropTypes.string,
      badgeIcon: PropTypes.string,
      landingPageUrl: PropTypes.string,
      summary: PropTypes.string,
      perksText: PropTypes.string
    })
  }).isRequired,
  onOpenEditor: PropTypes.func.isRequired,
  onCloseEditor: PropTypes.func.isRequired,
  onRuleFieldChange: PropTypes.func.isRequired,
  onRuleRecurrenceChange: PropTypes.func.isRequired,
  onRuleToggle: PropTypes.func.isRequired,
  onRuleMetadataChange: PropTypes.func.isRequired,
  onRuleSubmit: PropTypes.func.isRequired,
  onDeactivateRule: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  error: PropTypes.string,
  success: PropTypes.string,
  recurrenceOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  value: PropTypes.shape({
    resources: PropTypes.array,
    assetLibrary: PropTypes.array
  }).isRequired
};

AffiliateRulesManager.defaultProps = {
  error: null,
  success: null
};
