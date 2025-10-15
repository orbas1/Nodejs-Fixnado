import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Region extends Model {}

Region.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    residencyTier: {
      field: 'residency_tier',
      type: DataTypes.ENUM('strict', 'standard', 'flex'),
      allowNull: false,
      defaultValue: 'standard'
    },
    dataResidencyStatement: {
      field: 'data_residency_statement',
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Region',
    tableName: 'Region'
  }
);

export default Region;
