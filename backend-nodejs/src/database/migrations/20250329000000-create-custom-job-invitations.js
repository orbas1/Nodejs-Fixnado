import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('CustomJobInvitation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Post', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    target_type: {
      type: DataTypes.ENUM('provider', 'serviceman', 'user'),
      allowNull: false
    },
    target_handle: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    target_email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB || DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
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

  await queryInterface.addIndex('CustomJobInvitation', ['post_id']);
  await queryInterface.addIndex('CustomJobInvitation', ['company_id']);
  await queryInterface.addIndex('CustomJobInvitation', ['status']);
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('CustomJobInvitation', ['status']);
  await queryInterface.removeIndex('CustomJobInvitation', ['company_id']);
  await queryInterface.removeIndex('CustomJobInvitation', ['post_id']);
  await queryInterface.dropTable('CustomJobInvitation');
}
