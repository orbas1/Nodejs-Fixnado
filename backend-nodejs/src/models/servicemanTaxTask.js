import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanTaxTask extends Model {}

ServicemanTaxTask.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'serviceman_id'
    },
    filingId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'filing_id'
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'planned'
    },
    priority: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'normal'
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to'
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    checklist: {
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
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'ServicemanTaxTask',
    tableName: 'serviceman_tax_tasks',
    underscored: true
  }
);

export default ServicemanTaxTask;
