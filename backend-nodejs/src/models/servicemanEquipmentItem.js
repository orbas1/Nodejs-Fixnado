import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanEquipmentItem extends Model {}

ServicemanEquipmentItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    profileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'profile_id'
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    serialNumber: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'serial_number'
    },
    status: {
      type: DataTypes.STRING(48),
      allowNull: false,
      defaultValue: 'ready'
    },
    maintenanceDueOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'maintenance_due_on'
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'assigned_at'
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'image_url'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ServicemanEquipmentItem',
    tableName: 'serviceman_equipment_items',
    underscored: true
  }
);

export default ServicemanEquipmentItem;
