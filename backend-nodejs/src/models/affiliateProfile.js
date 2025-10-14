import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AffiliateProfile extends Model {}

AffiliateProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    referralCode: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'pending'),
      allowNull: false,
      defaultValue: 'active'
    },
    totalReferred: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalCommissionEarned: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    pendingCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    lifetimeRevenue: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    tierLabel: {
      type: DataTypes.STRING(80),
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
    modelName: 'AffiliateProfile',
    tableName: 'affiliate_profiles'
  }
);

export default AffiliateProfile;
