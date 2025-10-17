import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterpriseUpgradeChecklistItem extends Model {}

EnterpriseUpgradeChecklistItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    upgradeRequestId: {
      field: 'upgrade_request_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    label: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'blocked', 'complete'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    owner: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    dueDate: {
      field: 'due_date',
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sortOrder: {
      field: 'sort_order',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'EnterpriseUpgradeChecklistItem',
    tableName: 'enterprise_upgrade_checklist_items',
    underscored: true
  }
);

export default EnterpriseUpgradeChecklistItem;
