import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderOnboardingRequirement extends Model {}

ProviderOnboardingRequirement.init(
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
    name: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('document', 'insurance', 'payment', 'training', 'integration', 'other'),
      allowNull: false,
      defaultValue: 'document'
    },
    status: {
      type: DataTypes.ENUM('pending', 'submitted', 'approved', 'rejected', 'waived'),
      allowNull: false,
      defaultValue: 'pending'
    },
    stage: {
      type: DataTypes.ENUM('intake', 'documents', 'compliance', 'go-live', 'live'),
      allowNull: false,
      defaultValue: 'documents'
    },
    dueDate: {
      field: 'due_date',
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      field: 'completed_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewerId: {
      field: 'reviewer_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    documentId: {
      field: 'document_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    externalUrl: {
      field: 'external_url',
      type: DataTypes.STRING(255),
      allowNull: true
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
    modelName: 'ProviderOnboardingRequirement',
    tableName: 'ProviderOnboardingRequirement',
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      }
    ]
  }
);

export default ProviderOnboardingRequirement;
