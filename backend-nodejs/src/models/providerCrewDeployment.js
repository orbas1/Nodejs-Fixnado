import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderCrewDeployment extends Model {}

ProviderCrewDeployment.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    assignmentType: {
      field: 'assignment_type',
      type: DataTypes.ENUM('booking', 'project', 'standby', 'maintenance', 'training', 'support'),
      allowNull: false,
      defaultValue: 'booking'
    },
    referenceId: {
      field: 'reference_id',
      type: DataTypes.STRING(120),
      allowNull: true
    },
    startAt: {
      field: 'start_at',
      type: DataTypes.DATE,
      allowNull: false
    },
    endAt: {
      field: 'end_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.UUID,
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
    modelName: 'ProviderCrewDeployment',
    tableName: 'ProviderCrewDeployment',
    indexes: [
      { fields: ['company_id', 'crew_member_id', 'start_at'] },
      { fields: ['company_id', 'status'] }
    ]
  }
);

export default ProviderCrewDeployment;
