import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class StorefrontRevisionLog extends Model {}

StorefrontRevisionLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    marketplaceItemId: {
      field: 'marketplace_item_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    changeType: {
      field: 'change_type',
      type: DataTypes.STRING(64),
      allowNull: false
    },
    actorId: {
      field: 'actor_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    snapshot: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    regionId: {
      field: 'region_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'StorefrontRevisionLog',
    tableName: 'storefront_revision_logs',
    timestamps: false
  }
);

export default StorefrontRevisionLog;
