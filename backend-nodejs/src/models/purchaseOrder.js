import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PurchaseOrder extends Model {}

PurchaseOrder.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'awaiting_approval',
        'approved',
        'sent',
        'partial',
        'received',
        'closed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'draft'
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    budgetId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    supplierName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GBP'
    },
    subtotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxTotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    expectedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvalRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'PurchaseOrder'
  }
);

export default PurchaseOrder;
