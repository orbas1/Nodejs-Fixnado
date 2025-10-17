import { useState } from 'react';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import { usePersonaAccess } from '../hooks/usePersonaAccess.js';
import RoleCard from '../components/dashboard/hub/RoleCard.jsx';
import RolePreviewDialog from '../components/dashboard/hub/RolePreviewDialog.jsx';

const DashboardHub = () => {
  const { allowed, grantAccess } = usePersonaAccess();
  const [statusMessage, setStatusMessage] = useState('');
  const [previewRole, setPreviewRole] = useState(null);

  const registeredRoles = DASHBOARD_ROLES.filter((role) => role.registered);
  const visibleRegistered = registeredRoles.filter((role) => role.id !== 'admin' || allowed.includes('admin'));
  const pendingRoles = DASHBOARD_ROLES.filter((role) => !role.registered);

  const handleUnlock = (role) => {
    if (!role) return;
    grantAccess(role.id);
    setStatusMessage(`${role.name} unlocked for this session.`);
    setPreviewRole((current) => (current?.id === role.id ? null : current));
    window.setTimeout(() => setStatusMessage(''), 2400);
  };

  const handlePreview = (role) => {
    setPreviewRole(role);
  };

  const handleClosePreview = () => {
    setPreviewRole(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/40 to-white text-primary">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-12">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Dashboards</p>
          <h1 className="text-4xl font-semibold">Launch your workspace</h1>
          <p className="mx-auto max-w-2xl text-sm text-primary/70">
            Pick the dashboard you need right now. Switch back using the Hub link in every sidebar.
          </p>
          {statusMessage ? <p className="text-sm font-semibold text-emerald-600">{statusMessage}</p> : null}
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Ready for you</h2>
            <span className="text-xs uppercase tracking-wide text-primary/60">{visibleRegistered.length} workspaces</span>
          </div>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {visibleRegistered.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isAllowed={allowed.includes(role.id)}
                onPreview={handlePreview}
                onUnlock={handleUnlock}
              />
            ))}
          </div>
        </section>

        {pendingRoles.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Coming soon</h2>
              <span className="text-xs uppercase tracking-wide text-primary/60">{pendingRoles.length} planned</span>
            </div>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {pendingRoles.map((role) => (
                <RoleCard key={role.id} role={role} isPending onPreview={handlePreview} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-accent/15 bg-white/95 p-8 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Fast switch</p>
              <p className="text-sm text-primary/70">
                Use the Hub link in any dashboard menu or the workspace switcher above each layout to move instantly.
              </p>
            </div>
          </div>
        </section>
      </div>

      <RolePreviewDialog
        role={previewRole}
        isAllowed={previewRole ? allowed.includes(previewRole.id) : false}
        isPending={previewRole ? !previewRole.registered : false}
        onClose={handleClosePreview}
        onUnlock={handleUnlock}
      />
    </div>
  );
};

export default DashboardHub;
