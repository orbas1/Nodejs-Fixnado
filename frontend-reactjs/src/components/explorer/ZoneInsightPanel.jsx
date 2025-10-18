import PropTypes from 'prop-types';
import { ClockIcon, BoltIcon, MapPinIcon } from '@heroicons/react/24/outline';
import StatusPill from '../ui/StatusPill.jsx';
import './explorer.css';

const demandTone = {
  high: 'danger',
  medium: 'warning',
  low: 'success'
};

export default function ZoneInsightPanel({ zone, matches, analytics }) {
  if (!zone) {
    return (
      <aside className="fx-zone-panel" aria-live="polite">
        <h2>Select a zone</h2>
        <p className="fx-zone-panel__hint">Choose a region on the map to load insight.</p>
      </aside>
    );
  }

  const demandLabel =
    zone.demandLevel === 'high' ? 'High' : zone.demandLevel === 'medium' ? 'Balanced' : 'Emerging';

  const acceptanceText = analytics.averageAcceptanceMinutes
    ? `${Math.round(analytics.averageAcceptanceMinutes)} min`
    : 'No data';

  const signalText = zone.metadata?.signals?.length
    ? zone.metadata.signals.join(', ')
    : 'Standard monitoring';

  const boundsText = zone.boundingBox
    ? `${zone.boundingBox.west.toFixed(2)}°W → ${zone.boundingBox.east.toFixed(2)}°E`
    : 'Sync pending';

  return (
    <aside className="fx-zone-panel" aria-live="polite">
      <header className="fx-zone-panel__header">
        <div>
          <h2>{zone.name}</h2>
          <p className="fx-zone-panel__meta">Company ID {zone.companyId}</p>
        </div>
        <StatusPill tone={demandTone[zone.demandLevel] ?? 'info'}>{demandLabel}</StatusPill>
      </header>

      <dl className="fx-zone-panel__stats">
        <div>
          <dt>Active services</dt>
          <dd>{matches?.services ?? 0}</dd>
        </div>
        <div>
          <dt>Marketplace items</dt>
          <dd>{matches?.items ?? 0}</dd>
        </div>
        <div>
          <dt>Open bookings</dt>
          <dd>{analytics.openBookings}</dd>
        </div>
        <div>
          <dt>Open SLA breaches</dt>
          <dd>{analytics.slaBreaches}</dd>
        </div>
      </dl>

      <dl className="fx-zone-panel__insights">
        <div>
          <dt>
            <ClockIcon aria-hidden="true" /> Accept
          </dt>
          <dd>{acceptanceText}</dd>
        </div>
        <div>
          <dt>
            <BoltIcon aria-hidden="true" /> Signals
          </dt>
          <dd>{signalText}</dd>
        </div>
        <div>
          <dt>
            <MapPinIcon aria-hidden="true" /> Bounds
          </dt>
          <dd>{boundsText}</dd>
        </div>
      </dl>
    </aside>
  );
}

ZoneInsightPanel.propTypes = {
  zone: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    companyId: PropTypes.string,
    demandLevel: PropTypes.string,
    metadata: PropTypes.object,
    boundingBox: PropTypes.shape({
      west: PropTypes.number,
      east: PropTypes.number
    })
  }),
  matches: PropTypes.shape({
    services: PropTypes.number,
    items: PropTypes.number
  }),
  analytics: PropTypes.shape({
    openBookings: PropTypes.number.isRequired,
    slaBreaches: PropTypes.number.isRequired,
    averageAcceptanceMinutes: PropTypes.number
  }).isRequired
};

ZoneInsightPanel.defaultProps = {
  zone: null,
  matches: { services: 0, items: 0 }
};
