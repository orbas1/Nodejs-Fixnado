import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class UiPreferenceTelemetry extends Model {}

UiPreferenceTelemetry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    userRole: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    theme: {
      type: DataTypes.ENUM('standard', 'dark', 'emo'),
      allowNull: false
    },
    density: {
      type: DataTypes.ENUM('compact', 'comfortable'),
      allowNull: false
    },
    contrast: {
      type: DataTypes.ENUM('standard', 'high'),
      allowNull: false
    },
    marketingVariant: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    locale: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    source: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'theme-studio'
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    correlationId: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    ipHash: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    dataVersion: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: '1.0.0'
    }
  },
  {
    sequelize,
    modelName: 'UiPreferenceTelemetry',
    tableName: 'ui_preference_telemetry',
    indexes: [
      { fields: ['tenant_id', 'occurred_at'] },
      { fields: ['theme'] },
      { fields: ['marketing_variant'] }
    ]
  }
);

export default UiPreferenceTelemetry;
