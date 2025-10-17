import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryTag extends Model {}

InventoryTag.init(
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
    name: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'InventoryTag',
    tableName: 'InventoryTag'
  }
);

export default InventoryTag;
