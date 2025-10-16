const SIGNALS_TABLE = 'SecuritySignalConfig';
const SIGNAL_KEY_INDEX = 'security_signal_config_metric_key';
const SIGNAL_ACTIVE_INDEX = 'security_signal_config_active';

const TASKS_TABLE = 'SecurityAutomationTask';
const TASK_STATUS_INDEX = 'security_automation_task_status';
const TASK_DUE_INDEX = 'security_automation_task_due_at';
const TASK_ACTIVE_INDEX = 'security_automation_task_active';
const TASK_SIGNAL_FK = 'security_automation_task_signal_key_fk';

const CONNECTORS_TABLE = 'TelemetryConnector';
const CONNECTOR_STATUS_INDEX = 'telemetry_connector_status';
const CONNECTOR_REGION_INDEX = 'telemetry_connector_region';
const CONNECTOR_TYPE_INDEX = 'telemetry_connector_type';
const CONNECTOR_ACTIVE_INDEX = 'telemetry_connector_active';

const SIGNAL_VALUE_SOURCE_ENUM = 'enum_SecuritySignalConfig_value_source';
const TASK_STATUS_ENUM = 'enum_SecurityAutomationTask_status';
const TASK_PRIORITY_ENUM = 'enum_SecurityAutomationTask_priority';
const CONNECTOR_STATUS_ENUM = 'enum_TelemetryConnector_status';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable(SIGNALS_TABLE, {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    metric_key: {
      type: Sequelize.STRING(64),
      allowNull: false,
      unique: true
    },
    display_name: {
      type: Sequelize.STRING(128),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    unit: {
      type: Sequelize.STRING(24),
      allowNull: true
    },
    value_source: {
      type: Sequelize.ENUM('computed', 'manual'),
      allowNull: false,
      defaultValue: 'computed'
    },
    target_success: {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: true
    },
    target_warning: {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: true
    },
    lower_is_better: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    runbook_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    owner_role: {
      type: Sequelize.STRING(96),
      allowNull: true
    },
    icon: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    manual_value: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    manual_value_label: {
      type: Sequelize.STRING(128),
      allowNull: true
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex(SIGNALS_TABLE, ['metric_key'], { name: SIGNAL_KEY_INDEX, unique: true });
  await queryInterface.addIndex(SIGNALS_TABLE, ['is_active'], { name: SIGNAL_ACTIVE_INDEX });

  await queryInterface.createTable(TASKS_TABLE, {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('planned', 'in_progress', 'blocked', 'completed'),
      allowNull: false,
      defaultValue: 'planned'
    },
    owner: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    priority: {
      type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    due_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    runbook_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    signal_key: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex(TASKS_TABLE, ['status'], { name: TASK_STATUS_INDEX });
  await queryInterface.addIndex(TASKS_TABLE, ['due_at'], { name: TASK_DUE_INDEX });
  await queryInterface.addIndex(TASKS_TABLE, ['is_active'], { name: TASK_ACTIVE_INDEX });
  await queryInterface.addConstraint(TASKS_TABLE, {
    fields: ['signal_key'],
    type: 'foreign key',
    name: TASK_SIGNAL_FK,
    references: {
      table: SIGNALS_TABLE,
      field: 'metric_key'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  await queryInterface.createTable(CONNECTORS_TABLE, {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    connector_type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    region: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('healthy', 'warning', 'degraded', 'offline'),
      allowNull: false,
      defaultValue: 'healthy'
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    dashboard_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    ingestion_endpoint: {
      type: Sequelize.STRING(256),
      allowNull: true
    },
    events_per_minute_target: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    events_per_minute_actual: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    last_health_check_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    logo_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex(CONNECTORS_TABLE, ['status'], { name: CONNECTOR_STATUS_INDEX });
  await queryInterface.addIndex(CONNECTORS_TABLE, ['region'], { name: CONNECTOR_REGION_INDEX });
  await queryInterface.addIndex(CONNECTORS_TABLE, ['connector_type'], { name: CONNECTOR_TYPE_INDEX });
  await queryInterface.addIndex(CONNECTORS_TABLE, ['is_active'], { name: CONNECTOR_ACTIVE_INDEX });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex(CONNECTORS_TABLE, CONNECTOR_ACTIVE_INDEX);
  await queryInterface.removeIndex(CONNECTORS_TABLE, CONNECTOR_TYPE_INDEX);
  await queryInterface.removeIndex(CONNECTORS_TABLE, CONNECTOR_REGION_INDEX);
  await queryInterface.removeIndex(CONNECTORS_TABLE, CONNECTOR_STATUS_INDEX);
  await queryInterface.dropTable(CONNECTORS_TABLE);

  await queryInterface.removeConstraint(TASKS_TABLE, TASK_SIGNAL_FK);
  await queryInterface.removeIndex(TASKS_TABLE, TASK_DUE_INDEX);
  await queryInterface.removeIndex(TASKS_TABLE, TASK_STATUS_INDEX);
  await queryInterface.removeIndex(TASKS_TABLE, TASK_ACTIVE_INDEX);
  await queryInterface.dropTable(TASKS_TABLE);

  await queryInterface.removeIndex(SIGNALS_TABLE, SIGNAL_ACTIVE_INDEX);
  await queryInterface.removeIndex(SIGNALS_TABLE, SIGNAL_KEY_INDEX);
  await queryInterface.dropTable(SIGNALS_TABLE);

  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${CONNECTOR_STATUS_ENUM}";`);
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${TASK_PRIORITY_ENUM}";`);
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${TASK_STATUS_ENUM}";`);
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${SIGNAL_VALUE_SOURCE_ENUM}";`);
}
