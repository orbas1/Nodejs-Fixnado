import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServiceMediaAsset extends Model {}

ServiceMediaAsset.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'service_id',
      references: {
        model: 'Service',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video', 'document', 'showcase'),
      allowNull: false,
      defaultValue: 'image',
      field: 'media_type'
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    altText: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: 'alt_text'
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'thumbnail_url'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServiceMediaAsset',
    tableName: 'ServiceMediaAsset',
    indexes: [
      {
        fields: ['service_id', 'media_type']
      },
      {
        fields: ['service_id', 'sort_order']
      }
    ]
  }
);

export default ServiceMediaAsset;
