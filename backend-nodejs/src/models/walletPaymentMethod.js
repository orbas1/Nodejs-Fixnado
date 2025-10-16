import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WalletPaymentMethod extends Model {}

WalletPaymentMethod.init(
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
    label: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('bank_account', 'card', 'external_wallet'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'rejected'),
      allowNull: false,
      defaultValue: 'active'
    },
    maskedIdentifier: {
      field: 'masked_identifier',
      type: DataTypes.STRING(64),
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    supportingDocumentUrl: {
      field: 'supporting_document_url',
      type: DataTypes.TEXT,
      allowNull: true
    },
    isDefaultPayout: {
      field: 'is_default_payout',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    actorRole: {
      field: 'actor_role',
      type: DataTypes.STRING(32),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WalletPaymentMethod',
    tableName: 'wallet_payment_methods',
    underscored: true
  }
);

export default WalletPaymentMethod;
