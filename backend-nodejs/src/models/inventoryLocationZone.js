import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryLocationZone extends Model {}

InventoryLocationZone.init(
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
      type: DataTypes.STRING(120),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(32),
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
    modelName: 'InventoryLocationZone',
    tableName: 'InventoryLocationZone'
  }
);

export default InventoryLocationZone;
