import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Supplier extends Model {}

Supplier.init(
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
    contactName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    addressLine1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    addressLine2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postcode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    leadTimeDays: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    paymentTermsDays: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'on_hold', 'inactive'),
      defaultValue: 'active'
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Supplier'
  }
);

export default Supplier;
