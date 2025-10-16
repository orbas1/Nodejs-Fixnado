import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class LiveFeedAuditEvent extends Model {}

LiveFeedAuditEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'occurred_at'
    },
    eventType: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'event_type'
    },
    source: {
      type: DataTypes.ENUM('system', 'manual'),
      allowNull: false,
      defaultValue: 'system'
    },
    status: {
      type: DataTypes.ENUM('open', 'investigating', 'resolved', 'dismissed'),
      allowNull: false,
      defaultValue: 'open'
    },
    severity: {
      type: DataTypes.ENUM('info', 'low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'info'
    },
    summary: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resourceType: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'resource_type'
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'resource_id'
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'post_id'
    },
    postSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'post_snapshot'
    },
    zoneId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'zone_id'
    },
    zoneSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'zone_snapshot'
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'company_id'
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'actor_id'
    },
    actorRole: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'actor_role'
    },
    actorPersona: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'actor_persona'
    },
    actorSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'actor_snapshot'
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assignee_id'
    },
    nextActionAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_action_at'
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    modelName: 'LiveFeedAuditEvent',
    tableName: 'live_feed_audit_events',
    underscored: true
  }
);

export default LiveFeedAuditEvent;
