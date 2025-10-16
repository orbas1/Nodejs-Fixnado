import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import Button from '../../../ui/Button.jsx';
import TextInput from '../../../ui/TextInput.jsx';
import FormField from '../../../ui/FormField.jsx';

const connectorStatusOptions = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'warning', label: 'Warning' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'offline', label: 'Offline' }
];

const connectorTypeOptions = [
  { value: 'siem', label: 'SIEM / SOC bridge' },
  { value: 'data-lake', label: 'Data lake ingestion' },
  { value: 'observability', label: 'Observability / APM' },
  { value: 'custom', label: 'Custom integration' }
];

function normaliseConnector(connector) {
  if (!connector) {
    return {
      name: '',
      connectorType: 'custom',
      status: 'healthy',
      region: '',
      description: '',
      dashboardUrl: '',
      ingestionEndpoint: '',
      eventsPerMinuteTarget: '',
      eventsPerMinuteActual: '',
      lastHealthCheckAt: '',
      logoUrl: '',
      isActive: true
    };
  }

  return {
    name: connector.name ?? '',
    connectorType: connector.connectorType ?? connector.type ?? 'custom',
    status: connector.status ?? 'healthy',
    region: connector.region ?? '',
    description: connector.description ?? '',
    dashboardUrl: connector.dashboardUrl ?? '',
    ingestionEndpoint: connector.ingestionEndpoint ?? '',
    eventsPerMinuteTarget: connector.eventsPerMinuteTarget ?? '',
    eventsPerMinuteActual: connector.eventsPerMinuteActual ?? '',
    lastHealthCheckAt: connector.lastHealthCheckAt ? connector.lastHealthCheckAt.slice(0, 16) : '',
    logoUrl: connector.logoUrl ?? '',
    isActive: connector.isActive !== false
  };
}

export default function ConnectorModal({ open, onClose, onSubmit, connector, capabilities }) {
  const [form, setForm] = useState(() => normaliseConnector(connector));

  useEffect(() => {
    if (!open) return;
    setForm(normaliseConnector(connector));
  }, [connector, open]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      connectorType: form.connectorType,
      status: form.status,
      region: form.region,
      description: form.description,
      dashboardUrl: form.dashboardUrl,
      ingestionEndpoint: form.ingestionEndpoint,
      eventsPerMinuteTarget: form.eventsPerMinuteTarget === '' ? null : Number(form.eventsPerMinuteTarget),
      eventsPerMinuteActual: form.eventsPerMinuteActual === '' ? null : Number(form.eventsPerMinuteActual),
      lastHealthCheckAt: form.lastHealthCheckAt ? new Date(form.lastHealthCheckAt).toISOString() : null,
      logoUrl: form.logoUrl,
      isActive: Boolean(form.isActive)
    });
  };

  const disableActions = !capabilities?.canManageConnectors;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-primary">
                  {connector?.id ? 'Edit telemetry connector' : 'Register telemetry connector'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-600">
                  Log ingestion bridges and their health metadata so the security dashboard can surface degraded integrations quickly.
                </p>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <FormField label="Connector name" htmlFor="connector-name" required>
                    <TextInput
                      id="connector-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Splunk Observability"
                      required
                      disabled={disableActions}
                    />
                  </FormField>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Connector type" htmlFor="connector-type">
                      <select
                        id="connector-type"
                        name="connectorType"
                        value={form.connectorType}
                        onChange={handleChange}
                        disabled={disableActions}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {connectorTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Status" htmlFor="connector-status">
                      <select
                        id="connector-status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        disabled={disableActions}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {connectorStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Region" htmlFor="connector-region">
                      <TextInput
                        id="connector-region"
                        name="region"
                        value={form.region}
                        onChange={handleChange}
                        placeholder="eu-west-2"
                        disabled={disableActions}
                      />
                    </FormField>
                    <FormField label="Dashboard URL" htmlFor="connector-dashboard">
                      <TextInput
                        id="connector-dashboard"
                        name="dashboardUrl"
                        value={form.dashboardUrl}
                        onChange={handleChange}
                        placeholder="https://splunk.fixnado.com"
                        disabled={disableActions}
                      />
                    </FormField>
                  </div>
                  <FormField label="Description" htmlFor="connector-description">
                    <textarea
                      id="connector-description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      disabled={disableActions}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </FormField>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Ingestion endpoint" htmlFor="connector-endpoint">
                      <TextInput
                        id="connector-endpoint"
                        name="ingestionEndpoint"
                        value={form.ingestionEndpoint}
                        onChange={handleChange}
                        placeholder="kinesis://splunk-eu-west-2"
                        disabled={disableActions}
                      />
                    </FormField>
                    <FormField label="Logo URL" htmlFor="connector-logo">
                      <TextInput
                        id="connector-logo"
                        name="logoUrl"
                        value={form.logoUrl}
                        onChange={handleChange}
                        placeholder="https://cdn.fixnado.com/logos/splunk.svg"
                        disabled={disableActions}
                      />
                    </FormField>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Events per minute target" htmlFor="connector-epm-target">
                      <TextInput
                        id="connector-epm-target"
                        name="eventsPerMinuteTarget"
                        type="number"
                        value={form.eventsPerMinuteTarget}
                        onChange={handleChange}
                        disabled={disableActions}
                      />
                    </FormField>
                    <FormField label="Events per minute actual" htmlFor="connector-epm-actual">
                      <TextInput
                        id="connector-epm-actual"
                        name="eventsPerMinuteActual"
                        type="number"
                        value={form.eventsPerMinuteActual}
                        onChange={handleChange}
                        disabled={disableActions}
                      />
                    </FormField>
                  </div>
                  <FormField label="Last health check" htmlFor="connector-health">
                    <TextInput
                      id="connector-health"
                      name="lastHealthCheckAt"
                      type="datetime-local"
                      value={form.lastHealthCheckAt}
                      onChange={handleChange}
                      disabled={disableActions}
                    />
                  </FormField>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        disabled={disableActions}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                      />
                      Active connector
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" type="button" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={disableActions}>
                      Save connector
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

ConnectorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  connector: PropTypes.object,
  capabilities: PropTypes.shape({
    canManageConnectors: PropTypes.bool
  })
};

ConnectorModal.defaultProps = {
  connector: null,
  capabilities: null
};
