import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderTaxFiling extends Model {}

ProviderTaxFiling.init(
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
    periodStart: {
      field: 'period_start',
      type: DataTypes.DATE,
      allowNull: false
    },
    periodEnd: {
      field: 'period_end',
      type: DataTypes.DATE,
      allowNull: false
    },
    dueAt: {
      field: 'due_at',
      type: DataTypes.DATE,
      allowNull: false
    },
    filedAt: {
      field: 'filed_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'filed', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    taxableSalesAmount: {
      field: 'taxable_sales_amount',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    taxCollectedAmount: {
      field: 'tax_collected_amount',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    taxDueAmount: {
      field: 'tax_due_amount',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    referenceNumber: {
      field: 'reference_number',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    submittedBy: {
      field: 'submitted_by',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    supportingDocumentUrl: {
      field: 'supporting_document_url',
      type: DataTypes.TEXT,
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
    modelName: 'ProviderTaxFiling',
    tableName: 'ProviderTaxFiling'
  }
);

export default ProviderTaxFiling;
