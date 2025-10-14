export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('AdCampaign', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Company', key: 'id' },
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    objective: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    campaign_type: {
      type: Sequelize.ENUM('ppc', 'ppc_conversion', 'ppi', 'awareness'),
      allowNull: false,
      defaultValue: 'ppc'
    },
    status: {
      type: Sequelize.ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    pacing_strategy: {
      type: Sequelize.ENUM('even', 'asap', 'lifetime'),
      allowNull: false,
      defaultValue: 'even'
    },
    bid_strategy: {
      type: Sequelize.ENUM('cpc', 'cpm', 'cpa'),
      allowNull: false,
      defaultValue: 'cpc'
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    total_budget: {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false
    },
    daily_spend_cap: {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true
    },
    start_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    end_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    timezone: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'Europe/London'
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
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
  });

  await queryInterface.addIndex('AdCampaign', ['company_id', 'status'], {
    name: 'ad_campaign_company_status'
  });
  await queryInterface.addIndex('AdCampaign', ['status', 'start_at'], {
    name: 'ad_campaign_status_start'
  });

  await queryInterface.createTable('CampaignFlight', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    campaign_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'AdCampaign', key: 'id' },
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    start_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    end_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    budget: {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false
    },
    daily_spend_cap: {
      type: Sequelize.DECIMAL(18, 2),
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
  });

  await queryInterface.addIndex('CampaignFlight', ['campaign_id', 'status'], {
    name: 'campaign_flight_campaign_status'
  });
  await queryInterface.addIndex('CampaignFlight', ['start_at', 'end_at'], {
    name: 'campaign_flight_window'
  });

  await queryInterface.createTable('CampaignTargetingRule', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    campaign_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'AdCampaign', key: 'id' },
      onDelete: 'CASCADE'
    },
    rule_type: {
      type: Sequelize.ENUM('zone', 'category', 'language', 'device', 'audience', 'schedule', 'insured_only', 'keyword'),
      allowNull: false
    },
    operator: {
      type: Sequelize.ENUM('include', 'exclude'),
      allowNull: false,
      defaultValue: 'include'
    },
    payload: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
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
  });

  await queryInterface.addIndex('CampaignTargetingRule', ['campaign_id', 'rule_type'], {
    name: 'campaign_targeting_rule_type'
  });

  await queryInterface.createTable('CampaignInvoice', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    campaign_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'AdCampaign', key: 'id' },
      onDelete: 'CASCADE'
    },
    flight_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'CampaignFlight', key: 'id' },
      onDelete: 'SET NULL'
    },
    invoice_number: {
      type: Sequelize.STRING(64),
      allowNull: false,
      unique: true
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    amount_due: {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false
    },
    amount_paid: {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0
    },
    period_start: {
      type: Sequelize.DATE,
      allowNull: false
    },
    period_end: {
      type: Sequelize.DATE,
      allowNull: false
    },
    due_date: {
      type: Sequelize.DATE,
      allowNull: false
    },
    issued_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    paid_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('draft', 'issued', 'paid', 'overdue', 'void'),
      allowNull: false,
      defaultValue: 'issued'
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
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
  });

  await queryInterface.addIndex('CampaignInvoice', ['campaign_id', 'status'], {
    name: 'campaign_invoice_status'
  });
  await queryInterface.addIndex('CampaignInvoice', ['due_date'], {
    name: 'campaign_invoice_due_date'
  });

  await queryInterface.createTable('CampaignDailyMetric', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    campaign_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'AdCampaign', key: 'id' },
      onDelete: 'CASCADE'
    },
    flight_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'CampaignFlight', key: 'id' },
      onDelete: 'SET NULL'
    },
    metric_date: {
      type: Sequelize.DATE,
      allowNull: false
    },
    impressions: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    clicks: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    conversions: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    spend: {
      type: Sequelize.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0
    },
    revenue: {
      type: Sequelize.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0
    },
    spend_target: {
      type: Sequelize.DECIMAL(18, 4),
      allowNull: true
    },
    ctr: {
      type: Sequelize.DECIMAL(9, 6),
      allowNull: true
    },
    cvr: {
      type: Sequelize.DECIMAL(9, 6),
      allowNull: true
    },
    anomaly_score: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true
    },
    exported_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
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
  });

  await queryInterface.addIndex('CampaignDailyMetric', ['campaign_id', 'metric_date'], {
    name: 'campaign_daily_metric_campaign_date'
  });
  await queryInterface.addIndex('CampaignDailyMetric', ['flight_id', 'metric_date'], {
    name: 'campaign_daily_metric_flight_date'
  });
  await queryInterface.addConstraint('CampaignDailyMetric', {
    fields: ['campaign_id', 'flight_id', 'metric_date'],
    type: 'unique',
    name: 'campaign_daily_metric_unique_day'
  });

  await queryInterface.createTable('CampaignFraudSignal', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    campaign_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'AdCampaign', key: 'id' },
      onDelete: 'CASCADE'
    },
    flight_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'CampaignFlight', key: 'id' },
      onDelete: 'SET NULL'
    },
    metric_date: {
      type: Sequelize.DATE,
      allowNull: true
    },
    signal_type: {
      type: Sequelize.ENUM(
        'overspend',
        'underspend',
        'suspicious_ctr',
        'suspicious_cvr',
        'no_spend',
        'delivery_gap'
      ),
      allowNull: false
    },
    severity: {
      type: Sequelize.ENUM('info', 'warning', 'critical'),
      allowNull: false,
      defaultValue: 'warning'
    },
    detected_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    resolved_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    resolution_note: {
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
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('CampaignFraudSignal', ['campaign_id', 'signal_type', 'severity'], {
    name: 'campaign_fraud_signal_lookup'
  });

  await queryInterface.createTable('CampaignAnalyticsExport', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    campaign_daily_metric_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'CampaignDailyMetric', key: 'id' },
      onDelete: 'CASCADE'
    },
    status: {
      type: Sequelize.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    payload: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    },
    last_error: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    last_attempt_at: {
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
  });

  await queryInterface.addIndex('CampaignAnalyticsExport', ['status'], {
    name: 'campaign_analytics_export_status'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('CampaignAnalyticsExport');
  await queryInterface.dropTable('CampaignFraudSignal');
  await queryInterface.dropTable('CampaignDailyMetric');
  await queryInterface.dropTable('CampaignInvoice');
  await queryInterface.dropTable('CampaignTargetingRule');
  await queryInterface.dropTable('CampaignFlight');
  await queryInterface.dropTable('AdCampaign');

  if (queryInterface.sequelize.getDialect() === 'postgres') {
    const enumNames = [
      'enum_AdCampaign_campaign_type',
      'enum_AdCampaign_status',
      'enum_AdCampaign_pacing_strategy',
      'enum_AdCampaign_bid_strategy',
      'enum_CampaignFlight_status',
      'enum_CampaignTargetingRule_rule_type',
      'enum_CampaignTargetingRule_operator',
      'enum_CampaignInvoice_status',
      'enum_CampaignFraudSignal_signal_type',
      'enum_CampaignFraudSignal_severity',
      'enum_CampaignAnalyticsExport_status'
    ];

    await Promise.all(
      enumNames.map((enumName) =>
        queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`)
      )
    );
  }
}
