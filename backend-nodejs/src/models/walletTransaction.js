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
      type: DataTypes.STRING(24),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    referenceType: {
      field: 'reference_type',
      type: DataTypes.STRING(64),
      allowNull: true
    },
    referenceId: {
      field: 'reference_id',
      type: DataTypes.UUID,
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
    occurredAt: {
      field: 'occurred_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
