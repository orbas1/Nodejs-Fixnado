import { useMemo, useState } from 'react';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import { usePersonaAccess } from '../hooks/usePersonaAccess.js';
import RoleCard from '../components/dashboard/hub/RoleCard.jsx';
import RolePreviewDialog from '../components/dashboard/hub/RolePreviewDialog.jsx';

const DashboardHub = () => {
  const { allowed, grantAccess } = usePersonaAccess();
  const [statusMessage, setStatusMessage] = useState('');
  const [previewRole, setPreviewRole] = useState(null);

  const registeredRoles = useMemo(() => DASHBOARD_ROLES.filter((role) => role.registered), []);
  const unlockedRoles = useMemo(
    () => registeredRoles.filter((role) => allowed.includes(role.id)),
    [allowed, registeredRoles]
  );
  const lockedRoles = useMemo(
    () => registeredRoles.filter((role) => !allowed.includes(role.id)),
    [allowed, registeredRoles]
  );

  const handleUnlock = (role) => {
    if (!role) return;
    grantAccess(role.id);
    setStatusMessage(`${role.shortName} ready`);
    setPreviewRole((current) => (current?.id === role.id ? null : current));
    window.setTimeout(() => setStatusMessage(''), 1800);
  };

  const handlePreview = (role) => {
    setPreviewRole(role);
  };

  const handleClosePreview = () => {
    setPreviewRole(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-8 py-14">
        <header className="flex flex-col gap-6">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Dashboards / Hub
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-semibold">Choose a workspace</h1>
            {statusMessage ? (
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                {statusMessage}
              </span>
            ) : null}
          </div>
        </header>

        <section className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {unlockedRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isAllowed
                onPreview={handlePreview}
                onUnlock={handleUnlock}
              />
            ))}
            {lockedRoles.map((role) => (
              <RoleCard key={role.id} role={role} onPreview={handlePreview} onUnlock={handleUnlock} />
            ))}
          </div>
        </section>
      </div>

      <RolePreviewDialog
        role={previewRole}
        isAllowed={previewRole ? allowed.includes(previewRole.id) : false}
        onClose={handleClosePreview}
        onUnlock={handleUnlock}
      />
    </div>
  );
};

export default DashboardHub;
