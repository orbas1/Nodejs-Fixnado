import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Company extends Model {}

Company.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    legalStructure: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contactName: DataTypes.STRING,
    contactEmail: DataTypes.STRING,
    serviceRegions: DataTypes.TEXT,
    marketplaceIntent: DataTypes.TEXT,
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    insuredSellerStatus: {
      field: 'insured_seller_status',
      type: DataTypes.ENUM('not_started', 'pending_documents', 'in_review', 'approved', 'suspended'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    insuredSellerExpiresAt: {
      field: 'insured_seller_expires_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    insuredSellerBadgeVisible: {
      field: 'insured_seller_badge_visible',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    complianceScore: {
      field: 'compliance_score',
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'Company'
  }
);

export default Company;
