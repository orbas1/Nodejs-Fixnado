import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderServicemanZone extends Model {}

ProviderServicemanZone.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      field: 'serviceman_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    zoneId: {
      field: 'zone_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    isPrimary: {
      field: 'is_primary',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'ProviderServicemanZone',
    tableName: 'ProviderServicemanZones',
    underscored: true
  }
);

export default ProviderServicemanZone;
