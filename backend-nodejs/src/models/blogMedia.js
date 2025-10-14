import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BlogMedia extends Model {}

BlogMedia.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('image', 'video', 'embed', 'document'),
      allowNull: false,
      defaultValue: 'image'
    },
    altText: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'BlogMedia',
    tableName: 'blog_media'
  }
);

export default BlogMedia;
