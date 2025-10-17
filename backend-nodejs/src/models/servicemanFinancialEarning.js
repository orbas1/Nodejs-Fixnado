import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanFinancialEarning extends Model {}

ServicemanFinancialEarning.init(
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
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'booking_id'
    },
    reference: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: 'GBP'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'in_progress', 'payable', 'paid', 'withheld'),
      allowNull: false,
      defaultValue: 'pending'
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at'
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at'
    },
    recordedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'recorded_by'
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
    modelName: 'ServicemanFinancialEarning',
    tableName: 'serviceman_financial_earnings',
    underscored: true
  }
);

export default ServicemanFinancialEarning;
