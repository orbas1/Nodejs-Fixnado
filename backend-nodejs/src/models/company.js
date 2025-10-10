import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Company extends Model {}

Company.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    legalStructure: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contactName: DataTypes.STRING,
    contactEmail: DataTypes.STRING,
    serviceRegions: DataTypes.TEXT,
    marketplaceIntent: DataTypes.TEXT,
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Company'
  }
);

export default Company;
