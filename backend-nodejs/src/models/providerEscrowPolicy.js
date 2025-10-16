import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderEscrowPolicy extends Model {}

ProviderEscrowPolicy.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    providerId: {
      field: 'provider_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    autoReleaseDays: {
      field: 'auto_release_days',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    requiresDualApproval: {
      field: 'requires_dual_approval',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    maxAmount: {
      field: 'max_amount',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    notifyRoles: {
      field: 'notify_roles',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    documentChecklist: {
      field: 'document_checklist',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    releaseConditions: {
      field: 'release_conditions',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
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
    }
  },
  {
    sequelize,
    modelName: 'ProviderEscrowPolicy',
    tableName: 'ProviderEscrowPolicy',
    indexes: [
      {
        fields: ['provider_id']
      },
      {
        fields: ['company_id']
      }
    ]
  }
);

export default ProviderEscrowPolicy;
