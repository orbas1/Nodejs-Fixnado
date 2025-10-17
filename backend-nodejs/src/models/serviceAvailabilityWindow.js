import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServiceAvailabilityWindow extends Model {}

ServiceAvailabilityWindow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'service_id',
      references: {
        model: 'Service',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'day_of_week',
      validate: {
        min: 0,
        max: 6
      }
    },
    startTime: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'end_time'
    },
    maxBookings: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_bookings'
    },
    label: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServiceAvailabilityWindow',
    tableName: 'ServiceAvailabilityWindow',
    indexes: [
      {
        fields: ['service_id', 'day_of_week']
      }
    ]
  }
);

export default ServiceAvailabilityWindow;
