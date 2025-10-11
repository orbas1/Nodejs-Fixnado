import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ConversationParticipant extends Model {}

ConversationParticipant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversationId: {
      field: 'conversation_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    participantType: {
      field: 'participant_type',
      type: DataTypes.ENUM('user', 'company', 'serviceman', 'admin', 'enterprise', 'support_bot'),
      allowNull: false
    },
    participantReferenceId: {
      field: 'participant_reference_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    displayName: {
      field: 'display_name',
      type: DataTypes.STRING(160),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('customer', 'provider', 'support', 'finance', 'compliance', 'operations', 'guest', 'ai_assistant'),
      allowNull: false,
      defaultValue: 'customer'
    },
    aiAssistEnabled: {
      field: 'ai_assist_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notificationsEnabled: {
      field: 'notifications_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    videoEnabled: {
      field: 'video_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    lastReadAt: {
      field: 'last_read_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    agoraUid: {
      field: 'agora_uid',
      type: DataTypes.STRING(64),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ConversationParticipant',
    tableName: 'ConversationParticipant'
  }
);

export default ConversationParticipant;
