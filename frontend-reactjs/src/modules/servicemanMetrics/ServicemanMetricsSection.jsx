import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  fetchServicemanMetricsConfig,
  saveServicemanMetricsSettings,
  createServicemanMetricCard,
  updateServicemanMetricCard,
  deleteServicemanMetricCard
} from '../../api/servicemanMetricsClient.js';
import { Button, Checkbox, StatusPill, TextInput } from '../../components/ui/index.js';
import CrewCustomCardsPanel from './CrewCustomCardsPanel.jsx';
import {
  buildInitialState,
  buildSettingsPayload,
  createCrewMemberDraft,
  createChecklistDraft,
  createCertificationDraft,
  buildCardDraft,
  TONE_OPTIONS
} from './formState.js';

function SectionCard({ title, description, children, actions }) {
  return (
    <section className="rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node
};

SectionCard.defaultProps = {
  description: null,
  actions: null
};

function InfoBanner({ status, message }) {
  if (!message) return null;
  const palette =
    status === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : status === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-slate-50 text-slate-600';
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${palette}`}>{message}</div>
  );
}

InfoBanner.propTypes = {
  status: PropTypes.oneOf(['success', 'error', 'info']),
  message: PropTypes.string
};

InfoBanner.defaultProps = {
  status: 'info',
  message: null
};

const formatDateTime = (value) => {
  if (!value) return 'Not yet saved';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Not yet saved';
    }
    return date.toLocaleString();
  } catch (error) {
    return 'Not yet saved';
  }
};

const numericInputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40';
const textInputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40';
const textareaClass =
  'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelClass = 'fx-field__label';

function renderMetricInput({ id, label, value, onChange, helper, min, max, step }) {
  return (
    <div key={id}>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        className={numericInputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        max={max}
        step={step ?? 'any'}
      />
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

renderMetricInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  helper: PropTypes.string,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

renderMetricInput.defaultProps = {
  helper: null,
  min: undefined,
  max: undefined,
  step: undefined
};

export default function ServicemanMetricsSection({ section }) {
  const initialData = useMemo(
    () => buildInitialState(section.data?.settings ?? {}, section.data?.cards ?? []),
    [section.data]
  );

  const [state, setState] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cardBusyId, setCardBusyId] = useState(null);

  useEffect(() => {
    setState(buildInitialState(section.data?.settings ?? {}, section.data?.cards ?? []));
  }, [section.data]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const handleSummaryChange = useCallback((field) => (event) => {
    const { value } = event.target;
    setState((current) => ({
      ...current,
      summary: { ...current.summary, [field]: value }
    }));
  }, []);

  const handleNoteChange = useCallback((index, value) => {
    setState((current) => {
      const notes = [...current.summary.highlightNotes];
      notes[index] = value;
      return {
        ...current,
        summary: { ...current.summary, highlightNotes: notes }
      };
    });
  }, []);

  const handleAddNote = useCallback(() => {
    setState((current) => ({
      ...current,
      summary: { ...current.summary, highlightNotes: [...current.summary.highlightNotes, ''] }
    }));
  }, []);

  const handleRemoveNote = useCallback((index) => {
    setState((current) => {
      const nextNotes = current.summary.highlightNotes.filter((_, noteIndex) => noteIndex !== index);
      return {
        ...current,
        summary: { ...current.summary, highlightNotes: nextNotes.length ? nextNotes : [''] }
      };
    });
  }, []);

  const handleGroupChange = useCallback((group, field) => (event) => {
    const { value } = event.target;
    setState((current) => ({
      ...current,
      [group]: { ...current[group], [field]: value }
    }));
  }, []);

  const handleAutomationToggle = useCallback((event) => {
    const { checked } = event.target;
    setState((current) => ({
      ...current,
      operations: {
        ...current.operations,
        automation: { ...current.operations.automation, autoAssignEnabled: checked }
      }
    }));
  }, []);

  const handleAutomationChange = useCallback((field) => (event) => {
    const { value } = event.target;
    setState((current) => ({
      ...current,
      operations: {
        ...current.operations,
        automation: { ...current.operations.automation, [field]: value }
      }
    }));
  }, []);

  const handleAddRequiredModule = useCallback(() => {
    setState((current) => ({
      ...current,
      training: { ...current.training, requiredModules: [...current.training.requiredModules, ''] }
    }));
  }, []);

  const handleModuleChange = useCallback((index, value) => {
    setState((current) => {
      const modules = [...current.training.requiredModules];
      modules[index] = value;
      return { ...current, training: { ...current.training, requiredModules: modules } };
    });
  }, []);

  const handleRemoveModule = useCallback((index) => {
    setState((current) => {
      const modules = current.training.requiredModules.filter((_, moduleIndex) => moduleIndex !== index);
      return { ...current, training: { ...current.training, requiredModules: modules } };
    });
  }, []);

  const handleAddCertification = useCallback(() => {
    setState((current) => ({
      ...current,
      training: {
        ...current.training,
        certificationAlerts: [...current.training.certificationAlerts, createCertificationDraft()]
      }
    }));
  }, []);

  const handleCertificationChange = useCallback((id, field, value) => {
    setState((current) => ({
      ...current,
      training: {
        ...current.training,
        certificationAlerts: current.training.certificationAlerts.map((cert) =>
          cert.id === id ? { ...cert, [field]: value } : cert
        )
      }
    }));
  }, []);

  const handleRemoveCertification = useCallback((id) => {
    setState((current) => ({
      ...current,
      training: {
        ...current.training,
        certificationAlerts: current.training.certificationAlerts.filter((cert) => cert.id !== id)
      }
    }));
  }, []);

  const handleAddCrewMember = useCallback(() => {
    setState((current) => ({
      ...current,
      operations: {
        ...current.operations,
        crewLeaderboard: [...current.operations.crewLeaderboard, createCrewMemberDraft()]
      }
    }));
  }, []);

  const handleCrewChange = useCallback((id, field, value) => {
    setState((current) => ({
      ...current,
      operations: {
        ...current.operations,
        crewLeaderboard: current.operations.crewLeaderboard.map((member) =>
          member.id === id ? { ...member, [field]: value } : member
        )
      }
    }));
  }, []);

  const handleRemoveCrew = useCallback((id) => {
    setState((current) => ({
      ...current,
      operations: {
        ...current.operations,
        crewLeaderboard: current.operations.crewLeaderboard.filter((member) => member.id !== id)
      }
    }));
  }, []);

  const handleAddChecklist = useCallback(() => {
    setState((current) => ({
      ...current,
      operations: {
        ...current.operations,
        checklists: [...current.operations.checklists, createChecklistDraft()]
      }
    }));
  }, []);

  const handleChecklistChange = useCallback((id, field, value) => {
    setState((current) => ({
      ...current,
      operations: {
        ...current.operations,
        checklists: current.operations.checklists.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    }));
  }, []);

  const handleRemoveChecklist = useCallback((id) => {
    setState((current) => ({
      ...current,
      operations: {
        ...current.operations,
        checklists: current.operations.checklists.filter((item) => item.id !== id)
      }
    }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setErrorMessage('');
    try {
      const data = await fetchServicemanMetricsConfig();
      setState(buildInitialState(data.settings ?? {}, data.cards ?? []));
      setSuccessMessage('Crew metrics refreshed');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to refresh metrics');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setErrorMessage('');
    try {
      const payload = buildSettingsPayload(state);
      const data = await saveServicemanMetricsSettings(payload);
      setState(buildInitialState(data.settings ?? {}, data.cards ?? []));
      setSuccessMessage('Serviceman metrics updated');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save metrics');
    } finally {
      setSaving(false);
    }
  }, [state]);

  const handleAddCard = useCallback(() => {
    setState((current) => ({
      ...current,
      cards: [...current.cards, buildCardDraft(current.cards)]
    }));
  }, []);

  const handleCardSave = useCallback(
    async (card, payload) => {
      setCardBusyId(card.id);
      setErrorMessage('');
      try {
        const saveFn = card.isNew ? createServicemanMetricCard : (body) => updateServicemanMetricCard(card.id, body);
        const savedCard = await saveFn(payload);
        setState((current) => ({
          ...current,
          cards: current.cards.map((existing) =>
            existing.id === card.id ? { ...savedCard, isNew: false } : existing
          )
        }));
        setSuccessMessage('Crew card saved');
      } catch (error) {
        setErrorMessage(error.message || 'Unable to save crew card');
      } finally {
        setCardBusyId(null);
      }
    },
    []
  );

  const handleCardDelete = useCallback(
    async (card) => {
      if (card.isNew) {
        setState((current) => ({
          ...current,
          cards: current.cards.filter((item) => item.id !== card.id)
        }));
        return;
      }
      setCardBusyId(card.id);
      setErrorMessage('');
      try {
        await deleteServicemanMetricCard(card.id);
        setState((current) => ({
          ...current,
          cards: current.cards.filter((item) => item.id !== card.id)
        }));
        setSuccessMessage('Crew card removed');
      } catch (error) {
        setErrorMessage(error.message || 'Unable to delete crew card');
      } finally {
        setCardBusyId(null);
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-accent/10 bg-gradient-to-r from-white via-secondary/60 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/60">Serviceman control centre</p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">Metrics configuration</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage productivity targets, quality guardrails, and readiness checklists for your crew. Changes apply instantly
            across the dashboard.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Last updated: {formatDateTime(state.metadata?.updatedAt ?? state.summary?.metadata?.updatedAt)}</span>
            {state.metadata?.updatedBy ? <StatusPill tone="info">By {state.metadata.updatedBy}</StatusPill> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={handleRefresh} loading={refreshing}>
            Refresh data
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        </div>
      </div>

      {errorMessage ? <InfoBanner status="error" message={errorMessage} /> : null}
      {successMessage ? <InfoBanner status="success" message={successMessage} /> : null}

      <SectionCard title="Summary" description="Who is responsible for these metrics and what should the crew focus on?">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Crew lead name"
            value={state.summary.ownerName}
            onChange={handleSummaryChange('ownerName')}
            placeholder="Maria Patel"
          />
          <TextInput
            label="Escalation channel"
            value={state.summary.escalationChannel}
            onChange={handleSummaryChange('escalationChannel')}
            placeholder="#crew-escalations"
          />
          <TextInput
            label="Contact email"
            value={state.summary.ownerEmail}
            onChange={handleSummaryChange('ownerEmail')}
            placeholder="crew.lead@fixnado.com"
          />
          <TextInput
            label="Review cadence"
            value={state.summary.reviewCadence}
            onChange={handleSummaryChange('reviewCadence')}
            placeholder="Weekly on Mondays"
          />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Focus notes</p>
          {state.summary.highlightNotes.map((note, index) => (
            <div key={`note-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <textarea
                value={note}
                onChange={(event) => handleNoteChange(index, event.target.value)}
                className={`${textareaClass}`}
                rows={2}
                placeholder="Triaging emergency callouts within 20 minutes"
              />
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => handleRemoveNote(index)}
                disabled={state.summary.highlightNotes.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={handleAddNote}>
            Add highlight
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Productivity targets" description="Define baseline utilisation and capacity expectations.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderMetricInput({
            id: 'target-billable',
            label: 'Billable hours per week',
            value: state.productivity.targetBillableHours,
            min: 0,
            max: 400,
            onChange: (value) => handleGroupChange('productivity', 'targetBillableHours')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'target-utilisation',
            label: 'Utilisation target (%)',
            value: state.productivity.targetUtilisation,
            min: 0,
            max: 100,
            helper: 'Percentage of available hours on jobs',
            onChange: (value) => handleGroupChange('productivity', 'targetUtilisation')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'backlog-ceiling',
            label: 'Backlog ceiling (jobs)',
            value: state.productivity.backlogCeiling,
            min: 0,
            max: 500,
            onChange: (value) => handleGroupChange('productivity', 'backlogCeiling')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'response-target',
            label: 'Response target (mins)',
            value: state.productivity.responseTargetMinutes,
            min: 0,
            max: 480,
            onChange: (value) => handleGroupChange('productivity', 'responseTargetMinutes')({ target: { value } })
          })}
        </div>
        <textarea
          value={state.productivity.note}
          onChange={handleGroupChange('productivity', 'note')}
          rows={3}
          className={textareaClass}
          placeholder="Morning shift prioritises quick wins to keep backlog below 12 jobs."
        />
      </SectionCard>

      <SectionCard title="Quality guardrails" description="Set expectations for customer experience and rework.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderMetricInput({
            id: 'quality-sla',
            label: 'On-time SLA (%)',
            value: state.quality.targetSla,
            min: 0,
            max: 100,
            onChange: (value) => handleGroupChange('quality', 'targetSla')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'quality-rework',
            label: 'Rework threshold (%)',
            value: state.quality.reworkThreshold,
            min: 0,
            max: 100,
            onChange: (value) => handleGroupChange('quality', 'reworkThreshold')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'quality-nps',
            label: 'NPS target',
            value: state.quality.npsTarget,
            min: 0,
            max: 100,
            onChange: (value) => handleGroupChange('quality', 'npsTarget')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'quality-flags',
            label: 'Quality flags before review',
            value: state.quality.qualityFlagLimit,
            min: 0,
            max: 50,
            onChange: (value) => handleGroupChange('quality', 'qualityFlagLimit')({ target: { value } })
          })}
        </div>
        <textarea
          value={state.quality.note}
          onChange={handleGroupChange('quality', 'note')}
          rows={3}
          className={textareaClass}
          placeholder="Escalate to QA lead if more than two callbacks logged in a rolling week."
        />
      </SectionCard>

      <SectionCard title="Logistics & readiness" description="Keep travel buffers and standby coverage under control.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderMetricInput({
            id: 'logistics-travel',
            label: 'Travel buffer (mins)',
            value: state.logistics.travelBufferMinutes,
            min: 0,
            max: 480,
            onChange: (value) => handleGroupChange('logistics', 'travelBufferMinutes')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'logistics-concurrent',
            label: 'Concurrent jobs',
            value: state.logistics.maxConcurrentJobs,
            min: 0,
            max: 50,
            onChange: (value) => handleGroupChange('logistics', 'maxConcurrentJobs')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'logistics-compliance',
            label: 'Vehicle compliance (%)',
            value: state.logistics.vehicleComplianceRate,
            min: 0,
            max: 100,
            onChange: (value) => handleGroupChange('logistics', 'vehicleComplianceRate')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'logistics-standby',
            label: 'Standby crew count',
            value: state.logistics.standbyCrew,
            min: 0,
            max: 25,
            onChange: (value) => handleGroupChange('logistics', 'standbyCrew')({ target: { value } })
          })}
        </div>
        <textarea
          value={state.logistics.note}
          onChange={handleGroupChange('logistics', 'note')}
          rows={3}
          className={textareaClass}
          placeholder="Keep at least one EV-certified engineer on standby during weekend coverage."
        />
      </SectionCard>

      <SectionCard title="Training & compliance" description="Track mandatory learning and upcoming expiries.">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Mandatory modules</p>
            <div className="mt-2 space-y-3">
              {state.training.requiredModules.map((module, index) => (
                <div key={`module-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <TextInput
                    value={module}
                    onChange={(event) => handleModuleChange(index, event.target.value)}
                    placeholder="Working at height refresher"
                    className="flex-1"
                  />
                  <Button type="button" variant="tertiary" size="sm" onClick={() => handleRemoveModule(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={handleAddRequiredModule}>
                Add module
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-primary">Certification alerts</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-secondary text-primary">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Certification</th>
                    <th className="px-3 py-2 text-left font-semibold">Owner</th>
                    <th className="px-3 py-2 text-left font-semibold">Due</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.training.certificationAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-sm text-slate-500">
                        No upcoming expiries logged.
                      </td>
                    </tr>
                  ) : (
                    state.training.certificationAlerts.map((cert) => (
                      <tr key={cert.id}>
                        <td className="px-3 py-2">
                          <TextInput
                            value={cert.name}
                            onChange={(event) => handleCertificationChange(cert.id, 'name', event.target.value)}
                            placeholder="Gas Safe renewal"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <TextInput
                            value={cert.owner}
                            onChange={(event) => handleCertificationChange(cert.id, 'owner', event.target.value)}
                            placeholder="Assigned owner"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <TextInput
                            value={cert.dueDate}
                            onChange={(event) => handleCertificationChange(cert.id, 'dueDate', event.target.value)}
                            placeholder="2025-04-30"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button type="button" variant="tertiary" size="sm" onClick={() => handleRemoveCertification(cert.id)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={handleAddCertification}>
              Add certification
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {renderMetricInput({
              id: 'training-compliance',
              label: 'Compliance due in (days)',
              value: state.training.complianceDueInDays,
              min: 0,
              max: 365,
              onChange: (value) => handleGroupChange('training', 'complianceDueInDays')({ target: { value } })
            })}
            <div>
              <label className={labelClass} htmlFor="training-last-drill">
                Last safety drill
              </label>
              <input
                id="training-last-drill"
                type="text"
                className={textInputClass}
                value={state.training.lastDrillCompletedAt}
                onChange={(event) => handleGroupChange('training', 'lastDrillCompletedAt')(event)}
                placeholder="2025-02-18"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="training-next-drill">
                Next scheduled drill
              </label>
              <input
                id="training-next-drill"
                type="text"
                className={textInputClass}
                value={state.training.nextDrillScheduledAt}
                onChange={(event) => handleGroupChange('training', 'nextDrillScheduledAt')(event)}
                placeholder="2025-03-04"
              />
            </div>
            <textarea
              value={state.training.note}
              onChange={handleGroupChange('training', 'note')}
              rows={3}
              className={textareaClass}
              placeholder="Add cross-training requirements or external assessments."
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Wellness & safety" description="Guardrails to prevent burnout and flag fatigue risks.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderMetricInput({
            id: 'wellness-overtime',
            label: 'Weekly overtime cap (hrs)',
            value: state.wellness.overtimeCapHours,
            min: 0,
            max: 80,
            onChange: (value) => handleGroupChange('wellness', 'overtimeCapHours')({ target: { value } })
          })}
          <div>
            <label className={labelClass} htmlFor="wellness-cadence">
              Wellness check cadence
            </label>
            <input
              id="wellness-cadence"
              type="text"
              className={textInputClass}
              value={state.wellness.wellbeingCheckCadence}
              onChange={(event) => handleGroupChange('wellness', 'wellbeingCheckCadence')(event)}
              placeholder="Monthly 1:1"
            />
          </div>
          {renderMetricInput({
            id: 'wellness-incidents',
            label: 'Safety incident threshold',
            value: state.wellness.safetyIncidentThreshold,
            min: 0,
            max: 20,
            onChange: (value) => handleGroupChange('wellness', 'safetyIncidentThreshold')({ target: { value } })
          })}
          {renderMetricInput({
            id: 'wellness-fatigue',
            label: 'Fatigue flag limit',
            value: state.wellness.fatigueFlagLimit,
            min: 0,
            max: 20,
            onChange: (value) => handleGroupChange('wellness', 'fatigueFlagLimit')({ target: { value } })
          })}
        </div>
        <textarea
          value={state.wellness.note}
          onChange={handleGroupChange('wellness', 'note')}
          rows={3}
          className={textareaClass}
          placeholder="Escalate to occupational health if two fatigue flags triggered within 30 days."
        />
      </SectionCard>

      <SectionCard
        title="Crew leaderboard"
        description="Track spotlight metrics for individual crew members."
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={handleAddCrewMember}>
            Add crew member
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-secondary text-primary">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Name</th>
                <th className="px-3 py-2 text-left font-semibold">Role</th>
                <th className="px-3 py-2 text-left font-semibold">Completed</th>
                <th className="px-3 py-2 text-left font-semibold">Utilisation %</th>
                <th className="px-3 py-2 text-left font-semibold">Quality %</th>
                <th className="px-3 py-2 text-left font-semibold">Rating</th>
                <th className="px-3 py-2 text-left font-semibold">Avatar URL</th>
                <th className="px-3 py-2 text-left font-semibold">Spotlight</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.operations.crewLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-sm text-slate-500">
                    No crew members configured.
                  </td>
                </tr>
              ) : (
                state.operations.crewLeaderboard.map((member) => (
                  <tr key={member.id}>
                    <td className="px-3 py-2">
                      <TextInput
                        value={member.name}
                        onChange={(event) => handleCrewChange(member.id, 'name', event.target.value)}
                        placeholder="Crew member"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput
                        value={member.role}
                        onChange={(event) => handleCrewChange(member.id, 'role', event.target.value)}
                        placeholder="Role"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className={numericInputClass}
                        value={member.completedJobs}
                        onChange={(event) => handleCrewChange(member.id, 'completedJobs', event.target.value)}
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className={numericInputClass}
                        value={member.utilisation}
                        onChange={(event) => handleCrewChange(member.id, 'utilisation', event.target.value)}
                        min={0}
                        max={100}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className={numericInputClass}
                        value={member.qualityScore}
                        onChange={(event) => handleCrewChange(member.id, 'qualityScore', event.target.value)}
                        min={0}
                        max={100}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className={numericInputClass}
                        value={member.rating}
                        onChange={(event) => handleCrewChange(member.id, 'rating', event.target.value)}
                        min={0}
                        max={5}
                        step="0.1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput
                        value={member.avatarUrl}
                        onChange={(event) => handleCrewChange(member.id, 'avatarUrl', event.target.value)}
                        placeholder="https://..."
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput
                        value={member.spotlight}
                        onChange={(event) => handleCrewChange(member.id, 'spotlight', event.target.value)}
                        placeholder="Travel specialist"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button type="button" variant="tertiary" size="sm" onClick={() => handleRemoveCrew(member.id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Operational checklists"
        description="Ensure safety and readiness steps are completed on schedule."
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={handleAddChecklist}>
            Add checklist
          </Button>
        }
      >
        <div className="space-y-3">
          {state.operations.checklists.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-secondary/60 p-4 text-sm text-slate-500">
              No checklists defined yet.
            </p>
          ) : (
            state.operations.checklists.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 sm:grid-cols-4">
                <TextInput
                  label="Checklist"
                  value={item.label}
                  onChange={(event) => handleChecklistChange(item.id, 'label', event.target.value)}
                  placeholder="Vehicle safety checklist"
                />
                <TextInput
                  label="Owner"
                  value={item.owner}
                  onChange={(event) => handleChecklistChange(item.id, 'owner', event.target.value)}
                  placeholder="Shift lead"
                />
                <TextInput
                  label="Cadence"
                  value={item.cadence}
                  onChange={(event) => handleChecklistChange(item.id, 'cadence', event.target.value)}
                  placeholder="Before every shift"
                />
                <div className="flex flex-col gap-2">
                  <TextInput
                    label="Last completed"
                    value={item.lastCompletedAt}
                    onChange={(event) => handleChecklistChange(item.id, 'lastCompletedAt', event.target.value)}
                    placeholder="2025-02-20"
                  />
                  <Button type="button" variant="tertiary" size="sm" onClick={() => handleRemoveChecklist(item.id)}>
                    Remove checklist
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title="Automation preferences" description="Control routing behaviour and escalation guardrails.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-secondary/60 p-4">
            <Checkbox
              label="Auto-assign eligible jobs to standby crew"
              checked={state.operations.automation.autoAssignEnabled}
              onChange={handleAutomationToggle}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="automation-escalation">
              Escalate when
            </label>
            <input
              id="automation-escalation"
              type="text"
              className={textInputClass}
              value={state.operations.automation.escalateWhen}
              onChange={handleAutomationChange('escalateWhen')}
              placeholder="Travel buffer exceeds 45 minutes"
            />
          </div>
          <TextInput
            label="Escalation channel"
            value={state.operations.automation.escalationChannel}
            onChange={handleAutomationChange('escalationChannel')}
            placeholder="@ops-duty"
          />
          <TextInput
            label="Follow-up channel"
            value={state.operations.automation.followUpChannel}
            onChange={handleAutomationChange('followUpChannel')}
            placeholder="#crew-follow-up"
          />
        </div>
      </SectionCard>

      <CrewCustomCardsPanel
        cards={state.cards}
        tones={TONE_OPTIONS}
        onAdd={handleAddCard}
        onSave={handleCardSave}
        onDelete={handleCardDelete}
        busyId={cardBusyId}
      />
    </div>
  );
}

ServicemanMetricsSection.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      settings: PropTypes.object,
      cards: PropTypes.arrayOf(PropTypes.object)
    })
  }).isRequired
};
