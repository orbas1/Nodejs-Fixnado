import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CustomerCoupon extends Model {}

CustomerCoupon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false,
      set(value) {
        if (!value) {
          this.setDataValue('code', null);
          return;
        }
        this.setDataValue('code', `${value}`.trim().toUpperCase());
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage',
      field: 'discount_type'
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'discount_value'
    },
    currency: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    minOrderTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'min_order_total'
    },
    startsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'starts_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    maxRedemptions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_redemptions'
    },
    maxRedemptionsPerCustomer: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_redemptions_per_customer'
    },
    autoApply: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'auto_apply'
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'expired', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    imageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'image_url'
    },
    termsUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'terms_url'
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'internal_notes'
    }
  },
  {
    sequelize,
    modelName: 'CustomerCoupon',
    tableName: 'customer_coupons',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'code']
      }
    ]
  }
);

export default CustomerCoupon;
