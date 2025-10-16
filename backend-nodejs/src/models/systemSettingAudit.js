import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SystemSettingAudit extends Model {}

SystemSettingAudit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    section: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('success', 'warning', 'error'),
      allowNull: false,
      defaultValue: 'success'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    performedBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'SystemSettingAudit',
    tableName: 'SystemSettingAudit',
    underscored: true
  }
);

export default SystemSettingAudit;
