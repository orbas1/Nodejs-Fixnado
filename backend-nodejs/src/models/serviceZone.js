import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServiceZone extends Model {}

ServiceZone.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    geoJson: DataTypes.JSON,
    demandLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    }
  },
  {
    sequelize,
    modelName: 'ServiceZone'
  }
);

export default ServiceZone;
