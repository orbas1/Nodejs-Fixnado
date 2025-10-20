import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const isSqlite = sequelize.getDialect() === 'sqlite';
const tagsDataType = isSqlite ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.STRING);

class InboxTemplate extends Model {}

InboxTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    queueId: {
      field: 'queue_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    locale: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'en-GB'
    },
    subject: {
      type: DataTypes.STRING(180),
      allowNull: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isActive: {
      field: 'is_active',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    tags: {
      type: tagsDataType,
      allowNull: false,
      defaultValue: () => []
    },
    previewImageUrl: {
      field: 'preview_image_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.STRING(120),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'InboxTemplate',
    tableName: 'InboxTemplate'
  }
);

export default InboxTemplate;
