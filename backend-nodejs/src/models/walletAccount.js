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
    userId: {
      field: 'user_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    displayName: {
      field: 'display_name',
      type: DataTypes.STRING(160),
      allowNull: false
    },
    alias: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    balance: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: '0.00'
    },
    holdBalance: {
      field: 'hold_balance',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: '0.00'
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'closed'),
      allowNull: false,
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    autopayoutEnabled: {
      field: 'autopayout_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    autopayoutThreshold: {
      field: 'autopayout_threshold',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    autopayoutMethodId: {
      field: 'autopayout_method_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    spendingLimit: {
      field: 'spending_limit',
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    lastReconciledAt: {
      field: 'last_reconciled_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.UUID,
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
