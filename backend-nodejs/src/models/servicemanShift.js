import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanShift extends Model {}

ServicemanShift.init(
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
    shiftDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'shift_date'
    },
    startTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: 'start_time',
      validate: {
        is: /^\d{2}:\d{2}$/
      }
    },
    endTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: 'end_time',
      validate: {
        is: /^\d{2}:\d{2}$/
      }
    },
    status: {
      type: DataTypes.ENUM('submitted', 'confirmed', 'needs_revision', 'provider_cancelled', 'completed'),
      allowNull: false,
      defaultValue: 'submitted'
    },
    assignmentTitle: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'assignment_title'
    },
    location: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'ServicemanShift',
    underscored: true
  }
);

export default ServicemanShift;
