import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import Button from '../../../ui/Button.jsx';
import TextInput from '../../../ui/TextInput.jsx';
import FormField from '../../../ui/FormField.jsx';
import Checkbox from '../../../ui/Checkbox.jsx';

const signalSourceOptions = [
  { value: 'computed', label: 'Computed from platform data' },
  { value: 'manual', label: 'Manual entry' }
];

function normaliseSignal(signal) {
  if (!signal) {
    return {
      label: '',
      metricKey: '',
      ownerRole: '',
      runbookUrl: '',
      targetSuccess: '',
      targetWarning: '',
      lowerIsBetter: false,
      valueSource: 'computed',
      manualValue: '',
      manualValueLabel: '',
      unit: '',
      sortOrder: 0,
      isActive: true
    };
  }

  return {
    label: signal.label ?? '',
    metricKey: signal.metricKey ?? '',
    ownerRole: signal.ownerRole ?? '',
    runbookUrl: signal.runbookUrl ?? '',
    targetSuccess: signal.targetSuccess ?? '',
    targetWarning: signal.targetWarning ?? '',
    lowerIsBetter: Boolean(signal.lowerIsBetter),
    valueSource: signal.valueSource ?? 'computed',
    manualValue: signal.manualValue ?? '',
    manualValueLabel: signal.manualValueLabel ?? '',
    unit: signal.unit ?? '',
    sortOrder: signal.sortOrder ?? 0,
    isActive: signal.isActive !== false
  };
}

export default function SignalModal({ open, onClose, onSubmit, signal, capabilities }) {
  const [form, setForm] = useState(() => normaliseSignal(signal));

  useEffect(() => {
    if (!open) return;
    setForm(normaliseSignal(signal));
  }, [signal, open]);

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
      displayName: form.label,
      metricKey: form.metricKey,
      ownerRole: form.ownerRole,
      runbookUrl: form.runbookUrl,
      targetSuccess: form.targetSuccess === '' ? null : Number(form.targetSuccess),
      targetWarning: form.targetWarning === '' ? null : Number(form.targetWarning),
      lowerIsBetter: Boolean(form.lowerIsBetter),
      valueSource: form.valueSource,
      manualValue:
        form.valueSource === 'manual' && form.manualValue !== '' ? Number(form.manualValue) : undefined,
      manualValueLabel: form.valueSource === 'manual' ? form.manualValueLabel : undefined,
      unit: form.unit,
      sortOrder: Number.isNaN(Number.parseInt(form.sortOrder, 10)) ? 0 : Number.parseInt(form.sortOrder, 10),
      isActive: Boolean(form.isActive)
    });
  };

  const disableActions = !capabilities?.canManageSignals;

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
                  {signal?.id ? 'Edit security signal' : 'Create security signal'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-600">
                  Align telemetry guardrails with live metrics. Provide a descriptive name and thresholds so the dashboard can flag risk windows automatically.
                </p>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <FormField label="Signal name" htmlFor="signal-label" helper="Shown on the dashboard" required>
                    <TextInput
                      id="signal-label"
                      name="label"
                      value={form.label}
                      onChange={handleChange}
                      placeholder="e.g. MFA adoption"
                      required
                      disabled={disableActions}
                    />
                  </FormField>
                  <FormField label="Metric key" htmlFor="signal-metric" helper="Used for API integrations" required>
                    <TextInput
                      id="signal-metric"
                      name="metricKey"
                      value={form.metricKey}
                      onChange={handleChange}
                      placeholder="e.g. mfa_adoption"
                      required
                      disabled={signal?.metricKey && disableActions}
                    />
                  </FormField>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Owner" htmlFor="signal-owner" helper="Team accountable for this signal">
                      <TextInput
                        id="signal-owner"
                        name="ownerRole"
                        value={form.ownerRole}
                        onChange={handleChange}
                        placeholder="Security operations"
                        disabled={disableActions}
                      />
                    </FormField>
                    <FormField label="Runbook URL" htmlFor="signal-runbook" helper="Optional escalation playbook">
                      <TextInput
                        id="signal-runbook"
                        name="runbookUrl"
                        value={form.runbookUrl}
                        onChange={handleChange}
                        placeholder="https://runbooks.fixnado.com/security"
                        disabled={disableActions}
                      />
                    </FormField>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Success threshold" htmlFor="signal-target-success" helper="Value where the signal is healthy">
                      <TextInput
                        id="signal-target-success"
                        name="targetSuccess"
                        type="number"
                        step="0.1"
                        value={form.targetSuccess}
                        onChange={handleChange}
                        placeholder="95"
                        disabled={disableActions}
                      />
                    </FormField>
                    <FormField label="Warning threshold" htmlFor="signal-target-warning" helper="Value where attention is required">
                      <TextInput
                        id="signal-target-warning"
                        name="targetWarning"
                        type="number"
                        step="0.1"
                        value={form.targetWarning}
                        onChange={handleChange}
                        placeholder="85"
                        disabled={disableActions}
                      />
                    </FormField>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Data source" helper="Where the value is derived from">
                      <select
                        name="valueSource"
                        value={form.valueSource}
                        onChange={handleChange}
                        disabled={disableActions}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {signalSourceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Unit" htmlFor="signal-unit" helper="Shown alongside the value">
                      <TextInput
                        id="signal-unit"
                        name="unit"
                        value={form.unit}
                        onChange={handleChange}
                        placeholder="percent"
                        disabled={disableActions}
                      />
                    </FormField>
                  </div>
                  {form.valueSource === 'manual' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Manual value" htmlFor="signal-manual-value">
                        <TextInput
                          id="signal-manual-value"
                          name="manualValue"
                          type="number"
                          step="0.1"
                          value={form.manualValue}
                          onChange={handleChange}
                          placeholder="e.g. 87.5"
                          disabled={disableActions}
                        />
                      </FormField>
                      <FormField label="Manual label" htmlFor="signal-manual-label" helper="Optional formatted label">
                        <TextInput
                          id="signal-manual-label"
                          name="manualValueLabel"
                          value={form.manualValueLabel}
                          onChange={handleChange}
                          placeholder="87.5%"
                          disabled={disableActions}
                        />
                      </FormField>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Checkbox
                      id="signal-lower-is-better"
                      name="lowerIsBetter"
                      checked={form.lowerIsBetter}
                      onChange={handleChange}
                      disabled={disableActions}
                    >
                      Lower values are better
                    </Checkbox>
                    <FormField label="Sort order" htmlFor="signal-sort-order" helper="Lower numbers appear first">
                      <TextInput
                        id="signal-sort-order"
                        name="sortOrder"
                        type="number"
                        value={form.sortOrder}
                        onChange={handleChange}
                        disabled={disableActions}
                      />
                    </FormField>
                    <Checkbox
                      id="signal-is-active"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      disabled={disableActions}
                    >
                      Active signal
                    </Checkbox>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} type="button">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={disableActions}>
                      Save signal
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

SignalModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  signal: PropTypes.object,
  capabilities: PropTypes.shape({
    canManageSignals: PropTypes.bool
  })
};

SignalModal.defaultProps = {
  signal: null,
  capabilities: null
};
