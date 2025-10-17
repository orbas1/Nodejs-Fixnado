import Modal from '../../../components/ui/Modal.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useServicemanByok } from '../ServicemanByokProvider.jsx';

export default function ConnectorDrawer() {
  const {
    showConnectorDrawer,
    connectorDraft,
    connectorSaving,
    providerOptions,
    environmentOptions,
    statusOptions,
    setConnectorDraft,
    submitConnectorDraft,
    resetConnectorDraft
  } = useServicemanByok();

  const isEditing = Boolean(connectorDraft.id);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setConnectorDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitConnectorDraft();
    } catch (caught) {
      // error handled by context
    }
  };

  return (
    <Modal
      open={showConnectorDrawer}
      onClose={resetConnectorDraft}
      title={isEditing ? 'Edit connector' : 'Register connector'}
      size="lg"
      description="Provide the provider metadata and access scopes required for this crew key."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="connector-display-name" label="Display name">
          <TextInput
            value={connectorDraft.displayName}
            onChange={handleFieldChange('displayName')}
            required
            placeholder="OpenAI metro ops"
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="connector-provider" label="Provider">
            <Select value={connectorDraft.provider} onChange={handleFieldChange('provider')}>
              {providerOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="connector-environment" label="Environment">
            <Select value={connectorDraft.environment} onChange={handleFieldChange('environment')}>
              {environmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="connector-status" label="Status">
            <Select value={connectorDraft.status} onChange={handleFieldChange('status')}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            id="connector-scopes"
            label="Scopes"
            optionalLabel="Comma separated"
            hint="Example: completion, embeddings, automations"
          >
            <TextInput
              value={connectorDraft.scopesInput}
              onChange={handleFieldChange('scopesInput')}
              placeholder="completion, automations"
            />
          </FormField>
        </div>
        {!isEditing ? (
          <FormField
            id="connector-secret"
            label="Secret value"
            hint="Stored encrypted at rest. Minimum 8 characters."
          >
            <TextInput
              value={connectorDraft.secret}
              onChange={handleFieldChange('secret')}
              type="password"
              autoComplete="off"
              required
            />
          </FormField>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Secret values are rotated from the connectors table. Use the “Rotate key” action for this connector to
            submit a new secret.
          </div>
        )}
        <FormField
          id="connector-notes"
          label="Notes"
          optionalLabel="Optional"
          hint="Visible to dispatchers and compliance reviewers."
        >
          <TextArea value={connectorDraft.notes} onChange={handleFieldChange('notes')} rows={3} />
        </FormField>
        <FormField
          id="connector-projects"
          label="Allowed projects"
          optionalLabel="Optional"
          hint="Comma separated list of project identifiers"
        >
          <TextInput
            value={connectorDraft.allowedProjects}
            onChange={handleFieldChange('allowedProjects')}
            placeholder="hospital, metro-north"
          />
        </FormField>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={resetConnectorDraft}>
            Cancel
          </Button>
          <Button type="submit" loading={connectorSaving}>
            {isEditing ? 'Save changes' : 'Create connector'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

ConnectorDrawer.propTypes = {};
