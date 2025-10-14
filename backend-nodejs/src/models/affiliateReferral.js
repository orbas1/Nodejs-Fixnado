import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AffiliateReferral extends Model {}

AffiliateReferral.init(
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
    referredUserId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    referralCodeUsed: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'converted', 'blocked'),
      allowNull: false,
      defaultValue: 'pending'
    },
    conversionsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    totalCommissionEarned: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    lastConversionAt: {
      type: DataTypes.DATE,
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
    modelName: 'AffiliateReferral',
    tableName: 'affiliate_referrals'
  }
);

export default AffiliateReferral;
