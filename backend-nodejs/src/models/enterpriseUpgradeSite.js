import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterpriseUpgradeSite extends Model {}

EnterpriseUpgradeSite.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    upgradeRequestId: {
      field: 'upgrade_request_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    siteName: {
      field: 'site_name',
      type: DataTypes.STRING(160),
      allowNull: false
    },
    region: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    headcount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    goLiveDate: {
      field: 'go_live_date',
      type: DataTypes.DATE,
      allowNull: true
    },
    imageUrl: {
      field: 'image_url',
      type: DataTypes.STRING(512),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'EnterpriseUpgradeSite',
    tableName: 'enterprise_upgrade_sites',
    underscored: true
  }
);

export default EnterpriseUpgradeSite;
