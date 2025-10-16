import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PurchaseAttachment extends Model {}

PurchaseAttachment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    purchaseOrderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('quote', 'invoice', 'packing_slip', 'receiving', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'PurchaseAttachment'
  }
);

export default PurchaseAttachment;
