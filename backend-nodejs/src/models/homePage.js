import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class HomePage extends Model {}

HomePage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    theme: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'standard'
    },
    layout: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'modular'
    },
    accentColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    backgroundColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    heroLayout: {
      type: DataTypes.STRING,
      allowNull: true
    },
    seoTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    seoDescription: {
      type: DataTypes.STRING,
      allowNull: true
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'HomePage',
    tableName: 'home_pages',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['status'] },
      { fields: ['published_at'] }
    ]
  }
);

export default HomePage;
