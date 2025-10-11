import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ConversationMessage extends Model {}

ConversationMessage.init(
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
    senderParticipantId: {
      field: 'sender_participant_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    messageType: {
      field: 'message_type',
      type: DataTypes.ENUM('user', 'assistant', 'system', 'automation', 'notification'),
      allowNull: false,
      defaultValue: 'user'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    aiAssistUsed: {
      field: 'ai_assist_used',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    aiConfidenceScore: {
      field: 'ai_confidence_score',
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ConversationMessage',
    tableName: 'ConversationMessage'
  }
);

export default ConversationMessage;
