import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CustomJobBidMessage extends Model {}

CustomJobBidMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bidId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    authorRole: {
      type: DataTypes.ENUM('customer', 'provider', 'admin'),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }
  },
  {
    sequelize,
    modelName: 'CustomJobBidMessage'
  }
);

export default CustomJobBidMessage;
