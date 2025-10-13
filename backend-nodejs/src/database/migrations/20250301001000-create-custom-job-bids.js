export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('CustomJobBid', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    post_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Post',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    provider_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Company',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    currency: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'GBP'
    },
    status: {
      type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'withdrawn'),
      allowNull: false,
      defaultValue: 'pending'
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.createTable('CustomJobBidMessage', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    bid_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'CustomJobBid',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    author_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    author_role: {
      type: Sequelize.ENUM('customer', 'provider', 'admin'),
      allowNull: false
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    attachments: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('CustomJobBid', ['post_id']);
  await queryInterface.addIndex('CustomJobBid', ['provider_id']);
  await queryInterface.addIndex('CustomJobBidMessage', ['bid_id']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('CustomJobBidMessage', ['bid_id']);
  await queryInterface.removeIndex('CustomJobBid', ['provider_id']);
  await queryInterface.removeIndex('CustomJobBid', ['post_id']);
  await queryInterface.dropTable('CustomJobBidMessage');
  await queryInterface.dropTable('CustomJobBid');
}
