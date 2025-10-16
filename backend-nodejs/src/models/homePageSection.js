import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class HomePageSection extends Model {}

HomePageSection.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    homePageId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    handle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    layout: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'full-width'
    },
    backgroundColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    textColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accentColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
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
    modelName: 'HomePageSection',
    tableName: 'home_page_sections',
    indexes: [
      { fields: ['home_page_id', 'position'] },
      { fields: ['home_page_id', 'handle'] }
    ]
  }
);

export default HomePageSection;
