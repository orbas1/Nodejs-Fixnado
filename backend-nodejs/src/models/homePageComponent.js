import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class HomePageComponent extends Model {}

HomePageComponent.init(
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
    sectionId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'text'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subheading: {
      type: DataTypes.STRING,
      allowNull: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    badge: {
      type: DataTypes.STRING,
      allowNull: true
    },
    layout: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'full'
    },
    variant: {
      type: DataTypes.STRING,
      allowNull: true
    },
    backgroundColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    textColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    media: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    config: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    callToActionLabel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    callToActionHref: {
      type: DataTypes.STRING,
      allowNull: true
    },
    secondaryActionLabel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    secondaryActionHref: {
      type: DataTypes.STRING,
      allowNull: true
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
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
    modelName: 'HomePageComponent',
    tableName: 'home_page_components',
    indexes: [
      { fields: ['section_id', 'position'] },
      { fields: ['home_page_id'] }
    ]
  }
);

export default HomePageComponent;
