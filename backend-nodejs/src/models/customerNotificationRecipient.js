import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CustomerNotificationRecipient extends Model {}

CustomerNotificationRecipient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    accountSettingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'account_setting_id'
    },
    label: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    channel: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    target: {
      type: DataTypes.STRING(320),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'viewer'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'CustomerNotificationRecipient'
  }
);

export default CustomerNotificationRecipient;
