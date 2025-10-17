import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderCrewMember extends Model {}

ProviderCrewMember.init(
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
    fullName: {
      field: 'full_name',
      type: DataTypes.STRING(160),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    avatarUrl: {
      field: 'avatar_url',
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'standby', 'leave', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    employmentType: {
      field: 'employment_type',
      type: DataTypes.ENUM('employee', 'contractor', 'partner'),
      allowNull: false,
      defaultValue: 'employee'
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    defaultShiftStart: {
      field: 'default_shift_start',
      type: DataTypes.TIME,
      allowNull: true
    },
    defaultShiftEnd: {
      field: 'default_shift_end',
      type: DataTypes.TIME,
      allowNull: true
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
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
    modelName: 'ProviderCrewMember',
    tableName: 'ProviderCrewMember',
    indexes: [
      { fields: ['company_id', 'status'] },
      { fields: ['company_id', 'employment_type'] },
      { fields: ['company_id', 'full_name'] }
    ]
  }
);

export default ProviderCrewMember;
