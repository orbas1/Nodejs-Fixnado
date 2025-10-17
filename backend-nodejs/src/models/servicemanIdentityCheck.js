import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanIdentityCheck extends Model {}

ServicemanIdentityCheck.init(
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
    label: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'blocked', 'completed'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    owner: { type: DataTypes.STRING, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    sequelize,
    modelName: 'ServicemanIdentityCheck',
    tableName: 'ServicemanIdentityCheck'
  }
);

export default ServicemanIdentityCheck;
