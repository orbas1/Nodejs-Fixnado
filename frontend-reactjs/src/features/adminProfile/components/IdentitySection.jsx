import PropTypes from 'prop-types';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Card, FormField, StatusPill, TextInput } from '../../../components/ui/index.js';

function IdentitySection({ profile, meta, onProfileChange, onTextareaChange, feedback }) {
  return (
    <div className="space-y-6">
      {feedback?.error ? (
        <StatusPill tone="danger">{feedback.error}</StatusPill>
      ) : null}
      {feedback?.success ? (
        <StatusPill tone="success">{feedback.success}</StatusPill>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="space-y-6" padding="lg">
          <div>
            <h2 className="text-xl font-semibold text-primary">Identity &amp; presence</h2>
            <p className="mt-1 text-sm text-slate-600">
              Control how your details appear in audit trails, escalations, and shared dashboards.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="First name" value={profile.firstName} onChange={(event) => onProfileChange('firstName', event.target.value)} required />
            <TextInput label="Last name" value={profile.lastName} onChange={(event) => onProfileChange('lastName', event.target.value)} required />
            <TextInput label="Display name" value={profile.displayName} onChange={(event) => onProfileChange('displayName', event.target.value)} required />
            <TextInput label="Job title" value={profile.jobTitle} onChange={(event) => onProfileChange('jobTitle', event.target.value)} />
            <TextInput label="Department" value={profile.department} onChange={(event) => onProfileChange('department', event.target.value)} />
            <TextInput label="Pronouns" value={profile.pronouns} onChange={(event) => onProfileChange('pronouns', event.target.value)} />
          </div>
          <FormField id="admin-profile-bio" label="About you" hint="Visible to internal operators when reviewing audit trails.">
            <textarea
              id="admin-profile-bio"
              className="fx-text-input min-h-[140px]"
              value={profile.bio}
              onChange={(event) => onTextareaChange('bio', event.target.value)}
              maxLength={2000}
            />
          </FormField>
        </Card>

        <Card className="space-y-4" padding="lg">
          <div>
            <h3 className="text-sm font-semibold text-primary">Profile preview</h3>
            <p className="mt-1 text-sm text-slate-600">This avatar and summary appear across admin tools.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Admin avatar preview" className="h-full w-full object-cover" />
              ) : (
                <UserCircleIcon className="h-16 w-16 text-slate-400" aria-hidden="true" />
              )}
            </div>
            <TextInput
              label="Avatar URL"
              value={profile.avatarUrl}
              onChange={(event) => onProfileChange('avatarUrl', event.target.value)}
              placeholder="https://cdn.fixnado.com/avatar.jpg"
            />
          </div>
          {Array.isArray(meta) && meta.length > 0 ? (
            <dl className="grid gap-3 text-sm text-slate-600">
              {meta.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-primary">{item.value}</dd>
                  {item.caption ? <p className="mt-2 text-xs text-slate-500">{item.caption}</p> : null}
                </div>
              ))}
            </dl>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

IdentitySection.propTypes = {
  profile: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    displayName: PropTypes.string,
    jobTitle: PropTypes.string,
    department: PropTypes.string,
    pronouns: PropTypes.string,
    bio: PropTypes.string,
    avatarUrl: PropTypes.string
  }).isRequired,
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      caption: PropTypes.string
    })
  ),
  onProfileChange: PropTypes.func.isRequired,
  onTextareaChange: PropTypes.func.isRequired,
  feedback: PropTypes.shape({
    error: PropTypes.string,
    success: PropTypes.string
  })
};

IdentitySection.defaultProps = {
  meta: [],
  feedback: null
};

export default IdentitySection;
