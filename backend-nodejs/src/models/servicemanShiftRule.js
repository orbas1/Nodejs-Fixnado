import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanShiftRule extends Model {}

ServicemanShiftRule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    profileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'profile_id'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_of_week'
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time'
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'available'
    },
    locationLabel: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'location_label'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ServicemanShiftRule',
    tableName: 'serviceman_shift_rules',
    underscored: true
  }
);

export default ServicemanShiftRule;
