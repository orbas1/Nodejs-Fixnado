import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: DataTypes.STRING,
    age: DataTypes.INTEGER,
    type: {
      type: DataTypes.ENUM('user', 'company', 'servicemen'),
      allowNull: false,
      defaultValue: 'user'
    },
    twoFactorEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    twoFactorApp: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'User'
  }
);

export default User;
