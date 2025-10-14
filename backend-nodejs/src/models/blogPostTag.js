import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogPostTag extends Model {}

BlogPostTag.init(
  {
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    tagId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    }
  },
  {
    sequelize,
    modelName: 'BlogPostTag',
    tableName: 'blog_post_tags',
    timestamps: false
  }
);

export default BlogPostTag;
