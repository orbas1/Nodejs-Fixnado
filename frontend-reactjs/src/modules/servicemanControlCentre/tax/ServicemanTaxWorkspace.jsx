import { useEffect } from 'react';
import PropTypes from 'prop-types';
import PageHeader from '../../../components/blueprints/PageHeader.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import Button from '../../../components/ui/Button.jsx';
import ServicemanTaxProvider, { useServicemanTax } from './ServicemanTaxProvider.jsx';
import TaxSummary from './components/TaxSummary.jsx';
import TaxProfileCard from './components/TaxProfileCard.jsx';
import TaxFilingsPanel from './components/TaxFilingsPanel.jsx';
import TaxTasksPanel from './components/TaxTasksPanel.jsx';
import TaxDocumentsPanel from './components/TaxDocumentsPanel.jsx';

function TaxWorkspaceContent() {
  const { loading, error, refreshWorkspace } = useServicemanTax();

  useEffect(() => {
    refreshWorkspace({ silent: false });
  }, [refreshWorkspace]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" data-qa="tax-workspace-loading">
        <Spinner className="h-6 w-6 text-primary" />
        <span className="ml-3 text-sm text-slate-500">Loading tax workspace…</span>
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'We could not load the tax workspace.';
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center" role="alert">
        <p className="text-lg font-semibold text-rose-700">We couldn’t load the tax workspace.</p>
        <p className="mt-2 text-sm text-rose-600">{message}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => refreshWorkspace({ silent: false })}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <TaxSummary />
      <TaxProfileCard />
      <TaxFilingsPanel />
      <TaxTasksPanel />
      <TaxDocumentsPanel />
    </div>
  );
}

export default function ServicemanTaxWorkspace({ initialSnapshot, servicemanId }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="serviceman-tax-management">
      <PageHeader
        eyebrow="Crew control centre"
        title="Tax management"
        description="Manage tax profile, submission deadlines, compliance evidence, and tasks across the crew organisation."
        breadcrumbs={[
          { label: 'Dashboards', to: '/dashboards' },
          { label: 'Serviceman control centre', to: '/dashboards/serviceman' },
          { label: 'Tax management' }
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
        <ServicemanTaxProvider servicemanId={servicemanId} initialSnapshot={initialSnapshot}>
          <TaxWorkspaceContent />
        </ServicemanTaxProvider>
      </div>
    </div>
  );
}

ServicemanTaxWorkspace.propTypes = {
  initialSnapshot: PropTypes.object,
  servicemanId: PropTypes.string
};

ServicemanTaxWorkspace.defaultProps = {
  initialSnapshot: null,
  servicemanId: null
};
