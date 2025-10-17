import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanExpenseClaim extends Model {}

ServicemanExpenseClaim.init(
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
    category: {
      type: DataTypes.ENUM('travel', 'equipment', 'meal', 'accommodation', 'training', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: 'GBP'
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'reimbursed', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at'
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at'
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approved_by'
    },
    receipts: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServicemanExpenseClaim',
    tableName: 'serviceman_expense_claims',
    underscored: true
  }
);

export default ServicemanExpenseClaim;
