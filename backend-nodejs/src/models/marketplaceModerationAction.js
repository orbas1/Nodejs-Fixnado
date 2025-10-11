import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MarketplaceModerationAction extends Model {}

MarketplaceModerationAction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityType: {
      field: 'entity_type',
      type: DataTypes.STRING(32),
      allowNull: false
    },
    entityId: {
      field: 'entity_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    actorId: {
      field: 'actor_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
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
    modelName: 'MarketplaceModerationAction',
    tableName: 'MarketplaceModerationAction',
    updatedAt: false
  }
);

export default MarketplaceModerationAction;
