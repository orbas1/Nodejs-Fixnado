import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PlatformSetting extends Model {}

PlatformSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true
    },
    value: {
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
    modelName: 'PlatformSetting'
  }
);

export default PlatformSetting;
