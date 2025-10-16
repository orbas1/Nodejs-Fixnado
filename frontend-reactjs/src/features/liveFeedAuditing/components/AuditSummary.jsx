import PropTypes from 'prop-types';
import { Card } from '../../../components/ui/index.js';

export default function AuditSummary({ summaryCards, topZones, topActors }) {
  return (
    <>
      {summaryCards.map((card) => (
        <Card key={card.label} className="bg-gradient-to-br from-white to-primary/5">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{card.label}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
        </Card>
      ))}

      <Card className="lg:col-span-2">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Top zones</p>
        <ul className="mt-4 space-y-3">
          {topZones.length === 0 ? <li className="text-sm text-slate-500">No zone activity recorded.</li> : null}
          {topZones.map((zone) => (
            <li key={zone.zoneId || zone.name} className="flex items-center justify-between text-sm text-slate-600">
              <span>{zone.name ?? 'Unassigned'}</span>
              <span className="font-semibold text-slate-900">{zone.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="lg:col-span-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Top actors</p>
        <ul className="mt-4 space-y-3">
          {topActors.length === 0 ? <li className="text-sm text-slate-500">No actor activity captured.</li> : null}
          {topActors.map((actor) => (
            <li key={actor.actorId || actor.name} className="flex items-center justify-between text-sm text-slate-600">
              <span>{actor.name ?? 'Unassigned'}</span>
              <span className="font-semibold text-slate-900">{actor.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

AuditSummary.propTypes = {
  summaryCards: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })
  ).isRequired,
  topZones: PropTypes.arrayOf(
    PropTypes.shape({
      zoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      count: PropTypes.number.isRequired
    })
  ).isRequired,
  topActors: PropTypes.arrayOf(
    PropTypes.shape({
      actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      count: PropTypes.number.isRequired
    })
  ).isRequired
};
