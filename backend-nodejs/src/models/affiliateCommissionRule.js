import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AffiliateCommissionRule extends Model {}

AffiliateCommissionRule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    tierLabel: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    minTransactionValue: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    maxTransactionValue: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    },
    recurrenceType: {
      type: DataTypes.ENUM('one_time', 'finite', 'infinite'),
      allowNull: false,
      defaultValue: 'one_time'
    },
    recurrenceLimit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'AffiliateCommissionRule',
    tableName: 'affiliate_commission_rules'
  }
);

export default AffiliateCommissionRule;
