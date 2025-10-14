import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogTag extends Model {}

BlogTag.init(
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
    }
  },
  {
    sequelize,
    modelName: 'BlogTag',
    tableName: 'blog_tags',
    indexes: [{ fields: ['slug'], unique: true }]
  }
);

export default BlogTag;
