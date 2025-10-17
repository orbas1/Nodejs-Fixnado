import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ToolSaleCoupon extends Model {}

ToolSaleCoupon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    toolSaleProfileId: {
      field: 'tool_sale_profile_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
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
        this.setDataValue('code', String(value).trim().toUpperCase());
      }
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
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(12)
    },
    minOrderTotal: {
      field: 'min_order_total',
      type: DataTypes.DECIMAL(10, 2)
    },
    startsAt: {
      field: 'starts_at',
      type: DataTypes.DATE
    },
    expiresAt: {
      field: 'expires_at',
      type: DataTypes.DATE
    },
    maxRedemptions: {
      field: 'max_redemptions',
      type: DataTypes.INTEGER
    },
    maxRedemptionsPerCustomer: {
      field: 'max_redemptions_per_customer',
      type: DataTypes.INTEGER
    },
    autoApply: {
      field: 'auto_apply',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'expired', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    imageUrl: {
      field: 'image_url',
      type: DataTypes.STRING(512)
    },
    termsUrl: {
      field: 'terms_url',
      type: DataTypes.STRING(512)
    }
  },
  {
    sequelize,
    modelName: 'ToolSaleCoupon',
    tableName: 'ToolSaleCoupon',
    underscored: true
  }
);

export default ToolSaleCoupon;
