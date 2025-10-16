import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  ClockIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button, Spinner, StatusPill, TextInput } from '../ui/index.js';
import {
  fetchZoneServices,
  removeZoneService,
  syncZoneServices
} from '../../api/zoneAdminClient.js';

const COVERAGE_TYPES = [
  { value: 'primary', label: 'Primary coverage' },
  { value: 'secondary', label: 'Secondary coverage' },
  { value: 'supplementary', label: 'Supplementary coverage' }
];

const INITIAL_FORM = {
  serviceId: '',
  coverageType: 'primary',
  priority: 1,
  effectiveFrom: '',
  effectiveTo: '',
  notes: '',
  referenceUrl: ''
};

function toActor(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    type: user.type
  };
}

function normaliseMetadata(form) {
  const metadata = {};
  if (form.notes.trim()) {
    metadata.notes = form.notes.trim();
  }
  if (form.referenceUrl.trim()) {
    metadata.referenceUrl = form.referenceUrl.trim();
  }
  return metadata;
}

export default function ZoneServicesManager({ open, onClose, zone, user }) {
  const [state, setState] = useState({ loading: false, error: null, data: [] });
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [removing, setRemoving] = useState(null);

  const zoneId = zone?.id ?? null;

  const loadServices = useCallback(() => {
    if (!zoneId) {
      return;
    }
    const controller = new AbortController();
    setState({ loading: true, error: null, data: [] });
    fetchZoneServices(zoneId, { signal: controller.signal })
      .then((payload) => {
        setState({ loading: false, error: null, data: Array.isArray(payload) ? payload : [] });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ loading: false, error: error.message ?? 'Unable to load services', data: [] });
      });

    return () => controller.abort();
  }, [zoneId]);

  useEffect(() => {
    if (!open || !zoneId) {
      return undefined;
    }
    return loadServices();
  }, [open, zoneId, loadServices]);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM);
      setFeedback(null);
      setState((current) => ({ ...current, error: null }));
    }
  }, [open]);

  const handleFieldChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!zoneId) {
      return;
    }

    const trimmedServiceId = form.serviceId.trim();
    if (!trimmedServiceId) {
      setFeedback({ tone: 'danger', message: 'Enter a service ID before attaching coverage.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const priorityValue = Number.parseInt(form.priority, 10);
      const payload = {
        coverages: [
          {
            serviceId: trimmedServiceId,
            coverageType: form.coverageType,
            priority: Number.isFinite(priorityValue) && priorityValue > 0 ? priorityValue : 1,
            effectiveFrom: form.effectiveFrom || null,
            effectiveTo: form.effectiveTo || null,
            metadata: normaliseMetadata(form)
          }
        ],
        replace: false,
        actor: toActor(user)
      };

      const updated = await syncZoneServices(zoneId, payload);
      setState({ loading: false, error: null, data: Array.isArray(updated) ? updated : [] });
      setForm(INITIAL_FORM);
      setFeedback({ tone: 'success', message: 'Service coverage saved to this zone.' });
    } catch (error) {
      setFeedback({ tone: 'danger', message: error.message ?? 'Unable to attach service to zone.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (coverageId) => {
    if (!zoneId) {
      return;
    }
    setRemoving(coverageId);
    setFeedback(null);
    try {
      await removeZoneService(zoneId, coverageId, { actor: toActor(user) });
      loadServices();
      setFeedback({ tone: 'success', message: 'Service removed from this zone.' });
    } catch (error) {
      setFeedback({ tone: 'danger', message: error.message ?? 'Unable to remove service.' });
    } finally {
      setRemoving(null);
    }
  };

  const coverageCount = state.data.length;
  const headerSubtitle = useMemo(() => {
    if (!coverageCount) {
      return 'No services linked yet';
    }
    return `${coverageCount} service${coverageCount === 1 ? '' : 's'} linked`;
  }, [coverageCount]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-primary">
                      Manage services for {zone?.name ?? 'zone'}
                    </Dialog.Title>
                    <p className="text-sm text-slate-500">{headerSubtitle}</p>
                  </div>
                  <Button variant="ghost" iconPosition="end" icon={ArrowPathIcon} onClick={loadServices}>
                    Refresh
                  </Button>
                </div>

                <div className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <section aria-labelledby="zone-services-list">
                    <div className="flex items-center justify-between">
                      <h3 id="zone-services-list" className="text-base font-semibold text-primary">
                        Active coverages
                      </h3>
                      <StatusPill tone={coverageCount ? 'info' : 'neutral'}>
                        {coverageCount ? `${coverageCount} linked` : 'Awaiting first service'}
                      </StatusPill>
                    </div>

                    {state.loading ? (
                      <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                        <Spinner className="h-5 w-5 text-primary" /> Loading services…
                      </div>
                    ) : null}

                    {state.error ? (
                      <div className="mt-6 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                        {state.error}
                      </div>
                    ) : null}

                    {!state.loading && !state.error && state.data.length === 0 ? (
                      <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        Link a service to define who can accept work from this zone.
                      </p>
                    ) : null}

                    <ul className="mt-6 space-y-4">
                      {state.data.map((coverage) => (
                        <li
                          key={coverage.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-primary">{coverage.service?.name ?? coverage.serviceId}</p>
                              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                                {coverage.serviceId}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                                  <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                                  {coverage.coverageType}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-600">
                                  Priority {coverage.priority}
                                </span>
                                {coverage.effectiveFrom ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-600">
                                    <ClockIcon className="h-4 w-4" aria-hidden="true" />
                                    From {new Date(coverage.effectiveFrom).toLocaleDateString()}
                                  </span>
                                ) : null}
                                {coverage.effectiveTo ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-600">
                                    <ClockIcon className="h-4 w-4" aria-hidden="true" />
                                    Until {new Date(coverage.effectiveTo).toLocaleDateString()}
                                  </span>
                                ) : null}
                              </div>
                              {coverage.metadata?.notes ? (
                                <p className="mt-3 text-sm text-slate-600">{coverage.metadata.notes}</p>
                              ) : null}
                              {coverage.metadata?.referenceUrl ? (
                                <p className="mt-1 text-xs text-primary">
                                  <a href={coverage.metadata.referenceUrl} target="_blank" rel="noreferrer">
                                    Reference link
                                  </a>
                                </p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              icon={TrashIcon}
                              loading={removing === coverage.id}
                              onClick={() => handleRemove(coverage.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section aria-labelledby="zone-services-form" className="space-y-4">
                    <h3 id="zone-services-form" className="text-base font-semibold text-primary">
                      Attach a service
                    </h3>
                    <p className="text-sm text-slate-600">
                      Add a service to this zone to allow matching crews to accept dispatches. Priority controls the order we try
                      each crew.
                    </p>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <TextInput
                        label="Service ID"
                        placeholder="UUID from the service directory"
                        value={form.serviceId}
                        onChange={handleFieldChange('serviceId')}
                        required
                      />

                      <label className="fx-field">
                        <span className="fx-field__label">Coverage type</span>
                        <select
                          className="fx-text-input"
                          value={form.coverageType}
                          onChange={handleFieldChange('coverageType')}
                        >
                          {COVERAGE_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <TextInput
                        label="Priority"
                        type="number"
                        min="1"
                        value={form.priority}
                        onChange={handleFieldChange('priority')}
                        required
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextInput
                          label="Effective from"
                          type="date"
                          value={form.effectiveFrom}
                          onChange={handleFieldChange('effectiveFrom')}
                        />
                        <TextInput
                          label="Effective until"
                          type="date"
                          value={form.effectiveTo}
                          onChange={handleFieldChange('effectiveTo')}
                        />
                      </div>

                      <label className="fx-field">
                        <span className="fx-field__label">Dispatch notes</span>
                        <textarea
                          rows={3}
                          className="fx-text-input"
                          value={form.notes}
                          onChange={handleFieldChange('notes')}
                          placeholder="Callouts, SLAs, or entry instructions"
                        />
                      </label>

                      <TextInput
                        label="Reference URL"
                        value={form.referenceUrl}
                        onChange={handleFieldChange('referenceUrl')}
                        placeholder="Link to runbook, knowledge article, or asset"
                      />

                      {feedback ? (
                        <div
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            feedback.tone === 'success'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-danger/40 bg-danger/10 text-danger'
                          }`}
                        >
                          {feedback.message}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-3">
                        <Button type="submit" icon={PlusIcon} loading={saving}>
                          Add service
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setForm(INITIAL_FORM)}
                        >
                          Clear form
                        </Button>
                      </div>
                    </form>
                  </section>
                </div>

                <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

ZoneServicesManager.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  zone: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    companyId: PropTypes.string
  }),
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
    type: PropTypes.string
  })
};

ZoneServicesManager.defaultProps = {
  zone: null,
  user: null
};
