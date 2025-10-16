import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ComplianceSummaryCards from './ComplianceSummaryCards.jsx';
import ComplianceControlsTable from './ComplianceControlsTable.jsx';
import ComplianceEvidenceBoard from './ComplianceEvidenceBoard.jsx';
import ComplianceAutomationForm from './ComplianceAutomationForm.jsx';
import ComplianceControlModal from './ComplianceControlModal.jsx';
import {
  FREQUENCY_LABELS,
  DEFAULT_FORM_STATE,
  DEFAULT_AUTOMATION_FORM
} from './constants.js';
import {
  nowIsoLocal,
  buildEmptyEvidence,
  buildEmptyException,
  toDateInput,
  toIsoOrNull,
  normaliseListValue
} from './helpers.js';

function ComplianceControlSection({ section }) {
  const { data = {}, actions = {} } = section;
  const {
    loading = false,
    error = null,
    controls = [],
    summary = {},
    filters = {},
    automation = {},
    evidence = [],
    exceptions = []
  } = data;

  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [automationForm, setAutomationForm] = useState({ ...DEFAULT_AUTOMATION_FORM, ...automation });
  const [automationSaving, setAutomationSaving] = useState(false);
  const [automationMessage, setAutomationMessage] = useState(null);

  useEffect(() => {
    setAutomationForm((current) => ({ ...current, ...automation }));
  }, [automation]);

  const frequencyOptions = useMemo(() => {
    const available = filters.reviewFrequencies || [];
    const mapped = available.map((value) => ({
      value,
      label: FREQUENCY_LABELS[value] || value.replace(/_/g, ' ')
    }));
    return [{ value: 'all', label: 'All cadences' }, ...mapped];
  }, [filters.reviewFrequencies]);

  const filteredControls = useMemo(() => {
    return controls
      .filter((control) => {
        if (statusFilter !== 'all' && control.status !== statusFilter) {
          return false;
        }
        if (frequencyFilter !== 'all' && control.reviewFrequency !== frequencyFilter) {
          return false;
        }
        if (searchTerm && !control.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.dueStatus === 'overdue' && b.dueStatus !== 'overdue') return -1;
        if (a.dueStatus !== 'overdue' && b.dueStatus === 'overdue') return 1;
        return (a.nextReviewAt || '').localeCompare(b.nextReviewAt || '');
      });
  }, [controls, statusFilter, frequencyFilter, searchTerm]);

  const closeModal = () => {
    setModalOpen(false);
    setFormState(DEFAULT_FORM_STATE);
    setFormError(null);
    setFormSubmitting(false);
  };

  const openCreateModal = () => {
    setFormState({
      ...DEFAULT_FORM_STATE,
      ownerTeam: automationForm.defaultOwnerTeam || DEFAULT_FORM_STATE.ownerTeam,
      nextReviewAt: nowIsoLocal()
    });
    setModalOpen(true);
  };

  const openEditModal = (control) => {
    setFormState({
      id: control.id,
      title: control.title,
      category: control.category,
      controlType: control.controlType,
      status: control.status,
      reviewFrequency: control.reviewFrequency,
      ownerTeam: control.ownerTeam || DEFAULT_FORM_STATE.ownerTeam,
      ownerEmail: control.ownerEmail || '',
      nextReviewAt: toDateInput(control.nextReviewAt),
      lastReviewAt: toDateInput(control.lastReviewAt),
      documentationUrl: control.documentationUrl || '',
      evidenceLocation: control.evidenceLocation || '',
      evidenceRequired: Boolean(control.evidenceRequired),
      escalationPolicy: control.escalationPolicy || '',
      notes: control.notes || '',
      tags: (control.tags || []).join(', '),
      watchers: (control.watchers || []).join(', '),
      rolesAllowed: Array.isArray(control.metadata?.rolesAllowed)
        ? control.metadata.rolesAllowed.join(', ')
        : '',
      evidenceCheckpoints: Array.isArray(control.metadata?.evidenceCheckpoints)
        ? control.metadata.evidenceCheckpoints.map((checkpoint) => ({
            id: checkpoint.id || buildEmptyEvidence().id,
            name: checkpoint.name || checkpoint.requirement || '',
            requirement: checkpoint.requirement || checkpoint.name || '',
            dueAt: toDateInput(checkpoint.dueAt),
            owner: checkpoint.owner || '',
            status: checkpoint.status || 'pending',
            evidenceUrl: checkpoint.evidenceUrl || '',
            notes: checkpoint.notes || ''
          }))
        : [],
      exceptionReviews: Array.isArray(control.metadata?.exceptionReviews)
        ? control.metadata.exceptionReviews.map((review) => ({
            id: review.id || buildEmptyException().id,
            summary: review.summary || '',
            owner: review.owner || '',
            status: review.status || 'open',
            expiresAt: toDateInput(review.expiresAt),
            notes: review.notes || ''
          }))
        : []
    });
    setModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleEvidenceChange = (index, field, value) => {
    setFormState((current) => {
      const draft = [...current.evidenceCheckpoints];
      draft[index] = { ...draft[index], [field]: value };
      return { ...current, evidenceCheckpoints: draft };
    });
  };

  const handleExceptionChange = (index, field, value) => {
    setFormState((current) => {
      const draft = [...current.exceptionReviews];
      draft[index] = { ...draft[index], [field]: value };
      return { ...current, exceptionReviews: draft };
    });
  };

  const addEvidence = () => {
    setFormState((current) => ({
      ...current,
      evidenceCheckpoints: [...current.evidenceCheckpoints, buildEmptyEvidence()]
    }));
  };

  const removeEvidence = (index) => {
    setFormState((current) => ({
      ...current,
      evidenceCheckpoints: current.evidenceCheckpoints.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const addException = () => {
    setFormState((current) => ({
      ...current,
      exceptionReviews: [...current.exceptionReviews, buildEmptyException()]
    }));
  };

  const removeException = (index) => {
    setFormState((current) => ({
      ...current,
      exceptionReviews: current.exceptionReviews.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    const payload = {
      title: formState.title,
      category: formState.category,
      controlType: formState.controlType,
      status: formState.status,
      reviewFrequency: formState.reviewFrequency,
      ownerTeam: formState.ownerTeam,
      ownerEmail: formState.ownerEmail || null,
      nextReviewAt: toIsoOrNull(formState.nextReviewAt),
      lastReviewAt: toIsoOrNull(formState.lastReviewAt),
      documentationUrl: formState.documentationUrl || null,
      evidenceLocation: formState.evidenceLocation || null,
      evidenceRequired: formState.evidenceRequired,
      escalationPolicy: formState.escalationPolicy || null,
      notes: formState.notes || null,
      tags: formState.tags,
      watchers: formState.watchers,
      metadata: {
        evidenceCheckpoints: formState.evidenceCheckpoints.map((item) => ({
          id: item.id,
          name: item.name || item.requirement,
          requirement: item.requirement || item.name,
          dueAt: toIsoOrNull(item.dueAt),
          owner: item.owner,
          status: item.status,
          evidenceUrl: item.evidenceUrl,
          notes: item.notes
        })),
        exceptionReviews: formState.exceptionReviews.map((item) => ({
          id: item.id,
          summary: item.summary,
          owner: item.owner,
          status: item.status,
          expiresAt: toIsoOrNull(item.expiresAt),
          notes: item.notes
        })),
        rolesAllowed: normaliseListValue(formState.rolesAllowed)
      }
    };

    try {
      if (formState.id) {
        await actions.updateControl?.(formState.id, payload);
      } else {
        await actions.createControl?.(payload);
      }
      closeModal();
    } catch (err) {
      setFormError(err.message || 'Unable to save control');
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (control) => {
    if (!window.confirm(`Archive control “${control.title}”?`)) {
      return;
    }
    try {
      await actions.deleteControl?.(control.id);
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err.message || 'Unable to delete control');
    }
  };

  const handleAutomationChange = (field, value) => {
    setAutomationForm((current) => ({ ...current, [field]: value }));
  };

  const submitAutomation = async (event) => {
    event.preventDefault();
    setAutomationSaving(true);
    setAutomationMessage(null);
    try {
      await actions.updateAutomation?.({
        ...automationForm,
        reminderOffsetDays: Number.parseInt(automationForm.reminderOffsetDays ?? 0, 10) || 0,
        evidenceGraceDays: Number.parseInt(automationForm.evidenceGraceDays ?? 0, 10) || 0
      });
      setAutomationMessage('Automation defaults saved');
    } catch (err) {
      setAutomationMessage(err.message || 'Unable to save automation defaults');
    } finally {
      setAutomationSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
        <p className="text-sm text-slate-600 max-w-3xl">{section.description}</p>
      </div>

      <ComplianceSummaryCards summary={{
        total: Number(summary.total ?? 0),
        overdue: Number(summary.overdue ?? 0),
        dueSoon: Number(summary.dueSoon ?? 0),
        monitoring: Number(summary.monitoring ?? 0)
      }} />

      <ComplianceControlsTable
        loading={loading}
        error={error}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        frequencyFilter={frequencyFilter}
        frequencyOptions={frequencyOptions}
        onFrequencyChange={setFrequencyFilter}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onCreate={openCreateModal}
        onRefresh={() => actions.refresh?.()}
        filteredControls={filteredControls}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <ComplianceEvidenceBoard evidence={evidence} exceptions={exceptions} />

      <ComplianceAutomationForm
        form={automationForm}
        onChange={handleAutomationChange}
        onSubmit={submitAutomation}
        saving={automationSaving}
        message={automationMessage}
      />

      <ComplianceControlModal
        open={modalOpen}
        onClose={closeModal}
        formState={formState}
        onChange={handleFormChange}
        onSubmit={submitForm}
        submitting={formSubmitting}
        error={formError}
        filters={filters}
        onEvidenceChange={handleEvidenceChange}
        onEvidenceAdd={addEvidence}
        onEvidenceRemove={removeEvidence}
        onExceptionChange={handleExceptionChange}
        onExceptionAdd={addException}
        onExceptionRemove={removeException}
      />
    </div>
  );
}

ComplianceControlSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.object,
      controls: PropTypes.arrayOf(PropTypes.object),
      summary: PropTypes.object,
      filters: PropTypes.object,
      automation: PropTypes.object,
      evidence: PropTypes.arrayOf(PropTypes.object),
      exceptions: PropTypes.arrayOf(PropTypes.object)
    }).isRequired,
    actions: PropTypes.shape({
      refresh: PropTypes.func,
      createControl: PropTypes.func,
      updateControl: PropTypes.func,
      deleteControl: PropTypes.func,
      updateAutomation: PropTypes.func
    })
  }).isRequired
};

export default ComplianceControlSection;
