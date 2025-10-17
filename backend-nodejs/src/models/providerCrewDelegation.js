import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderCrewDelegation extends Model {}

ProviderCrewDelegation.init(
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
      allowNull: true
    },
    delegateName: {
      field: 'delegate_name',
      type: DataTypes.STRING(160),
      allowNull: false
    },
    delegateEmail: {
      field: 'delegate_email',
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    delegatePhone: {
      field: 'delegate_phone',
      type: DataTypes.STRING(48),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'scheduled', 'expired', 'revoked'),
      allowNull: false,
      defaultValue: 'active'
    },
    scope: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    startAt: {
      field: 'start_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    endAt: {
      field: 'end_at',
      type: DataTypes.DATE,
      allowNull: true
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
    modelName: 'ProviderCrewDelegation',
    tableName: 'ProviderCrewDelegation',
    indexes: [
      { fields: ['company_id', 'status'] },
      { fields: ['company_id', 'crew_member_id'] }
    ]
  }
);

export default ProviderCrewDelegation;
