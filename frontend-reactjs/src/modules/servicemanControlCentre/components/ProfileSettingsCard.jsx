import PropTypes from 'prop-types';
import Card from '../../../components/ui/Card.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Button from '../../../components/ui/Button.jsx';
import { useServicemanByok } from '../ServicemanByokProvider.jsx';

export default function ProfileSettingsCard({ className }) {
  const {
    profileDraft,
    profileSaving,
    profileFeedback,
    profileMeta,
    handleProfileFieldChange,
    saveProfileDraft,
    error
  } = useServicemanByok();

  const disableSave =
    !profileDraft.displayName.trim() ||
    profileSaving ||
    !profileDraft.rotationPolicyDays ||
    Number.isNaN(Number.parseInt(profileDraft.rotationPolicyDays, 10));

  return (
    <Card className={className} padding="lg">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-primary">BYOK profile</h2>
          <p className="mt-1 text-sm text-slate-600">
            Configure how this serviceman team registers and rotates external secrets across integrations.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="byok-display-name" label="Profile display name">
            <TextInput
              value={profileDraft.displayName}
              onChange={(event) => handleProfileFieldChange('displayName', event.target.value)}
              placeholder="Metro North BYOK"
            />
          </FormField>
          <FormField id="byok-rotation-days" label="Rotation policy (days)" hint="Recommended between 30-90 days">
            <TextInput
              value={profileDraft.rotationPolicyDays}
              onChange={(event) => handleProfileFieldChange('rotationPolicyDays', event.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </FormField>
          <FormField id="byok-provider" label="Default provider">
            <Select
              value={profileDraft.defaultProvider}
              onChange={(event) => handleProfileFieldChange('defaultProvider', event.target.value)}
            >
              {profileMeta.providers.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="byok-environment" label="Default environment">
            <Select
              value={profileDraft.defaultEnvironment}
              onChange={(event) => handleProfileFieldChange('defaultEnvironment', event.target.value)}
            >
              {profileMeta.environments.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            id="byok-allow-self"
            label="Self provisioning"
            hint="Permit vetted crew leads to register their own integration keys."
          >
            <Checkbox
              checked={Boolean(profileDraft.allowSelfProvisioning)}
              onChange={(event) => handleProfileFieldChange('allowSelfProvisioning', event.target.checked)}
            >
              Allow crew leads to add their own keys
            </Checkbox>
          </FormField>
          <FormField
            id="byok-notes"
            label="Operational notes"
            optionalLabel="Optional"
            hint="Surface guidance for dispatchers when reviewing connectors."
          >
            <TextArea
              value={profileDraft.notes}
              onChange={(event) => handleProfileFieldChange('notes', event.target.value)}
              rows={4}
            />
          </FormField>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={saveProfileDraft} disabled={disableSave} loading={profileSaving}>
            Save profile settings
          </Button>
          {profileFeedback ? <span className="text-sm font-medium text-emerald-600">{profileFeedback}</span> : null}
          {error ? <span className="text-sm text-rose-600">{error}</span> : null}
        </div>
      </div>
    </Card>
  );
}

ProfileSettingsCard.propTypes = {
  className: PropTypes.string
};

ProfileSettingsCard.defaultProps = {
  className: undefined
};
