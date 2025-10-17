import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderServicemanMedia extends Model {}

ProviderServicemanMedia.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      field: 'serviceman_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    label: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'gallery'
    },
    isPrimary: {
      field: 'is_primary',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    sortOrder: {
      field: 'sort_order',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ProviderServicemanMedia',
    tableName: 'ProviderServicemanMedia',
    underscored: true
  }
);

export default ProviderServicemanMedia;
