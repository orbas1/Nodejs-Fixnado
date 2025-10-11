import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MarketplaceItem extends Model {}

MarketplaceItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    pricePerDay: DataTypes.DECIMAL,
    purchasePrice: DataTypes.DECIMAL,
    location: DataTypes.STRING,
    availability: {
      type: DataTypes.ENUM('rent', 'buy', 'both'),
      defaultValue: 'rent'
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected', 'suspended'),
      allowNull: false,
      defaultValue: 'draft'
    },
    insuredOnly: {
      field: 'insured_only',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    complianceHoldUntil: {
      field: 'compliance_hold_until',
      type: DataTypes.DATE,
      allowNull: true
    },
    lastReviewedAt: {
      field: 'last_reviewed_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    moderationNotes: {
      field: 'moderation_notes',
      type: DataTypes.TEXT,
      allowNull: true
    },
    complianceSnapshot: {
      field: 'compliance_snapshot',
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'MarketplaceItem'
  }
);

export default MarketplaceItem;
