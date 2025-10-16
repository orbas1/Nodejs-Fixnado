'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_configurations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true
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

    await queryInterface.createTable('wallet_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      owner_type: {
        type: Sequelize.STRING(32),
        allowNull: false
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      display_name: {
        type: Sequelize.STRING(160),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(24),
        allowNull: false,
        defaultValue: 'active'
      },
      balance: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0
      },
      hold_balance: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0
      },
      currency: {
        type: Sequelize.STRING(8),
        allowNull: false,
        defaultValue: 'GBP'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      last_reconciled_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.createTable('wallet_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      wallet_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'wallet_accounts',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING(24),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(8),
        allowNull: false
      },
      reference_type: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      occurred_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      running_balance: {
        type: Sequelize.DECIMAL(14, 2),
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

    await queryInterface.addIndex('wallet_accounts', ['owner_id', 'owner_type']);
    await queryInterface.addIndex('wallet_accounts', ['status']);
    await queryInterface.addIndex('wallet_accounts', ['currency']);
    await queryInterface.addIndex('wallet_transactions', ['wallet_account_id']);
    await queryInterface.addIndex('wallet_transactions', ['occurred_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('wallet_transactions');
    await queryInterface.dropTable('wallet_accounts');
    await queryInterface.dropTable('wallet_configurations');
  }
};
