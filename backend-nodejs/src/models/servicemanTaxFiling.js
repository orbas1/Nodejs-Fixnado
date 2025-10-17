import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanTaxFiling extends Model {}

ServicemanTaxFiling.init(
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
    taxYear: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'tax_year'
    },
    period: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    filingType: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'filing_type'
    },
    submissionMethod: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'submission_method'
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'draft'
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at'
    },
    amountDue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'amount_due'
    },
    amountPaid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'amount_paid'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    reference: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    documents: {
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
    modelName: 'ServicemanTaxFiling',
    tableName: 'serviceman_tax_filings',
    underscored: true
  }
);

export default ServicemanTaxFiling;
