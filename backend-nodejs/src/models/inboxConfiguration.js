import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const isSqlite = sequelize.getDialect() === 'sqlite';
const allowedFileTypesDataType = isSqlite ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.STRING);

class InboxConfiguration extends Model {}

InboxConfiguration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    autoAssignEnabled: {
      field: 'auto_assign_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    defaultQueueId: {
      field: 'default_queue_id',
      type: DataTypes.UUID,
      allowNull: true
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
    attachmentsEnabled: {
      field: 'attachments_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    maxAttachmentMb: {
      field: 'max_attachment_mb',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25
    },
    allowedFileTypes: {
      field: 'allowed_file_types',
      type: allowedFileTypesDataType,
      allowNull: false,
      defaultValue: () => ['jpg', 'png', 'pdf']
    },
    aiAssistEnabled: {
      field: 'ai_assist_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    aiAssistProvider: {
      field: 'ai_assist_provider',
      type: DataTypes.STRING(120),
      allowNull: true
    },
    firstResponseSlaMinutes: {
      field: 'first_response_sla_minutes',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10
    },
    resolutionSlaMinutes: {
      field: 'resolution_sla_minutes',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 120
    },
    escalationPolicy: {
      field: 'escalation_policy',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: () => ({ levelOneMinutes: 15, levelTwoMinutes: 45 })
    },
    brandColor: {
      field: 'brand_color',
      type: DataTypes.STRING(9),
      allowNull: true
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    roleRestrictions: {
      field: 'role_restrictions',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: () => []
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.STRING(120),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'InboxConfiguration',
    tableName: 'InboxConfiguration'
  }
);

export default InboxConfiguration;
