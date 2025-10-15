import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MessageHistory extends Model {}

MessageHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    messageId: {
      field: 'message_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    snapshot: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    regionId: {
      field: 'region_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    capturedAt: {
      field: 'captured_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'MessageHistory',
    tableName: 'message_histories',
    timestamps: false
  }
);

export default MessageHistory;
