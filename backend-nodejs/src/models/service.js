import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Service extends Model {}

Service.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    category: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    }
  },
  {
    sequelize,
    modelName: 'Service'
  }
);

export default Service;
