import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterpriseUpgradeContact extends Model {}

EnterpriseUpgradeContact.init(
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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    influenceLevel: {
      field: 'influence_level',
      type: DataTypes.STRING(60),
      allowNull: true
    },
    primaryContact: {
      field: 'primary_contact',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'EnterpriseUpgradeContact',
    tableName: 'enterprise_upgrade_contacts',
    underscored: true
  }
);

export default EnterpriseUpgradeContact;
