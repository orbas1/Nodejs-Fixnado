import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WalletTransaction extends Model {}

WalletTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    walletAccountId: {
      field: 'wallet_account_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit', 'hold', 'release', 'refund', 'adjustment'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    referenceType: {
      field: 'reference_type',
      type: DataTypes.STRING(64),
      allowNull: true
    },
    referenceId: {
      field: 'reference_id',
      type: DataTypes.STRING(128),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    actorId: {
      field: 'actor_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    actorRole: {
      field: 'actor_role',
      type: DataTypes.STRING(32),
      allowNull: true
    },
    balanceBefore: {
      field: 'balance_before',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    balanceAfter: {
      field: 'balance_after',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    pendingBefore: {
      field: 'pending_before',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    pendingAfter: {
      field: 'pending_after',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    runningBalance: {
      field: 'running_balance',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    occurredAt: {
      field: 'occurred_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'WalletTransaction',
    tableName: 'wallet_transactions',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default WalletTransaction;
