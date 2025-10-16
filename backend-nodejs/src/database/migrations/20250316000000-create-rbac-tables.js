import crypto from 'node:crypto';
import { RBAC_MATRIX } from '../../constants/rbacMatrix.js';

function buildRoleSeedRows(now) {
  return Object.entries(RBAC_MATRIX).map(([key, definition]) => ({
    id: crypto.randomUUID(),
    key,
    name: definition.label,
    description: definition.description ?? null,
    is_system: true,
    status: 'active',
    metadata: {
      navigation: definition.navigation ?? {},
      dataVisibility: definition.dataVisibility ?? {}
    },
    created_at: now,
    updated_at: now
  }));
}

export async function up({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.createTable(
      'rbac_roles',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        key: {
          type: Sequelize.STRING(64),
          allowNull: false,
          unique: true
        },
        name: {
          type: Sequelize.STRING(120),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        status: {
          type: Sequelize.ENUM('active', 'archived'),
          allowNull: false,
          defaultValue: 'active'
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        archived_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      },
      { transaction }
    );

    await queryInterface.addIndex('rbac_roles', ['status'], { transaction });

    await queryInterface.createTable(
      'rbac_role_inheritances',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        role_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'rbac_roles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        parent_role_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'rbac_roles', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        parent_role_key: {
          type: Sequelize.STRING(64),
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      },
      { transaction }
    );

    await queryInterface.addConstraint('rbac_role_inheritances', {
      type: 'unique',
      fields: ['role_id', 'parent_role_key'],
      name: 'rbac_role_inheritances_unique_role_parent',
      transaction
    });

    await queryInterface.createTable(
      'rbac_role_permissions',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        role_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'rbac_roles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        permission: {
          type: Sequelize.STRING(128),
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      },
      { transaction }
    );

    await queryInterface.addConstraint('rbac_role_permissions', {
      type: 'unique',
      fields: ['role_id', 'permission'],
      name: 'rbac_role_permissions_unique_role_permission',
      transaction
    });

    await queryInterface.addIndex('rbac_role_permissions', ['permission'], {
      name: 'rbac_role_permissions_permission_idx',
      transaction
    });

    await queryInterface.createTable(
      'rbac_role_assignments',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4
        },
        role_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'rbac_roles', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'User', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        tenant_id: {
          type: Sequelize.STRING(64),
          allowNull: true
        },
        note: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        revoked_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        assigned_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'User', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      },
      { transaction }
    );

    await queryInterface.addIndex(
      'rbac_role_assignments',
      ['role_id', 'revoked_at'],
      { name: 'rbac_role_assignments_role_active_idx', transaction }
    );
    await queryInterface.addIndex(
      'rbac_role_assignments',
      ['user_id', 'revoked_at'],
      { name: 'rbac_role_assignments_user_active_idx', transaction }
    );

    const now = new Date();
    const roleRows = buildRoleSeedRows(now);
    const roleKeyToId = new Map(roleRows.map((row) => [row.key, row.id]));

    await queryInterface.bulkInsert('rbac_roles', roleRows, { transaction });

    const inheritanceRows = [];
    const permissionRows = [];

    Object.entries(RBAC_MATRIX).forEach(([key, definition]) => {
      const roleId = roleKeyToId.get(key);
      if (!roleId) return;

      (definition.inherits ?? []).forEach((parentKey) => {
        inheritanceRows.push({
          id: crypto.randomUUID(),
          role_id: roleId,
          parent_role_id: roleKeyToId.get(parentKey) ?? null,
          parent_role_key: parentKey,
          created_at: now,
          updated_at: now
        });
      });

      (definition.permissions ?? []).forEach((permission) => {
        permissionRows.push({
          id: crypto.randomUUID(),
          role_id: roleId,
          permission,
          created_at: now,
          updated_at: now
        });
      });
    });

    if (inheritanceRows.length > 0) {
      await queryInterface.bulkInsert('rbac_role_inheritances', inheritanceRows, { transaction });
    }

    if (permissionRows.length > 0) {
      await queryInterface.bulkInsert('rbac_role_permissions', permissionRows, { transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.dropTable('rbac_role_assignments', { transaction });
    await queryInterface.dropTable('rbac_role_permissions', { transaction });
    await queryInterface.dropTable('rbac_role_inheritances', { transaction });
    await queryInterface.dropTable('rbac_roles', { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rbac_roles_status"');
}

