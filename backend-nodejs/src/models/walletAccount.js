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
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    balance: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: '0.00'
    },
    pending: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: '0.00'
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'closed'),
      allowNull: false,
      defaultValue: 'active'
    },
    alias: {
      type: DataTypes.STRING(80),
      allowNull: true
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
    underscored: true
  }
);

export default WalletAccount;
