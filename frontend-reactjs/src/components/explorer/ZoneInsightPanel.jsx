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
        <h2>No zone selected</h2>
        <p>Select a territory on the map to review demand, SLA performance, and matching inventory.</p>
      </aside>
    );
  }

  return (
    <aside className="fx-zone-panel" aria-live="polite">
      <header className="fx-zone-panel__header">
        <div>
          <h2>{zone.name}</h2>
          <p className="fx-zone-panel__meta">Company ID {zone.companyId}</p>
        </div>
        <StatusPill tone={demandTone[zone.demandLevel] ?? 'info'}>
          {zone.demandLevel === 'high' && 'High demand'}
          {zone.demandLevel === 'medium' && 'Balanced demand'}
          {zone.demandLevel === 'low' && 'Emerging demand'}
        </StatusPill>
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

      <ul className="fx-zone-panel__insights">
        <li>
          <ClockIcon aria-hidden="true" />
          <div>
            <p>Average acceptance time</p>
            <p className="fx-zone-panel__insight-value">
              {analytics.averageAcceptanceMinutes ? `${Math.round(analytics.averageAcceptanceMinutes)} minutes` : 'No samples yet'}
            </p>
          </div>
        </li>
        <li>
          <BoltIcon aria-hidden="true" />
          <div>
            <p>Demand signals</p>
            <p className="fx-zone-panel__insight-value">
              {zone.metadata?.signals?.length
                ? zone.metadata.signals.join(', ')
                : 'Monitoring default utilisation and SLA adherence'}
            </p>
          </div>
        </li>
        <li>
          <MapPinIcon aria-hidden="true" />
          <div>
            <p>Coverage bounds</p>
            <p className="fx-zone-panel__insight-value">
              {zone.boundingBox
                ? `${zone.boundingBox.west.toFixed(2)}°W → ${zone.boundingBox.east.toFixed(2)}°E`
                : 'Awaiting boundary sync'}
            </p>
          </div>
        </li>
      </ul>
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
