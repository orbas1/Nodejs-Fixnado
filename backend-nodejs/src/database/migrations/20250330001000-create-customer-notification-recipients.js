const TABLE = 'CustomerNotificationRecipient';
const CHANNELS = ['email', 'sms', 'whatsapp', 'push'];

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.createTable(TABLE, {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      account_setting_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'CustomerAccountSetting', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      label: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      channel: {
        type: Sequelize.STRING(32),
        allowNull: false
      },
      target: {
        type: Sequelize.STRING(320),
        allowNull: false
      },
      normalized_target: {
        type: Sequelize.STRING(320),
        allowNull: false
      },
      target_hash: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      role: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'viewer'
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      consent_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      retention_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING(120),
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
    }, { transaction });

    await queryInterface.addIndex(TABLE, ['account_setting_id', 'channel', 'target_hash'], {
      unique: true,
      name: 'customer_notification_target_unique',
      transaction
    });

    await queryInterface.addIndex(TABLE, ['target_hash'], {
      name: 'customer_notification_target_hash_idx',
      transaction
    });

    await queryInterface.addIndex(TABLE, ['account_setting_id'], { transaction });
    await queryInterface.addIndex(TABLE, ['enabled'], { transaction });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      const channelList = CHANNELS.map((channel) => `'${channel}'`).join(',');
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE}" ADD CONSTRAINT customer_notification_channel_valid
          CHECK (lower(channel) IN (${channelList}))`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE}" ADD CONSTRAINT customer_notification_hash_length
          CHECK (char_length(target_hash) = 64)`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE}" ADD CONSTRAINT customer_notification_normalised_present
          CHECK (char_length(normalized_target) > 0)`,
        { transaction }
      );
    }
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(
        'ALTER TABLE "CustomerNotificationRecipient" DROP CONSTRAINT IF EXISTS customer_notification_channel_valid',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "CustomerNotificationRecipient" DROP CONSTRAINT IF EXISTS customer_notification_hash_length',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "CustomerNotificationRecipient" DROP CONSTRAINT IF EXISTS customer_notification_normalised_present',
        { transaction }
      );
    }

    await queryInterface.removeIndex(TABLE, 'customer_notification_target_unique', { transaction });
    await queryInterface.removeIndex(TABLE, 'customer_notification_target_hash_idx', { transaction });
    await queryInterface.removeIndex(TABLE, ['account_setting_id'], { transaction });
    await queryInterface.removeIndex(TABLE, ['enabled'], { transaction });

    await queryInterface.dropTable(TABLE, { transaction });
  });
}
