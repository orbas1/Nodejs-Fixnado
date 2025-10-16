import { GlobeAltIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Card } from '../ui/index.js';

export default function ZoneGuardrails() {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
        <header className="flex items-center gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="text-base font-semibold text-primary">Launch guardrails</h3>
        </header>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Automatic OpenStreetMap validation with centroid boundary containment.</li>
          <li>RBAC enforced via admin session tokens with audit trail emission.</li>
          <li>Coverage analytics regenerate instantly for downstream dashboards.</li>
        </ul>
      </Card>

      <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
        <header className="flex items-center gap-3">
          <LockClosedIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="text-base font-semibold text-primary">Security posture</h3>
        </header>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Zones persist through the hardened admin API. Responses omit secrets.</li>
          <li>All requests require HTTPS, HSTS, and helmet-enforced CSP headers.</li>
          <li>Audit events stream to the analytics service for instant reconciliation.</li>
        </ul>
      </Card>

      <Card className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
        <header className="flex items-center gap-3">
          <GlobeAltIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="text-base font-semibold text-primary">Mobile parity</h3>
        </header>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Flutter companion app consumes the same endpoints for zone authoring.</li>
          <li>Geo-matching panel shares configuration tokens for deterministic results.</li>
          <li>Offline-safe drafts cached locally until connectivity is restored.</li>
        </ul>
      </Card>
    </section>
  );
}
