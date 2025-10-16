import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('CustomJobReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    filters: {
      type: DataTypes.JSONB || DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    metrics: {
      type: DataTypes.JSONB || DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  await queryInterface.addIndex('CustomJobReport', ['company_id']);
  await queryInterface.addIndex('CustomJobReport', ['created_by']);
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('CustomJobReport', ['created_by']);
  await queryInterface.removeIndex('CustomJobReport', ['company_id']);
  await queryInterface.dropTable('CustomJobReport');
}
