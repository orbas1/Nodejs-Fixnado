import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderCrewAvailability extends Model {}

ProviderCrewAvailability.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    crewMemberId: {
      field: 'crew_member_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    dayOfWeek: {
      field: 'day_of_week',
      type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      allowNull: false
    },
    startTime: {
      field: 'start_time',
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      field: 'end_time',
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('available', 'on_call', 'unavailable', 'standby'),
      allowNull: false,
      defaultValue: 'available'
    },
    location: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    effectiveFrom: {
      field: 'effective_from',
      type: DataTypes.DATE,
      allowNull: true
    },
    effectiveTo: {
      field: 'effective_to',
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderCrewAvailability',
    tableName: 'ProviderCrewAvailability',
    indexes: [
      { fields: ['company_id', 'crew_member_id', 'day_of_week'] },
      { fields: ['crew_member_id', 'day_of_week'] }
    ]
  }
);

export default ProviderCrewAvailability;
