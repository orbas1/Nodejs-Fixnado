import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogCategory extends Model {}

BlogCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'BlogCategory',
    tableName: 'blog_categories',
    indexes: [{ fields: ['slug'], unique: true }]
  }
);

export default BlogCategory;
