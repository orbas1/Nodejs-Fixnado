import PropTypes from 'prop-types';
import { Card } from '../../ui/index.js';
import { ShieldCheckIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const GUARDRAIL_CARDS = [
  {
    id: 'launch-guardrails',
    icon: ShieldCheckIcon,
    title: 'Launch guardrails',
    bullets: [
      'Automatic OpenStreetMap validation with centroid boundary containment.',
      'RBAC enforced via admin session tokens with audit trail emission.',
      'Coverage analytics regenerate instantly for downstream dashboards.'
    ]
  },
  {
    id: 'security-posture',
    icon: LockClosedIcon,
    title: 'Security posture',
    bullets: [
      'Zones persist through the hardened admin API. Responses omit secrets.',
      'All requests require HTTPS, HSTS, and helmet-enforced CSP headers.',
      'Audit events stream to the analytics service for instant reconciliation.'
    ]
  },
  {
    id: 'mobile-parity',
    icon: GlobeAltIcon,
    title: 'Mobile parity',
    bullets: [
      'Flutter companion app consumes the same endpoints for zone authoring.',
      'Geo-matching panel shares configuration tokens for deterministic results.',
      'Offline-safe drafts cached locally until connectivity is restored.'
    ]
  }
];

export default function ZoneOverviewSection({ id, meta }) {
  return (
    <section id={id} className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Zone governance</p>
        <h2 className="text-2xl font-semibold text-primary">Operational command signals</h2>
        <p className="text-sm text-slate-600">
          Snapshot of live service zones, verification posture, and role-based access control coverage across the
          Fixnado network.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {meta.map((entry) => (
          <Card key={entry.label} className="border border-slate-200/80 bg-white/95 p-4 shadow-md">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{entry.label}</p>
            <p className={`mt-2 text-lg font-semibold ${entry.emphasis ? 'text-primary' : 'text-slate-700'}`}>
              {entry.value}
            </p>
            {entry.caption ? <p className="mt-2 text-xs text-slate-500">{entry.caption}</p> : null}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {GUARDRAIL_CARDS.map((card) => (
          <Card key={card.id} className="border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-primary/10">
            <header className="flex items-center gap-3">
              <card.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="text-base font-semibold text-primary">{card.title}</h3>
            </header>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {card.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}

ZoneOverviewSection.propTypes = {
  id: PropTypes.string.isRequired,
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      caption: PropTypes.node,
      emphasis: PropTypes.bool
    })
  )
};

ZoneOverviewSection.defaultProps = {
  meta: []
};
