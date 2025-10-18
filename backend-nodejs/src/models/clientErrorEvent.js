import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ClientErrorEvent extends Model {}

ClientErrorEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reference: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    correlationId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'correlation_id'
    },
    requestId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'request_id'
    },
    sessionId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'session_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id'
    },
    tenantId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'tenant_id'
    },
    boundaryId: {
      type: DataTypes.STRING(128),
      allowNull: false,
      field: 'boundary_id'
    },
    environment: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'development'
    },
    releaseChannel: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'development',
      field: 'release_channel'
    },
    appVersion: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'app_version'
    },
    buildNumber: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'build_number'
    },
    severity: {
      type: DataTypes.ENUM('debug', 'info', 'warning', 'error', 'fatal'),
      allowNull: false,
      defaultValue: 'error'
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
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    location: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'user_agent'
    },
    ipHash: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'ip_hash'
    },
    errorName: {
      type: DataTypes.STRING(128),
      allowNull: false,
      field: 'error_name'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'error_message'
    },
    errorStack: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_stack'
    },
    componentStack: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'component_stack'
    },
    fingerprint: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    breadcrumbs: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ClientErrorEvent',
    tableName: 'client_error_events',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['occurred_at'] },
      { fields: ['severity'] },
      { fields: ['boundary_id', 'severity'] },
      { fields: ['fingerprint'] }
    ]
  }
);

export default ClientErrorEvent;
