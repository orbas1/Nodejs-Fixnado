import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ToolRentalPricingTier extends Model {}

ToolRentalPricingTier.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    assetId: {
      field: 'asset_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    durationDays: {
      field: 'duration_days',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    depositAmount: {
      field: 'deposit_amount',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    depositCurrency: {
      field: 'deposit_currency',
      type: DataTypes.STRING(3),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ToolRentalPricingTier',
    tableName: 'tool_rental_pricing_tiers',
    indexes: [
      {
        name: 'tool_rental_pricing_tiers_asset_duration',
        fields: ['asset_id', 'duration_days']
      }
    ]
  }
);

export default ToolRentalPricingTier;
