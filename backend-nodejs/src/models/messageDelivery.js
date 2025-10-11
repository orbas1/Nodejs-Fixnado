import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MessageDelivery extends Model {}

MessageDelivery.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversationMessageId: {
      field: 'conversation_message_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    participantId: {
      field: 'participant_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'delivered', 'read', 'suppressed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    suppressedReason: {
      field: 'suppressed_reason',
      type: DataTypes.STRING(120),
      allowNull: true
    },
    deliveredAt: {
      field: 'delivered_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    readAt: {
      field: 'read_at',
      type: DataTypes.DATE,
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
    modelName: 'MessageDelivery',
    tableName: 'MessageDelivery'
  }
);

export default MessageDelivery;
