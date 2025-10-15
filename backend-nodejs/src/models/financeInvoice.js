import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class FinanceInvoice extends Model {}

FinanceInvoice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      field: 'order_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    invoiceNumber: {
      field: 'invoice_number',
      type: DataTypes.STRING(48),
      allowNull: false,
      unique: true
    },
    amountDue: {
      field: 'amount_due',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    amountPaid: {
      field: 'amount_paid',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    issuedAt: {
      field: 'issued_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    dueAt: {
      field: 'due_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    paidAt: {
      field: 'paid_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    pdfUrl: {
      field: 'pdf_url',
      type: DataTypes.STRING(512),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    regionId: {
      field: 'region_id',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'FinanceInvoice',
    tableName: 'finance_invoices',
    underscored: true
  }
);

export default FinanceInvoice;
