import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BookingTemplate extends Model {}

BookingTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'retired'),
      allowNull: false,
      defaultValue: 'draft'
    },
    defaultType: {
      type: DataTypes.ENUM('on_demand', 'scheduled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    defaultDemandLevel: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'medium'
    },
    defaultBaseAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    defaultCurrency: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: 'GBP'
    },
    defaultDurationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    checklist: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    heroImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    media: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    createdBy: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.STRING(160),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'BookingTemplate',
    indexes: [
      { fields: ['slug'] },
      { fields: ['status'] }
    ]
  }
);

export default BookingTemplate;
