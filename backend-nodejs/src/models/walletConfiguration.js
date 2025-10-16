import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WalletConfiguration extends Model {}

WalletConfiguration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WalletConfiguration',
    tableName: 'wallet_configurations',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default WalletConfiguration;
