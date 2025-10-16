import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CommandMetricSetting extends Model {}

CommandMetricSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    scope: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'command_metric_settings',
    modelName: 'CommandMetricSetting',
    underscored: true,
    timestamps: true
  }
);

export default CommandMetricSetting;
