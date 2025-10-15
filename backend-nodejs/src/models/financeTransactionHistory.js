import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class FinanceTransactionHistory extends Model {}

FinanceTransactionHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      field: 'order_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    escrowId: {
      field: 'escrow_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    disputeId: {
      field: 'dispute_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    eventType: {
      field: 'event_type',
      type: DataTypes.STRING(64),
      allowNull: false
    },
    occurredAt: {
      field: 'occurred_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    actorId: {
      field: 'actor_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    snapshot: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    regionId: {
      field: 'region_id',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'FinanceTransactionHistory',
    tableName: 'finance_transaction_histories',
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  }
);

export default FinanceTransactionHistory;
