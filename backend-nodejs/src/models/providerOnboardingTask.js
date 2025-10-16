import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderOnboardingTask extends Model {}

ProviderOnboardingTask.init(
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
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'blocked', 'completed'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    stage: {
      type: DataTypes.ENUM('intake', 'documents', 'compliance', 'go-live', 'live'),
      allowNull: false,
      defaultValue: 'intake'
    },
    ownerId: {
      field: 'owner_id',
      type: DataTypes.UUID,
      allowNull: true
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
    modelName: 'ProviderOnboardingTask',
    tableName: 'ProviderOnboardingTask',
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['stage']
      },
      {
        fields: ['priority']
      }
    ]
  }
);

export default ProviderOnboardingTask;
