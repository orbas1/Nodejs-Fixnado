import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CommandMetricCard extends Model {}

CommandMetricCard.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    tone: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'info'
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    mediaUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mediaAlt: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    cta: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    createdBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'command_metric_cards',
    modelName: 'CommandMetricCard',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['is_active', 'display_order', 'created_at']
      }
    ]
  }
);

export default CommandMetricCard;
