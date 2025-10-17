import { Suspense } from 'react';
import { StorefrontManagementProvider } from '../modules/storefrontManagement/StorefrontManagementProvider.jsx';
import BusinessFrontComposer from '../modules/storefrontManagement/components/BusinessFrontComposer.jsx';
import StorefrontManagementWorkspace from '../modules/storefrontManagement/StorefrontManagementWorkspace.jsx';

function BusinessFrontWorkspacePreview() {
  return (
    <div className="min-h-screen bg-secondary p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <StorefrontManagementWorkspace />
      </div>
    </div>
  );
}

export default function BusinessFrontDevPreview() {
  return (
    <StorefrontManagementProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading business front preview...</div>}>
        <div className="min-h-screen bg-secondary p-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-10">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h1 className="text-2xl font-semibold text-primary">Business Front Composer (Standalone)</h1>
              <p className="mt-2 text-sm text-slate-600">
                This developer preview renders the full composer in isolation for rapid UI validation without navigating the
                broader dashboard shell.
              </p>
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
                <BusinessFrontComposer />
              </div>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary">Full Storefront Workspace</h2>
              <p className="mt-2 text-sm text-slate-600">
                Navigate the experience as it appears within the provider control centre, including navigation, overview cards,
                and the composer embedded within the wider workspace.
              </p>
              <div className="mt-6 rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-inner">
                <BusinessFrontWorkspacePreview />
              </div>
            </section>
          </div>
        </div>
      </Suspense>
    </StorefrontManagementProvider>
  );
}
