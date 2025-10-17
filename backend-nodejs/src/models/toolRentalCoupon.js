import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ToolRentalCoupon extends Model {}

ToolRentalCoupon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    assetId: {
      field: 'asset_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
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
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    maxRedemptions: {
      field: 'max_redemptions',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    perCustomerLimit: {
      field: 'per_customer_limit',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    validFrom: {
      field: 'valid_from',
      type: DataTypes.DATE,
      allowNull: true
    },
    validUntil: {
      field: 'valid_until',
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'expired', 'disabled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ToolRentalCoupon',
    tableName: 'tool_rental_coupons',
    indexes: [
      {
        name: 'tool_rental_coupons_company_code_unique',
        unique: true,
        fields: ['company_id', 'code']
      },
      {
        name: 'tool_rental_coupons_company_status',
        fields: ['company_id', 'status']
      }
    ]
  }
);

export default ToolRentalCoupon;
