import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AffiliateLedgerEntry extends Model {}

AffiliateLedgerEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    affiliateProfileId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    referralId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    commissionRuleId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    transactionId: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    transactionAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    occurrenceIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
      allowNull: false,
      defaultValue: 'pending'
    },
    recognizedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'AffiliateLedgerEntry',
    tableName: 'affiliate_ledger_entries'
  }
);

export default AffiliateLedgerEntry;
