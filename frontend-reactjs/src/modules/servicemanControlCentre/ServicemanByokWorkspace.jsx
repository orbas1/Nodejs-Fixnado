import PageHeader from '../../components/blueprints/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Button from '../../components/ui/Button.jsx';
import { ServicemanByokProvider, useServicemanByok } from './ServicemanByokProvider.jsx';
import ProfileSettingsCard from './components/ProfileSettingsCard.jsx';
import ConnectorTable from './components/ConnectorTable.jsx';
import ConnectorDrawer from './components/ConnectorDrawer.jsx';
import RotateSecretModal from './components/RotateSecretModal.jsx';
import DiagnosticsPanel from './components/DiagnosticsPanel.jsx';
import AuditLogPanel from './components/AuditLogPanel.jsx';

function WorkspaceContent() {
  const { loading, error, refresh } = useServicemanByok();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-6 w-6 text-primary" />
        <span className="ml-3 text-sm text-slate-500">Loading BYOK management…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
        <p className="text-lg font-semibold text-rose-700">We couldn’t load the BYOK workspace.</p>
        <p className="mt-2 text-sm text-rose-600">{error}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => refresh({ silent: false })}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileSettingsCard />
      <ConnectorTable />
      <div className="grid gap-6 lg:grid-cols-2">
        <DiagnosticsPanel />
        <AuditLogPanel />
      </div>
      <ConnectorDrawer />
      <RotateSecretModal />
    </div>
  );
}

export default function ServicemanByokWorkspace() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="serviceman-byok-management">
      <PageHeader
        eyebrow="Crew control centre"
        title="BYOK management"
        description="Control how crew automations and AI workflows authenticate. Rotate secrets with audit-ready oversight."
        breadcrumbs={[
          { label: 'Dashboards', to: '/dashboards' },
          { label: 'Serviceman control centre', to: '/dashboards/serviceman' },
          { label: 'BYOK management' }
        ]}
        actions={[
          {
            label: 'Return to cockpit',
            to: '/dashboards/serviceman',
            variant: 'secondary'
          }
        ]}
      />
      <div className="mx-auto max-w-6xl px-6 pt-16">
        <ServicemanByokProvider>
          <WorkspaceContent />
        </ServicemanByokProvider>
      </div>
    </div>
  );
}
