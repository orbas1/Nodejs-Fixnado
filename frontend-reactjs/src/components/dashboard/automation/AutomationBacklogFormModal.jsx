import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import Button from '../../ui/Button.jsx';
import TextInput from '../../ui/TextInput.jsx';
import FormField from '../../ui/FormField.jsx';
import Checkbox from '../../ui/Checkbox.jsx';
import Fieldset from './Fieldset.jsx';
import CollectionEditor from './CollectionEditor.jsx';
import {
  PRIORITY_OPTIONS,
  RISK_OPTIONS,
  ROLE_OPTIONS,
  STAGE_OPTIONS,
  STATUS_OPTIONS
} from './constants.js';
import { ensureArray, normaliseSelectValue } from './utils.js';

export default function AutomationBacklogFormModal({
  open,
  formData,
  fieldErrors,
  formError,
  saving,
  onClose,
  onChange,
  onRoleToggle,
  onSubmit
}) {
  return (
    <Transition show={open} as={Fragment}>
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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-3xl border border-accent/10 bg-white p-8 text-left shadow-2xl">
                <Dialog.Title className="text-2xl font-semibold text-primary">
                  {formData.id ? 'Edit automation initiative' : 'Create automation initiative'}
                </Dialog.Title>
                {formError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-700">{formError}</div>
                ) : null}
                <form className="mt-6 space-y-6" onSubmit={onSubmit}>
                  <Fieldset title="Summary" description="Describe the automation initiative and core ownership details.">
                    <TextInput
                      id="automation-name"
                      label="Name"
                      value={formData.name}
                      onChange={(event) => onChange('name', event.target.value)}
                      error={fieldErrors.name}
                    />
                    <FormField id="automation-summary" label="Objective" error={fieldErrors.summary}>
                      <textarea
                        className="fx-text-input min-h-[140px]"
                        value={formData.summary}
                        onChange={(event) => onChange('summary', event.target.value)}
                      />
                    </FormField>
                    <FormField id="automation-status" label="Status" error={fieldErrors.status}>
                      <select
                        className="fx-text-input"
                        value={normaliseSelectValue(formData.status)}
                        onChange={(event) => onChange('status', event.target.value)}
                      >
                        {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="automation-stage" label="Stage" error={fieldErrors.stage}>
                      <select
                        className="fx-text-input"
                        value={normaliseSelectValue(formData.stage)}
                        onChange={(event) => onChange('stage', event.target.value)}
                      >
                        {STAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <TextInput
                      id="automation-category"
                      label="Category"
                      optionalLabel="Optional"
                      value={formData.category}
                      onChange={(event) => onChange('category', event.target.value)}
                      error={fieldErrors.category}
                    />
                    <TextInput
                      id="automation-type"
                      label="Automation type"
                      optionalLabel="Optional"
                      value={formData.automationType}
                      onChange={(event) => onChange('automationType', event.target.value)}
                      error={fieldErrors.automationType}
                    />
                    <TextInput
                      id="automation-owner"
                      label="Owner"
                      value={formData.owner}
                      onChange={(event) => onChange('owner', event.target.value)}
                      error={fieldErrors.owner}
                    />
                    <TextInput
                      id="automation-sponsor"
                      label="Sponsor"
                      optionalLabel="Optional"
                      value={formData.sponsor}
                      onChange={(event) => onChange('sponsor', event.target.value)}
                      error={fieldErrors.sponsor}
                    />
                    <TextInput
                      id="automation-squad"
                      label="Delivery squad"
                      optionalLabel="Optional"
                      value={formData.squad}
                      onChange={(event) => onChange('squad', event.target.value)}
                      error={fieldErrors.squad}
                    />
                    <FormField id="automation-priority" label="Priority" error={fieldErrors.priority}>
                      <select
                        className="fx-text-input"
                        value={normaliseSelectValue(formData.priority)}
                        onChange={(event) => onChange('priority', event.target.value)}
                      >
                        {PRIORITY_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="automation-risk" label="Risk level" error={fieldErrors.riskLevel}>
                      <select
                        className="fx-text-input"
                        value={normaliseSelectValue(formData.riskLevel)}
                        onChange={(event) => onChange('riskLevel', event.target.value)}
                      >
                        {RISK_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </Fieldset>

                  <Fieldset title="Impact metrics" description="Track the expected operational outcomes.">
                    <TextInput
                      id="automation-target"
                      label="Target metric"
                      optionalLabel="Optional"
                      value={formData.targetMetric}
                      onChange={(event) => onChange('targetMetric', event.target.value)}
                      error={fieldErrors.targetMetric}
                    />
                    <TextInput
                      id="automation-baseline"
                      label="Baseline metric"
                      optionalLabel="Optional"
                      value={formData.baselineMetric}
                      onChange={(event) => onChange('baselineMetric', event.target.value)}
                      error={fieldErrors.baselineMetric}
                    />
                    <TextInput
                      id="automation-forecast"
                      label="Forecast metric"
                      optionalLabel="Optional"
                      value={formData.forecastMetric}
                      onChange={(event) => onChange('forecastMetric', event.target.value)}
                      error={fieldErrors.forecastMetric}
                    />
                    <TextInput
                      id="automation-savings"
                      label="Estimated savings"
                      optionalLabel="Optional"
                      type="number"
                      value={formData.estimatedSavings}
                      onChange={(event) => onChange('estimatedSavings', event.target.value)}
                      error={fieldErrors.estimatedSavings}
                    />
                    <TextInput
                      id="automation-currency"
                      label="Savings currency"
                      optionalLabel="Optional"
                      value={formData.savingsCurrency}
                      onChange={(event) => onChange('savingsCurrency', event.target.value.toUpperCase())}
                      error={fieldErrors.savingsCurrency}
                    />
                    <TextInput
                      id="automation-readiness"
                      label="Readiness score"
                      type="number"
                      value={formData.readinessScore}
                      onChange={(event) => onChange('readinessScore', Number(event.target.value))}
                      error={fieldErrors.readinessScore}
                    />
                    <TextInput
                      id="automation-expected-launch"
                      label="Expected launch"
                      type="date"
                      value={formData.expectedLaunchAt}
                      onChange={(event) => onChange('expectedLaunchAt', event.target.value)}
                      error={fieldErrors.expectedLaunchAt}
                    />
                    <TextInput
                      id="automation-next-milestone"
                      label="Next milestone"
                      type="date"
                      value={formData.nextMilestoneOn}
                      onChange={(event) => onChange('nextMilestoneOn', event.target.value)}
                      error={fieldErrors.nextMilestoneOn}
                    />
                    <TextInput
                      id="automation-last-reviewed"
                      label="Last reviewed"
                      type="date"
                      value={formData.lastReviewedAt}
                      onChange={(event) => onChange('lastReviewedAt', event.target.value)}
                      error={fieldErrors.lastReviewedAt}
                    />
                  </Fieldset>

                  <Fieldset title="Notes" description="Provide operational notes and context for delivery teams.">
                    <FormField id="automation-notes" label="Notes" error={fieldErrors.notes}>
                      <textarea
                        className="fx-text-input min-h-[160px]"
                        value={formData.notes}
                        onChange={(event) => onChange('notes', event.target.value)}
                      />
                    </FormField>
                  </Fieldset>

                  <fieldset className="rounded-3xl border border-accent/10 bg-white/90 p-5 shadow-inner">
                    <legend className="text-sm font-semibold uppercase tracking-widest text-primary/70">Role access</legend>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose the roles allowed to create and update this initiative. Viewing honours the role permissions matrix.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {ROLE_OPTIONS.map((option) => (
                        <Checkbox
                          key={option.value}
                          label={option.label}
                          checked={formData.allowedRoles.includes(option.value)}
                          onChange={() => onRoleToggle(option.value)}
                        />
                      ))}
                    </div>
                  </fieldset>

                  <CollectionEditor
                    title="Dependencies"
                    description="Link upstream workstreams or prerequisites."
                    items={ensureArray(formData.dependencies)}
                    onChange={(value) => onChange('dependencies', value)}
                    template={{ label: '', status: '', owner: '' }}
                    addLabel="Add dependency"
                    fields={[
                      { name: 'label', label: 'Title' },
                      { name: 'status', label: 'Status' },
                      { name: 'owner', label: 'Owner', optional: true }
                    ]}
                  />

                  <CollectionEditor
                    title="Blockers"
                    description="Highlight risks or issues impacting rollout."
                    items={ensureArray(formData.blockers)}
                    onChange={(value) => onChange('blockers', value)}
                    template={{ label: '', status: '', owner: '' }}
                    addLabel="Add blocker"
                    fields={[
                      { name: 'label', label: 'Title' },
                      { name: 'status', label: 'Status' },
                      { name: 'owner', label: 'Owner', optional: true }
                    ]}
                  />

                  <CollectionEditor
                    title="Attachments"
                    description="Link discovery docs, rollout plans, or sign-off artefacts."
                    items={ensureArray(formData.attachments)}
                    onChange={(value) => onChange('attachments', value)}
                    template={{ label: '', url: '', type: '' }}
                    addLabel="Add attachment"
                    fields={[
                      { name: 'label', label: 'Label' },
                      { name: 'url', label: 'URL' },
                      { name: 'type', label: 'Type', optional: true }
                    ]}
                  />

                  <CollectionEditor
                    title="Imagery"
                    description="Reference diagrams, dashboards, or supporting visuals."
                    items={ensureArray(formData.images)}
                    onChange={(value) => onChange('images', value)}
                    template={{ label: '', url: '' }}
                    addLabel="Add image reference"
                    fields={[
                      { name: 'label', label: 'Label' },
                      { name: 'url', label: 'URL' }
                    ]}
                  />

                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={saving}>
                      {formData.id ? 'Save changes' : 'Create initiative'}
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

AutomationBacklogFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  formData: PropTypes.object.isRequired,
  fieldErrors: PropTypes.object.isRequired,
  formError: PropTypes.string,
  saving: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRoleToggle: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

AutomationBacklogFormModal.defaultProps = {
  formError: null
};
