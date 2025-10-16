import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WalletAccount extends Model {}

WalletAccount.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ownerType: {
      field: 'owner_type',
      type: DataTypes.STRING(32),
      allowNull: false
    },
    ownerId: {
      field: 'owner_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    displayName: {
      field: 'display_name',
      type: DataTypes.STRING(160),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'active'
    },
    balance: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    holdBalance: {
      field: 'hold_balance',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: 'GBP'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    lastReconciledAt: {
      field: 'last_reconciled_at',
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WalletAccount',
    tableName: 'wallet_accounts',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default WalletAccount;
