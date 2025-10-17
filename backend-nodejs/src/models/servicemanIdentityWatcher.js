import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanIdentityWatcher extends Model {}

ServicemanIdentityWatcher.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    identityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('operations_lead', 'compliance_specialist', 'safety_manager', 'account_manager', 'other'),
      allowNull: false,
      defaultValue: 'operations_lead'
    },
    notifiedAt: { type: DataTypes.DATE, allowNull: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    sequelize,
    modelName: 'ServicemanIdentityWatcher',
    tableName: 'ServicemanIdentityWatcher'
  }
);

export default ServicemanIdentityWatcher;
