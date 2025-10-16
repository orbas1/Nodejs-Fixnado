import { randomUUID } from 'node:crypto';

const SIGNALS_TABLE = 'SecuritySignalConfig';
const TASKS_TABLE = 'SecurityAutomationTask';
const CONNECTORS_TABLE = 'TelemetryConnector';

const SIGNAL_KEYS = ['mfa_adoption', 'critical_alerts_open', 'automation_health'];
const TASK_NAMES = ['Roll out hardware security keys', 'Tune SOC alert thresholds'];
const CONNECTOR_NAMES = ['Splunk Observability', 'Azure Sentinel'];

function timestampedRows(rows) {
  const now = new Date();
  return rows.map((row) => ({
    id: row.id ?? randomUUID(),
    created_at: now,
    updated_at: now,
    ...row
  }));
}

export async function up({ context: queryInterface }) {
  const signalRows = timestampedRows([
    {
      metric_key: 'mfa_adoption',
      display_name: 'MFA adoption',
      description: 'Percentage of privileged accounts with MFA enforced.',
      target_success: 97,
      target_warning: 90,
      lower_is_better: false,
      value_source: 'computed',
      owner_role: 'Security engineering',
      icon: 'lock-closed'
    },
    {
      metric_key: 'critical_alerts_open',
      display_name: 'Critical alerts open',
      description: 'Active Sev-1 alerts awaiting response.',
      target_success: 0,
      target_warning: 2,
      lower_is_better: true,
      value_source: 'computed',
      owner_role: 'Security operations',
      icon: 'exclamation-triangle'
    },
    {
      metric_key: 'automation_health',
      display_name: 'Automation health',
      description: 'Coverage for automated response playbooks.',
      target_success: 85,
      target_warning: 70,
      lower_is_better: false,
      value_source: 'manual',
      manual_value: 72,
      manual_value_label: '72% playbooks automated',
      owner_role: 'Automation guild',
      icon: 'bolt'
    }
  ]);

  await queryInterface.bulkInsert(
    SIGNALS_TABLE,
    signalRows.map((row, index) => ({
      ...row,
      sort_order: typeof row.sort_order === 'number' ? row.sort_order : index,
      created_by: null,
      updated_by: null,
      is_active: true
    }))
  );

  const taskRows = timestampedRows([
    {
      name: 'Roll out hardware security keys',
      status: 'in_progress',
      owner: 'Security engineering',
      priority: 'high',
      due_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      runbook_url: 'https://runbooks.fixnado.com/security/hardware-keys',
      signal_key: 'mfa_adoption'
    },
    {
      name: 'Tune SOC alert thresholds',
      status: 'planned',
      owner: 'Security operations',
      priority: 'medium',
      due_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      runbook_url: 'https://runbooks.fixnado.com/security/soc-alerts',
      signal_key: 'critical_alerts_open'
    }
  ]);

  await queryInterface.bulkInsert(
    TASKS_TABLE,
    taskRows.map((row) => ({
      ...row,
      created_by: null,
      updated_by: null,
      is_active: true
    }))
  );

  const connectorRows = timestampedRows([
    {
      name: 'Splunk Observability',
      connector_type: 'siem',
      region: 'eu-west-2',
      status: 'healthy',
      description: 'Primary SIEM bridge for London workloads.',
      dashboard_url: 'https://splunk.fixnado.com',
      ingestion_endpoint: 'kinesis://splunk-eu-west-2',
      events_per_minute_target: 4800,
      events_per_minute_actual: 5025,
      last_health_check_at: new Date(Date.now() - 1000 * 60 * 5),
      logo_url: 'https://cdn.fixnado.com/logos/splunk.svg'
    },
    {
      name: 'Azure Sentinel',
      connector_type: 'siem',
      region: 'ap-southeast-2',
      status: 'warning',
      description: 'Regional SOC escalation feed.',
      dashboard_url: 'https://sentinel.fixnado.com',
      ingestion_endpoint: 'eventhub://sentinel-apac',
      events_per_minute_target: 2200,
      events_per_minute_actual: 1680,
      last_health_check_at: new Date(Date.now() - 1000 * 60 * 30)
    }
  ]);

  await queryInterface.bulkInsert(
    CONNECTORS_TABLE,
    connectorRows.map((row) => ({
      ...row,
      created_by: null,
      updated_by: null,
      is_active: true
    }))
  );
}

export async function down({ context: queryInterface, Sequelize }) {
  const { Op } = Sequelize;
  await queryInterface.bulkDelete(CONNECTORS_TABLE, { name: { [Op.in]: CONNECTOR_NAMES } }, {});
  await queryInterface.bulkDelete(TASKS_TABLE, { name: { [Op.in]: TASK_NAMES } }, {});
  await queryInterface.bulkDelete(SIGNALS_TABLE, { metric_key: { [Op.in]: SIGNAL_KEYS } }, {});
}
