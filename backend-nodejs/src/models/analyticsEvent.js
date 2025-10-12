import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AnalyticsEvent extends Model {}

AnalyticsEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    domain: {
      type: DataTypes.ENUM('zones', 'bookings', 'rentals', 'disputes', 'ads', 'communications'),
      allowNull: false
    },
    eventName: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'event_name'
    },
    schemaVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'schema_version'
    },
    entityType: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'entity_type'
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'entity_id'
    },
    entityExternalId: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'entity_external_id'
    },
    actorType: {
      type: DataTypes.STRING(48),
      allowNull: true,
      field: 'actor_type'
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'actor_id'
    },
    actorLabel: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'actor_label'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'tenant_id'
    },
    source: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'api'
    },
    channel: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    correlationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'correlation_id'
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'occurred_at'
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'received_at'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'AnalyticsEvent',
    tableName: 'AnalyticsEvent',
    indexes: [
      { fields: ['domain', 'event_name', 'occurred_at'], name: 'analytics_event_domain_event_occurred' },
      { fields: ['entity_type', 'entity_id'], name: 'analytics_event_entity_lookup' },
      { fields: ['tenant_id', 'occurred_at'], name: 'analytics_event_tenant_time' },
      { fields: ['correlation_id'], name: 'analytics_event_correlation' }
    ]
  }
);

export default AnalyticsEvent;
