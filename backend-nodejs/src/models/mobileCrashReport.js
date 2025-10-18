import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MobileCrashReport extends Model {}

MobileCrashReport.init(
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
      allowNull: false,
      defaultValue: '0.0.0',
      field: 'app_version'
    },
    buildNumber: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'build_number'
    },
    platform: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    platformVersion: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'platform_version'
    },
    deviceModel: {
      type: DataTypes.STRING(96),
      allowNull: true,
      field: 'device_model'
    },
    deviceManufacturer: {
      type: DataTypes.STRING(96),
      allowNull: true,
      field: 'device_manufacturer'
    },
    deviceIdentifierHash: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'device_identifier_hash'
    },
    locale: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    isEmulator: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_emulator'
    },
    isReleaseBuild: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_release_build'
    },
    severity: {
      type: DataTypes.ENUM('debug', 'info', 'warning', 'error', 'fatal'),
      allowNull: false,
      defaultValue: 'fatal'
    },
    errorType: {
      type: DataTypes.STRING(128),
      allowNull: false,
      field: 'error_type'
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
    fingerprint: {
      type: DataTypes.STRING(64),
      allowNull: false
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
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    breadcrumbs: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    threads: {
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
    modelName: 'MobileCrashReport',
    tableName: 'mobile_crash_reports',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['occurred_at'] },
      { fields: ['environment'] },
      { fields: ['fingerprint'] }
    ]
  }
);

export default MobileCrashReport;
