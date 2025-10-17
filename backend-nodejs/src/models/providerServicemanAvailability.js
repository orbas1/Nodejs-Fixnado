import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderServicemanAvailability extends Model {}

ProviderServicemanAvailability.init(
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
    dayOfWeek: {
      field: 'day_of_week',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    startTime: {
      field: 'start_time',
      type: DataTypes.STRING(8),
      allowNull: false
    },
    endTime: {
      field: 'end_time',
      type: DataTypes.STRING(8),
      allowNull: false
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    isActive: {
      field: 'is_active',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'ProviderServicemanAvailability',
    tableName: 'ProviderServicemanAvailabilities',
    underscored: true
  }
);

export default ProviderServicemanAvailability;
