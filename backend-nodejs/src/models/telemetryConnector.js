import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class TelemetryConnector extends Model {}

TelemetryConnector.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    connectorType: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'connector_type'
    },
    region: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('healthy', 'warning', 'degraded', 'offline'),
      allowNull: false,
      defaultValue: 'healthy'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dashboardUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'dashboard_url'
    },
    ingestionEndpoint: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'ingestion_endpoint'
    },
    eventsPerMinuteTarget: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'events_per_minute_target'
    },
    eventsPerMinuteActual: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'events_per_minute_actual'
    },
    lastHealthCheckAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_health_check_at'
    },
    logoUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'logo_url'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'TelemetryConnector',
    tableName: 'TelemetryConnector',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default TelemetryConnector;
