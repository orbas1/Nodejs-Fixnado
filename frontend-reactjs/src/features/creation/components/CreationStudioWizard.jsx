import { useEffect, useMemo, useReducer } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { CreationStudioStep, creationStudioReducer, initialCreationState, serializeDraft, validateCreationState } from '../state/creationStudioReducer.js';
import TextInput from '../../../components/ui/TextInput.jsx';
import Button from '../../../components/ui/Button.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import SegmentedControl from '../../../components/ui/SegmentedControl.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';

const pricingModels = [
  { id: 'fixed', label: 'Fixed' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'usage', label: 'Usage based' }
];

function Stepper({ step, onNavigate, saving, lastSavedAt }) {
  const items = [
    { id: CreationStudioStep.BLUEPRINT, label: 'Blueprint' },
    { id: CreationStudioStep.DETAILS, label: 'Details' },
    { id: CreationStudioStep.OPERATIONS, label: 'Operations' },
    { id: CreationStudioStep.REVIEW, label: 'Review' }
  ];

  return (
    <ol className="flex flex-col gap-3" aria-label="Creation studio steps">
      {items.map((item) => {
        const isActive = item.id === step;
        return (
          <li key={item.id}>
            <button
              type="button"
              className={clsx(
                'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition',
                isActive
                  ? 'border-primary bg-primary/10 text-primary shadow-glow'
                  : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary'
              )}
              onClick={() => onNavigate(item.id)}
            >
              <span className="font-semibold">{item.label}</span>
              {isActive && (
                <span className="text-xs font-medium uppercase tracking-wide text-primary/70">
                  Active
                </span>
              )}
            </button>
          </li>
        );
      })}
      <li className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-600">Autosave</span>
          {saving ? (
            <span className="inline-flex items-center gap-2 text-primary">
              <Spinner className="h-4 w-4" /> Saving
            </span>
          ) : (
            <span>{lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Idle'}</span>
          )}
        </div>
      </li>
    </ol>
  );
}

Stepper.propTypes = {
  step: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  lastSavedAt: PropTypes.string
};

Stepper.defaultProps = {
  lastSavedAt: null
};

function BlueprintPicker({ blueprints, selected, onSelect }) {
  if (!blueprints.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center text-sm text-slate-500">
        No blueprints available. Configure them in the operations console.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {blueprints.map((blueprint) => {
        const isSelected = blueprint.id === selected;
        return (
          <button
            key={blueprint.id}
            type="button"
            className={clsx(
              'flex h-full flex-col justify-between rounded-3xl border p-6 text-left shadow-sm transition',
              isSelected
                ? 'border-primary/70 bg-primary/5 text-primary shadow-glow'
                : 'border-slate-200 bg-white hover:border-primary/40 hover:shadow-lg'
            )}
            onClick={() => onSelect(blueprint)}
            aria-pressed={isSelected}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-primary/70">{blueprint.theme}</span>
                <span className="rounded-full border border-primary/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                  {blueprint.persona.join(', ')}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{blueprint.title}</h3>
              <p className="text-sm text-slate-600">{blueprint.description}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
              {blueprint.supportedChannels.map((channel) => (
                <span key={channel} className="rounded-full border border-slate-200 px-3 py-1">
                  {channel}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

BlueprintPicker.propTypes = {
  blueprints: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      persona: PropTypes.arrayOf(PropTypes.string).isRequired,
      supportedChannels: PropTypes.arrayOf(PropTypes.string).isRequired,
      complianceChecklist: PropTypes.arrayOf(PropTypes.string).isRequired,
      automationHints: PropTypes.arrayOf(PropTypes.string).isRequired,
      recommendedRegions: PropTypes.arrayOf(PropTypes.string).isRequired,
      defaultPricingModel: PropTypes.string,
      theme: PropTypes.string
    })
  ).isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

BlueprintPicker.defaultProps = {
  selected: null
};

function DetailsStep({ state, dispatch, onSlugValidate }) {
  useEffect(() => {
    if (!state.entityName || state.slug) {
      return;
    }
    const slug = state.entityName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
    dispatch({ type: 'updateField', payload: { field: 'slug', value: slug } });
  }, [dispatch, state.entityName, state.slug]);

  return (
    <div className="space-y-6">
      <TextInput
        label="Name"
        required
        value={state.entityName}
        error={state.validationErrors.entityName}
        onChange={(event) =>
          dispatch({ type: 'updateField', payload: { field: 'entityName', value: event.target.value } })
        }
      />
      <TextInput
        label="Slug"
        value={state.slug}
        error={state.validationErrors.slug}
        helpText="Used for storefront URLs and API references"
        onBlur={async (event) => {
          const proposed = event.target.value;
          if (!proposed) {
            return;
          }
          try {
            const result = await onSlugValidate(proposed);
            if (!result.available) {
              dispatch({
                type: 'validationFailed',
                payload: {
                  ...state.validationErrors,
                  slug: result.reason ?? 'Slug is already in use'
                }
              });
            }
          } catch (error) {
            dispatch({
              type: 'validationFailed',
              payload: {
                ...state.validationErrors,
                slug: error.message
              }
            });
          }
        }}
        onChange={(event) =>
          dispatch({ type: 'updateField', payload: { field: 'slug', value: event.target.value.toLowerCase() } })
        }
      />
      <div>
        <label className="block text-sm font-medium text-slate-700">Summary</label>
        <textarea
          rows={5}
          className={clsx(
            'mt-2 w-full rounded-3xl border bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none',
            state.validationErrors.summary ? 'border-rose-400' : 'border-slate-200'
          )}
          value={state.summary}
          onChange={(event) =>
            dispatch({ type: 'updateField', payload: { field: 'summary', value: event.target.value } })
          }
        />
        {state.validationErrors.summary ? (
          <p className="mt-2 text-xs text-rose-500">{state.validationErrors.summary}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Describe what customers will receive, the audience, and any geographic limitations.
          </p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Region</label>
          <select
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
            value={state.region}
            onChange={(event) =>
              dispatch({ type: 'updateField', payload: { field: 'region', value: event.target.value } })
            }
          >
            <option value="national">National</option>
            <option value="regional">Regional</option>
            <option value="local">Local</option>
            <option value="global">Global</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">AI assistant</label>
          <div className="mt-2 flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3">
            <Checkbox
              checked={state.aiAssistEnabled}
              onChange={(event) =>
                dispatch({ type: 'updateField', payload: { field: 'aiAssistEnabled', value: event.target.checked } })
              }
            />
            <div className="text-sm">
              <p className="font-medium text-slate-700">Enable AI copy suggestions</p>
              <p className="text-xs text-slate-500">
                Surfaces AI-generated call-to-actions, pricing copy, and compliance nudges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

DetailsStep.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  onSlugValidate: PropTypes.func.isRequired
};

function OperationsStep({ state, dispatch, blueprint }) {
  const checklist = blueprint?.complianceChecklist ?? [];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">Pricing model</label>
        <SegmentedControl
          className="mt-2"
          options={pricingModels}
          value={state.pricingModel}
          onChange={(value) => dispatch({ type: 'updateField', payload: { field: 'pricingModel', value } })}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <TextInput
          label="Price"
          value={state.pricingAmount}
          error={state.validationErrors.pricingAmount}
          onChange={(event) =>
            dispatch({ type: 'updateField', payload: { field: 'pricingAmount', value: event.target.value } })
          }
          prefix={state.billingCurrency}
        />
        <TextInput
          label="Setup fee"
          value={state.setupFee}
          onChange={(event) =>
            dispatch({ type: 'updateField', payload: { field: 'setupFee', value: event.target.value } })
          }
          prefix={state.billingCurrency}
          helpText="Optional one-time charge"
        />
        <TextInput
          label="Lead time (hours)"
          value={state.availabilityLeadHours}
          onChange={(event) =>
            dispatch({ type: 'updateField', payload: { field: 'availabilityLeadHours', value: Number(event.target.value) } })
          }
          type="number"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">Fulfilment channels</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {['marketplace', 'direct', 'partner-network', 'white-label'].map((channel) => (
            <button
              key={channel}
              type="button"
              className={clsx(
                'rounded-full border px-4 py-2 text-xs font-semibold transition',
                state.fulfilmentChannels.includes(channel)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary'
              )}
              onClick={() =>
                dispatch({ type: 'toggleArrayValue', payload: { field: 'fulfilmentChannels', value: channel } })
              }
            >
              {channel.replace('-', ' ')}
            </button>
          ))}
        </div>
        {state.validationErrors.fulfilmentChannels ? (
          <p className="mt-2 text-xs text-rose-500">{state.validationErrors.fulfilmentChannels}</p>
        ) : null}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">Compliance requirements</p>
        <div className="mt-3 space-y-3">
          {checklist.map((item) => (
            <label key={item} className="flex items-start gap-3 text-sm text-slate-600">
              <Checkbox
                checked={state.complianceChecklist.includes(item)}
                onChange={(event) =>
                  dispatch({
                    type: 'toggleArrayValue',
                    payload: { field: 'complianceChecklist', value: item, checked: event.target.checked }
                  })
                }
              />
              <span className="leading-snug">
                <span className="font-medium text-slate-700">{item}</span>
                <br />
                Ensure valid documents are uploaded before publishing.
              </span>
            </label>
          ))}
        </div>
        {state.validationErrors.complianceChecklist ? (
          <p className="mt-2 text-xs text-rose-500">{state.validationErrors.complianceChecklist}</p>
        ) : null}
      </div>
    </div>
  );
}

OperationsStep.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  blueprint: PropTypes.object
};

OperationsStep.defaultProps = {
  blueprint: null
};

function ReviewStep({ state, blueprint, onPublish, publishing }) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Launch checklist</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Blueprint: {blueprint?.title ?? 'Not selected'}</li>
          <li>Persona: {state.persona.join(', ') || 'Not defined'}</li>
          <li>Pricing: {state.billingCurrency} {state.pricingAmount} ({state.pricingModel})</li>
          <li>Fulfilment: {state.fulfilmentChannels.join(', ')}</li>
          <li>Compliance artefacts: {state.complianceChecklist.length}</li>
        </ul>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Summary preview</h3>
        <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">{state.summary || 'Add a summary above.'}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-600">
          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-slate-400">Availability window</h4>
            <p className="mt-1 text-slate-700">{state.availabilityWindow} · {state.availabilityLeadHours}h lead</p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-[0.3em] text-slate-400">Automation</h4>
            <p className="mt-1 text-slate-700">
              {state.aiAssistEnabled ? 'AI copy + workflow automation enabled' : 'Manual fulfilment only'}
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Publishing triggers automated QA, audit log entry, and storefront refresh.
        </div>
        <Button
          variant="primary"
          onClick={onPublish}
          disabled={publishing}
        >
          {publishing ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-4 w-4" /> Publishing
            </span>
          ) : (
            'Publish to marketplace'
          )}
        </Button>
      </div>
    </div>
  );
}

ReviewStep.propTypes = {
  state: PropTypes.object.isRequired,
  blueprint: PropTypes.object,
  onPublish: PropTypes.func.isRequired,
  publishing: PropTypes.bool.isRequired
};

ReviewStep.defaultProps = {
  blueprint: null
};

export default function CreationStudioWizard({
  blueprints,
  loading,
  onSaveDraft,
  onPublish,
  onSlugValidate
}) {
  const [state, dispatch] = useReducer(creationStudioReducer, initialCreationState);

  const selectedBlueprint = useMemo(
    () => blueprints.find((entry) => entry.id === state.blueprintId) ?? null,
    [blueprints, state.blueprintId]
  );

  useEffect(() => {
    if (!state.blueprintId) {
      return;
    }

    const serialized = serializeDraft(state);
    const controller = new AbortController();
    dispatch({ type: 'saving' });
    const timeout = setTimeout(async () => {
      try {
        await onSaveDraft(serialized, { signal: controller.signal });
        dispatch({ type: 'saved', payload: { timestamp: new Date().toISOString() } });
      } catch (error) {
        console.error('[CreationStudio] Autosave failed', error);
        dispatch({ type: 'saved' });
      }
    }, 1200);

    return () => {
      controller.abort('replaced');
      clearTimeout(timeout);
    };
  }, [onSaveDraft, state]);

  const handleNext = () => {
    if (state.step === CreationStudioStep.REVIEW) {
      return;
    }
    const nextOrder = {
      [CreationStudioStep.BLUEPRINT]: CreationStudioStep.DETAILS,
      [CreationStudioStep.DETAILS]: CreationStudioStep.OPERATIONS,
      [CreationStudioStep.OPERATIONS]: CreationStudioStep.REVIEW
    };
    dispatch({ type: 'goToStep', payload: { step: nextOrder[state.step] } });
  };

  const handlePrevious = () => {
    if (state.step === CreationStudioStep.BLUEPRINT) {
      return;
    }
    const previousOrder = {
      [CreationStudioStep.REVIEW]: CreationStudioStep.OPERATIONS,
      [CreationStudioStep.OPERATIONS]: CreationStudioStep.DETAILS,
      [CreationStudioStep.DETAILS]: CreationStudioStep.BLUEPRINT
    };
    dispatch({ type: 'goToStep', payload: { step: previousOrder[state.step] } });
  };

  const handlePublish = async () => {
    const errors = validateCreationState(state, selectedBlueprint);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'validationFailed', payload: errors });
      dispatch({ type: 'goToStep', payload: { step: CreationStudioStep.DETAILS } });
      return;
    }

    try {
      dispatch({ type: 'publish:start' });
      await onPublish(serializeDraft(state));
      dispatch({ type: 'publish:success' });
    } catch (error) {
      console.error('[CreationStudio] Publish failed', error);
      dispatch({ type: 'publish:error' });
      dispatch({
        type: 'validationFailed',
        payload: {
          ...state.validationErrors,
          publish: error.message
        }
      });
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[260px,1fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <Stepper
          step={state.step}
          onNavigate={(nextStep) => dispatch({ type: 'goToStep', payload: { step: nextStep } })}
          saving={state.saving}
          lastSavedAt={state.lastSavedAt}
        />
      </aside>
      <section className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Creation studio</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {state.step === CreationStudioStep.BLUEPRINT && 'Choose a blueprint'}
              {state.step === CreationStudioStep.DETAILS && 'Describe the experience'}
              {state.step === CreationStudioStep.OPERATIONS && 'Configure operations'}
              {state.step === CreationStudioStep.REVIEW && 'Review & publish'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handlePrevious} disabled={state.step === CreationStudioStep.BLUEPRINT}>
              Back
            </Button>
            {state.step !== CreationStudioStep.REVIEW ? (
              <Button
                variant="secondary"
                onClick={() => {
                  if (state.step === CreationStudioStep.BLUEPRINT && !state.blueprintId) {
                    dispatch({
                      type: 'validationFailed',
                      payload: { blueprintId: 'Select a blueprint to continue.' }
                    });
                    return;
                  }
                  handleNext();
                }}
                disabled={loading}
              >
                Continue
              </Button>
            ) : null}
          </div>
        </div>

        {state.validationErrors.blueprintId && state.step === CreationStudioStep.BLUEPRINT ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.validationErrors.blueprintId}
          </div>
        ) : null}
        {state.validationErrors.publish ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.validationErrors.publish}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : null}

        {!loading && state.step === CreationStudioStep.BLUEPRINT ? (
          <BlueprintPicker
            blueprints={blueprints}
            selected={state.blueprintId}
            onSelect={(blueprint) => dispatch({ type: 'selectBlueprint', payload: blueprint })}
          />
        ) : null}

        {!loading && state.step === CreationStudioStep.DETAILS ? (
          <DetailsStep state={state} dispatch={dispatch} onSlugValidate={onSlugValidate} />
        ) : null}

        {!loading && state.step === CreationStudioStep.OPERATIONS ? (
          <OperationsStep state={state} dispatch={dispatch} blueprint={selectedBlueprint} />
        ) : null}

        {!loading && state.step === CreationStudioStep.REVIEW ? (
          <ReviewStep
            state={state}
            blueprint={selectedBlueprint}
            onPublish={handlePublish}
            publishing={state.publishing}
          />
        ) : null}
      </section>
    </div>
  );
}

CreationStudioWizard.propTypes = {
  blueprints: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onSaveDraft: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onSlugValidate: PropTypes.func.isRequired
};

CreationStudioWizard.defaultProps = {
  loading: false
};
