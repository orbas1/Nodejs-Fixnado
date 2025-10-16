import PropTypes from 'prop-types';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Button, Spinner, StatusPill } from '../../components/ui/index.js';
import SiteIdentitySection from './components/SiteIdentitySection.jsx';
import SmtpSection from './components/SmtpSection.jsx';
import StorageSection from './components/StorageSection.jsx';
import LinkListSection from './components/LinkListSection.jsx';
import ChatwootSection from './components/ChatwootSection.jsx';
import AutomationIntegrationsSection from './components/AutomationIntegrationsSection.jsx';
import GithubSection from './components/GithubSection.jsx';
import GoogleDriveSection from './components/GoogleDriveSection.jsx';
import DiagnosticsHistory from './components/DiagnosticsHistory.jsx';

const socialFieldConfig = {
  label: { label: 'Label' },
  url: { label: 'URL' },
  handle: { label: 'Handle' },
  type: { label: 'Type' },
  icon: { label: 'Icon' },
  description: { label: 'Description', component: 'textarea', rows: 3 }
};

const supportFieldConfig = {
  label: { label: 'Label' },
  url: { label: 'URL' },
  type: { label: 'Type' },
  description: { label: 'Description' }
};

function SystemSettingsForm({
  form,
  meta,
  loading,
  error,
  success,
  diagnosticError,
  saving,
  onSubmit,
  onReset,
  onSiteChange,
  onSmtpChange,
  onStorageChange,
  onSystemSectionChange,
  onLinkChange,
  onAddLink,
  onRemoveLink,
  onMoveLink,
  onDiagnostic,
  diagnosticLoading,
  sectionFeedback,
  diagnostics,
  diagnosticsLoading,
  diagnosticSections,
  diagnosticFilter,
  onDiagnosticFilterChange,
  onDiagnosticsRefresh,
  onInspectDiagnostic,
  onRetryDiagnostic
}) {
  if (loading || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <PageHeader
        eyebrow="Admin Control Tower"
        title="System settings"
        description="Manage Fixnado's identity, messaging infrastructure, and bring-your-own-key integrations."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'System settings' }
        ]}
        actions={[
          {
            label: 'View dashboard',
            to: '/admin/dashboard',
            variant: 'secondary'
          }
        ]}
        meta={meta}
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <form className="space-y-10" onSubmit={onSubmit}>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">{error}</div>
          ) : null}
          {diagnosticError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 shadow-sm">
              {diagnosticError}
            </div>
          ) : null}
          {success ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">
              <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
              <span>{success}</span>
            </div>
          ) : null}

          <SiteIdentitySection site={form.system.site} onChange={onSiteChange} />

          <SmtpSection
            smtp={form.integrations.smtp}
            onChange={onSmtpChange}
            onTest={() => onDiagnostic('smtp')}
            feedback={sectionFeedback.smtp}
            testing={diagnosticLoading === 'smtp'}
          />

          <StorageSection
            storage={form.system.storage}
            onChange={onStorageChange}
            onTest={() => onDiagnostic('storage')}
            feedback={sectionFeedback.storage}
            testing={diagnosticLoading === 'storage'}
          />

          <LinkListSection
            title="Social media"
            description="Maintain the destinations for social presence, advocacy, and embedded community links."
            links={form.system.socialLinks}
            onChange={(field, index) => onLinkChange('socialLinks', index, field)}
            onAdd={onAddLink('socialLinks')}
            onRemove={(index) => onRemoveLink('socialLinks', index)}
            onMove={(index, direction) => onMoveLink('socialLinks', index, direction)}
            fieldConfig={socialFieldConfig}
          />

          <LinkListSection
            title="Support centre"
            description="Maintain the destinations for knowledge base, escalation contacts, and customer success resources."
            links={form.system.supportLinks}
            onChange={(field, index) => onLinkChange('supportLinks', index, field)}
            onAdd={onAddLink('supportLinks')}
            onRemove={(index) => onRemoveLink('supportLinks', index)}
            onMove={(index, direction) => onMoveLink('supportLinks', index, direction)}
            fieldConfig={supportFieldConfig}
          />

          <ChatwootSection
            chatwoot={form.system.chatwoot}
            onChange={(field) => onSystemSectionChange('chatwoot', field)}
            onTest={() => onDiagnostic('chatwoot')}
            feedback={sectionFeedback.chatwoot}
            testing={diagnosticLoading === 'chatwoot'}
          />

          <AutomationIntegrationsSection
            openai={form.system.openai}
            slack={form.system.slack}
            onOpenAiChange={(field) => onSystemSectionChange('openai', field)}
            onSlackChange={(field) => onSystemSectionChange('slack', field)}
            onTestOpenAi={() => onDiagnostic('openai')}
            onTestSlack={() => onDiagnostic('slack')}
            openAiFeedback={sectionFeedback.openai}
            slackFeedback={sectionFeedback.slack}
            testingSection={diagnosticLoading}
          />

          <GithubSection
            github={form.system.github}
            onChange={(field) => onSystemSectionChange('github', field)}
            onTest={() => onDiagnostic('github')}
            feedback={sectionFeedback.github}
            testing={diagnosticLoading === 'github'}
          />

          <GoogleDriveSection
            googleDrive={form.system.googleDrive}
            onChange={(field) => onSystemSectionChange('googleDrive', field)}
            onTest={() => onDiagnostic('google-drive')}
            feedback={sectionFeedback['google-drive']}
            testing={diagnosticLoading === 'google-drive'}
          />

          <DiagnosticsHistory
            diagnostics={diagnostics}
            loading={diagnosticsLoading}
            sections={diagnosticSections}
            filter={diagnosticFilter}
            onFilterChange={onDiagnosticFilterChange}
            onRefresh={onDiagnosticsRefresh}
            onInspect={onInspectDiagnostic}
            onRetry={onRetryDiagnostic}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" icon={CheckCircleIcon} loading={saving} disabled={saving}>
                Save system settings
              </Button>
              <Button
                type="button"
                variant="ghost"
                icon={ArrowPathIcon}
                onClick={onReset}
                disabled={saving}
              >
                Reload from source
              </Button>
            </div>
            <StatusPill tone="info">Changes apply instantly</StatusPill>
          </div>
        </form>
      </div>
    </div>
  );
}

SystemSettingsForm.propTypes = {
  form: PropTypes.object,
  meta: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.string,
  diagnosticError: PropTypes.string,
  saving: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onSiteChange: PropTypes.func.isRequired,
  onSmtpChange: PropTypes.func.isRequired,
  onStorageChange: PropTypes.func.isRequired,
  onSystemSectionChange: PropTypes.func.isRequired,
  onLinkChange: PropTypes.func.isRequired,
  onAddLink: PropTypes.func.isRequired,
  onRemoveLink: PropTypes.func.isRequired,
  onMoveLink: PropTypes.func.isRequired,
  onDiagnostic: PropTypes.func.isRequired,
  diagnosticLoading: PropTypes.string,
  sectionFeedback: PropTypes.object.isRequired,
  diagnostics: PropTypes.arrayOf(PropTypes.object).isRequired,
  diagnosticsLoading: PropTypes.bool,
  diagnosticSections: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
  ),
  diagnosticFilter: PropTypes.string,
  onDiagnosticFilterChange: PropTypes.func.isRequired,
  onDiagnosticsRefresh: PropTypes.func.isRequired,
  onInspectDiagnostic: PropTypes.func.isRequired,
  onRetryDiagnostic: PropTypes.func.isRequired
};

SystemSettingsForm.defaultProps = {
  form: null,
  meta: [],
  loading: false,
  error: null,
  success: null,
  diagnosticError: null,
  saving: false,
  diagnosticLoading: null,
  diagnosticsLoading: false,
  diagnosticSections: [],
  diagnosticFilter: 'all'
};

export default SystemSettingsForm;
