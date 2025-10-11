import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class UiPreferenceTelemetrySnapshot extends Model {}

UiPreferenceTelemetrySnapshot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    capturedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'captured_at'
    },
    rangeKey: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'range_key'
    },
    rangeStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'range_start'
    },
    rangeEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'range_end'
    },
    tenantId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'tenant_id'
    },
    events: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    emoShare: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'emo_share'
    },
    leadingTheme: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'leading_theme'
    },
    leadingThemeShare: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'leading_theme_share'
    },
    staleMinutes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'stale_minutes'
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'UiPreferenceTelemetrySnapshot',
    tableName: 'ui_preference_telemetry_snapshot',
    underscored: true,
    indexes: [
      { fields: ['captured_at'] },
      { fields: ['range_key', 'tenant_id'] }
    ]
  }
);

export default UiPreferenceTelemetrySnapshot;
