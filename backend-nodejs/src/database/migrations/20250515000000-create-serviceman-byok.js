'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('serviceman_byok_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      display_name: {
        type: Sequelize.STRING(160),
        allowNull: false,
        defaultValue: 'Crew BYOK profile'
      },
      default_provider: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'openai'
      },
      default_environment: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'production'
      },
      rotation_policy_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 90
      },
      allow_self_provisioning: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.createTable('serviceman_byok_connectors', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'serviceman_byok_profiles',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      provider: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      display_name: {
        type: Sequelize.STRING(160),
        allowNull: false
      },
      environment: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'production'
      },
      status: {
        type: Sequelize.STRING(24),
        allowNull: false,
        defaultValue: 'active'
      },
      secret_encrypted: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      secret_last_four: {
        type: Sequelize.STRING(8),
        allowNull: false
      },
      scopes: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      rotates_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.createTable('serviceman_byok_audit_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'serviceman_byok_profiles',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      connector_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'serviceman_byok_connectors',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(24),
        allowNull: false,
        defaultValue: 'success'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('serviceman_byok_profiles', ['user_id']);
    await queryInterface.addIndex('serviceman_byok_connectors', ['profile_id']);
    await queryInterface.addIndex('serviceman_byok_connectors', ['provider']);
    await queryInterface.addIndex('serviceman_byok_connectors', ['status']);
    await queryInterface.addIndex('serviceman_byok_audit_events', ['profile_id']);
    await queryInterface.addIndex('serviceman_byok_audit_events', ['connector_id']);
    await queryInterface.addIndex('serviceman_byok_audit_events', ['action']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('serviceman_byok_audit_events');
    await queryInterface.dropTable('serviceman_byok_connectors');
    await queryInterface.dropTable('serviceman_byok_profiles');
  }
};
