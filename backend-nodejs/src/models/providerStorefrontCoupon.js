import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderStorefrontCoupon extends Model {}

ProviderStorefrontCoupon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    storefrontId: {
      field: 'storefront_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    discountType: {
      field: 'discount_type',
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage'
    },
    discountValue: {
      field: 'discount_value',
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0
    },
    minOrderTotal: {
      field: 'min_order_total',
      type: DataTypes.DECIMAL(12, 2)
    },
    maxDiscountValue: {
      field: 'max_discount_value',
      type: DataTypes.DECIMAL(12, 2)
    },
    startsAt: {
      field: 'starts_at',
      type: DataTypes.DATE
    },
    endsAt: {
      field: 'ends_at',
      type: DataTypes.DATE
    },
    usageLimit: {
      field: 'usage_limit',
      type: DataTypes.INTEGER
    },
    usageCount: {
      field: 'usage_count',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'expired', 'disabled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    appliesTo: {
      field: 'applies_to',
      type: DataTypes.STRING(160)
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderStorefrontCoupon',
    tableName: 'provider_storefront_coupons',
    indexes: [
      {
        unique: true,
        fields: ['storefront_id', 'code']
      },
      {
        fields: ['status']
      }
    ]
  }
);

export default ProviderStorefrontCoupon;
