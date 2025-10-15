import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Conversation extends Model {}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    subject: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    createdById: {
      field: 'created_by_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    createdByType: {
      field: 'created_by_type',
      type: DataTypes.ENUM('user', 'company', 'serviceman', 'admin', 'enterprise'),
      allowNull: false,
      defaultValue: 'user'
    },
    defaultTimezone: {
      field: 'default_timezone',
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    quietHoursStart: {
      field: 'quiet_hours_start',
      type: DataTypes.STRING(5),
      allowNull: true
    },
    quietHoursEnd: {
      field: 'quiet_hours_end',
      type: DataTypes.STRING(5),
      allowNull: true
    },
    aiAssistDefault: {
      field: 'ai_assist_default',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    retentionDays: {
      field: 'retention_days',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 90
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'region_id'
    }
  },
  {
    sequelize,
    modelName: 'Conversation',
    tableName: 'Conversation'
  }
);

export default Conversation;
