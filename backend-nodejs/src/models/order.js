import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'funded', 'in_progress', 'completed', 'disputed'),
      defaultValue: 'draft'
    },
    totalAmount: DataTypes.DECIMAL,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    scheduledFor: DataTypes.DATE,
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'region_id'
    }
  },
  {
    sequelize,
    modelName: 'Order'
  }
);

export default Order;
