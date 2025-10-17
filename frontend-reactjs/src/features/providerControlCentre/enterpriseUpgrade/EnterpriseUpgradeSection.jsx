import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import { useLocale } from '../../../hooks/useLocale.js';
import EnterpriseUpgradeSummaryCard from './EnterpriseUpgradeSummaryCard.jsx';
import EnterpriseUpgradeContactsCard from './EnterpriseUpgradeContactsCard.jsx';
import EnterpriseUpgradeSitesCard from './EnterpriseUpgradeSitesCard.jsx';
import EnterpriseUpgradeChecklistCard from './EnterpriseUpgradeChecklistCard.jsx';
import EnterpriseUpgradeDocumentsCard from './EnterpriseUpgradeDocumentsCard.jsx';
import { useEnterpriseUpgradeForm } from './useEnterpriseUpgradeForm.js';

function EnterpriseUpgradeSection({ upgrade, onRefresh }) {
  const { format } = useLocale();
  const {
    record,
    form,
    statusTone,
    showCreateState,
    message,
    error,
    saving,
    creating,
    setField,
    toggleFeature,
    updateArrayField,
    updateArrayBoolean,
    addArrayEntry,
    removeArrayEntry,
    createWorkspace,
    saveWorkspace
  } = useEnterpriseUpgradeForm(upgrade, { onRefresh });

  const handleContactFieldChange = useCallback(
    (index, field, value) => updateArrayField('contacts', index, field, value),
    [updateArrayField]
  );
  const handleContactBooleanChange = useCallback(
    (index, field, value) => updateArrayBoolean('contacts', index, field, value),
    [updateArrayBoolean]
  );
  const handleAddContact = useCallback(
    (template) => addArrayEntry('contacts', template),
    [addArrayEntry]
  );
  const handleRemoveContact = useCallback(
    (index) => removeArrayEntry('contacts', index),
    [removeArrayEntry]
  );

  const handleSiteFieldChange = useCallback(
    (index, field, value) => updateArrayField('sites', index, field, value),
    [updateArrayField]
  );
  const handleAddSite = useCallback((template) => addArrayEntry('sites', template), [addArrayEntry]);
  const handleRemoveSite = useCallback((index) => removeArrayEntry('sites', index), [removeArrayEntry]);

  const handleChecklistFieldChange = useCallback(
    (index, field, value) => updateArrayField('checklist', index, field, value),
    [updateArrayField]
  );
  const handleAddChecklistItem = useCallback(
    (template) => addArrayEntry('checklist', template),
    [addArrayEntry]
  );
  const handleRemoveChecklistItem = useCallback(
    (index) => removeArrayEntry('checklist', index),
    [removeArrayEntry]
  );

  const handleDocumentFieldChange = useCallback(
    (index, field, value) => updateArrayField('documents', index, field, value),
    [updateArrayField]
  );
  const handleAddDocument = useCallback(
    (template) => addArrayEntry('documents', template),
    [addArrayEntry]
  );
  const handleRemoveDocument = useCallback(
    (index) => removeArrayEntry('documents', index),
    [removeArrayEntry]
  );

  return (
    <section id="provider-dashboard-enterprise-upgrade" className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Enterprise upgrade</p>
          <h2 className="text-lg font-semibold text-primary">Enterprise upgrade option</h2>
          <p className="mt-1 text-sm text-slate-500">
            Capture rollout plans, stakeholders, and launch readiness to unlock the Enterprise Performance Suite.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/dashboards/enterprise"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            Open enterprise suite
          </Link>
          {showCreateState ? (
            <Button onClick={createWorkspace} loading={creating} variant="primary">
              Launch upgrade workspace
            </Button>
          ) : (
            <Button onClick={saveWorkspace} loading={saving} disabled={saving} variant="primary">
              Save updates
            </Button>
          )}
        </div>
      </header>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700" role="status">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-600" role="alert">
          {error}
        </div>
      ) : null}

      {showCreateState ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-sm text-slate-600">
          <p className="font-semibold text-primary">No enterprise upgrade workspace yet.</p>
          <p className="mt-2">
            Activate the upgrade workspace to coordinate enterprise rollout plans, feature requests, and compliance actions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <EnterpriseUpgradeSummaryCard
            form={form}
            record={record}
            statusTone={statusTone}
            onFieldChange={setField}
            onFeatureToggle={toggleFeature}
            format={format}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <EnterpriseUpgradeContactsCard
              contacts={form.contacts}
              onAddContact={handleAddContact}
              onFieldChange={handleContactFieldChange}
              onBooleanChange={handleContactBooleanChange}
              onRemoveContact={handleRemoveContact}
            />
            <EnterpriseUpgradeSitesCard
              sites={form.sites}
              onAddSite={handleAddSite}
              onFieldChange={handleSiteFieldChange}
              onRemoveSite={handleRemoveSite}
            />
          </div>
          <EnterpriseUpgradeChecklistCard
            items={form.checklist}
            onAddItem={handleAddChecklistItem}
            onFieldChange={handleChecklistFieldChange}
            onRemoveItem={handleRemoveChecklistItem}
          />
          <EnterpriseUpgradeDocumentsCard
            documents={form.documents}
            onAddDocument={handleAddDocument}
            onFieldChange={handleDocumentFieldChange}
            onRemoveDocument={handleRemoveDocument}
          />
        </div>
      )}
    </section>
  );
}

EnterpriseUpgradeSection.propTypes = {
  upgrade: PropTypes.shape({
    id: PropTypes.string
  }),
  onRefresh: PropTypes.func
};

EnterpriseUpgradeSection.defaultProps = {
  upgrade: null,
  onRefresh: undefined
};

export default EnterpriseUpgradeSection;
