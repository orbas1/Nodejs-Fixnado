import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PurchaseBudget extends Model {}

PurchaseBudget.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fiscalYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },
    allocated: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    spent: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    committed: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GBP'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'PurchaseBudget',
    indexes: [
      {
        unique: true,
        fields: ['category', 'fiscal_year']
      }
    ]
  }
);

export default PurchaseBudget;
