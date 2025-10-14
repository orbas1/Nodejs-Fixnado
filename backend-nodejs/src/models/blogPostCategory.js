import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogPostCategory extends Model {}

BlogPostCategory.init(
  {
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    }
  },
  {
    sequelize,
    modelName: 'BlogPostCategory',
    tableName: 'blog_post_categories',
    timestamps: false
  }
);

export default BlogPostCategory;
