import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CommunicationsInboxConfiguration extends Model {}

CommunicationsInboxConfiguration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      field: 'tenant_id'
    },
    liveRoutingEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'live_routing_enabled'
    },
    defaultGreeting: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'default_greeting'
    },
    aiAssistDisplayName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: 'Fixnado Assist',
      field: 'ai_assist_display_name'
    },
    aiAssistDescription: {
      type: DataTypes.STRING(240),
      allowNull: true,
      field: 'ai_assist_description'
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    quietHoursStart: {
      type: DataTypes.STRING(5),
      allowNull: true,
      field: 'quiet_hours_start'
    },
    quietHoursEnd: {
      type: DataTypes.STRING(5),
      allowNull: true,
      field: 'quiet_hours_end'
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'CommunicationsInboxConfiguration',
    tableName: 'CommunicationsInboxConfiguration'
  }
);

export default CommunicationsInboxConfiguration;
