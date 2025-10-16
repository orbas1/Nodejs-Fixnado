export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('affiliate_profiles', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    referral_code: {
      type: Sequelize.STRING(32),
      allowNull: false,
      unique: true
    },
    status: {
      type: Sequelize.ENUM('active', 'suspended', 'pending'),
      allowNull: false,
      defaultValue: 'active'
    },
    total_referred: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_commission_earned: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    pending_commission: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    lifetime_revenue: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    tier_label: {
      type: Sequelize.STRING(80),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addIndex('affiliate_profiles', ['status'], {
    name: 'affiliate_profiles_status_idx'
  });
  await queryInterface.addIndex('affiliate_profiles', ['tier_label'], {
    name: 'affiliate_profiles_tier_idx'
  });

  await queryInterface.createTable('affiliate_commission_rules', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    tier_label: {
      type: Sequelize.STRING(80),
      allowNull: false
    },
    commission_rate: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false
    },
    min_transaction_value: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    max_transaction_value: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true
    },
    recurrence_type: {
      type: Sequelize.ENUM('one_time', 'finite', 'infinite'),
      allowNull: false,
      defaultValue: 'one_time'
    },
    recurrence_limit: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    priority: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addIndex('affiliate_commission_rules', ['is_active', 'priority'], {
    name: 'affiliate_commission_rules_active_priority_idx'
  });
  await queryInterface.addIndex('affiliate_commission_rules', ['tier_label'], {
    name: 'affiliate_commission_rules_tier_idx'
  });

  await queryInterface.createTable('affiliate_referrals', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    affiliate_profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'affiliate_profiles', key: 'id' },
      onDelete: 'CASCADE'
    },
    referred_user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'SET NULL'
    },
    referral_code_used: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'converted', 'blocked'),
      allowNull: false,
      defaultValue: 'pending'
    },
    conversions_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_revenue: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_commission_earned: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    last_conversion_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addIndex('affiliate_referrals', ['affiliate_profile_id'], {
    name: 'affiliate_referrals_profile_idx'
  });
  await queryInterface.addIndex('affiliate_referrals', ['status'], {
    name: 'affiliate_referrals_status_idx'
  });

  await queryInterface.createTable('affiliate_ledger_entries', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    affiliate_profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'affiliate_profiles', key: 'id' },
      onDelete: 'CASCADE'
    },
    referral_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'affiliate_referrals', key: 'id' },
      onDelete: 'SET NULL'
    },
    commission_rule_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'affiliate_commission_rules', key: 'id' },
      onDelete: 'SET NULL'
    },
    transaction_id: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    transaction_amount: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false
    },
    commission_amount: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    occurrence_index: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'paid'),
      allowNull: false,
      defaultValue: 'pending'
    },
    recognized_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addIndex('affiliate_ledger_entries', ['affiliate_profile_id'], {
    name: 'affiliate_ledger_entries_profile_idx'
  });
  await queryInterface.addIndex('affiliate_ledger_entries', ['status'], {
    name: 'affiliate_ledger_entries_status_idx'
  });
  await queryInterface.addConstraint('affiliate_ledger_entries', {
    fields: ['affiliate_profile_id', 'transaction_id', 'occurrence_index'],
    type: 'unique',
    name: 'affiliate_ledger_entries_transaction_unique'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeConstraint('affiliate_ledger_entries', 'affiliate_ledger_entries_transaction_unique');
  await queryInterface.dropTable('affiliate_ledger_entries');
  await queryInterface.dropTable('affiliate_referrals');
  await queryInterface.dropTable('affiliate_commission_rules');
  await queryInterface.dropTable('affiliate_profiles');

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_affiliate_ledger_entries_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_affiliate_commission_rules_recurrence_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_affiliate_profiles_status";');
  }
}
