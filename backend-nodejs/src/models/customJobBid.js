import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CustomJobBid extends Model {}

CustomJobBid.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GBP'
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'withdrawn'),
      allowNull: false,
      defaultValue: 'pending'
    },
    message: {
      type: DataTypes.TEXT,
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
    modelName: 'CustomJobBid'
  }
);

export default CustomJobBid;
