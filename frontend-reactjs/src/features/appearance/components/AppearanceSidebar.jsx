import PropTypes from 'prop-types';
import { Button, Card, Checkbox, StatusPill } from '../../../components/ui/index.js';
import { PaintBrushIcon, ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function FeedbackPill({ tone, message }) {
  if (!tone || !message) {
    return null;
  }
  return <StatusPill tone={tone}>{message}</StatusPill>;
}

FeedbackPill.propTypes = {
  tone: PropTypes.string,
  message: PropTypes.string
};

export default function AppearanceSidebar({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onCreateProfile,
  feedbackTone,
  feedbackMessage,
  roleChoices,
  allowedRoles,
  onToggleRole,
  onSave,
  onReset,
  onArchive,
  saving
}) {
  return (
    <aside className="space-y-6">
      <Card padding="lg" className="space-y-5 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-primary">Appearance profiles</h2>
          <p className="text-sm text-slate-600">
            Switch between saved profiles or create a new one for staged brand updates.
          </p>
          <FeedbackPill tone={feedbackTone} message={feedbackMessage} />
        </header>

        <div className="space-y-3">
          {profiles.map((profile) => {
            const isActive = selectedProfileId === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelectProfile(profile.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:border-primary/70 hover:shadow-sm ${
                  isActive ? 'border-primary/70 bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{profile.name}</span>
                  {profile.isDefault ? <StatusPill tone="info">Default</StatusPill> : null}
                </div>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{profile.description || 'No description yet'}</p>
              </button>
            );
          })}
        </div>

        <Button variant="secondary" icon={PlusIcon} className="w-full" onClick={onCreateProfile}>
          Create new profile
        </Button>
      </Card>

      <Card padding="lg" className="space-y-4 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Role access</h3>
        <p className="text-sm text-slate-600">
          Choose which dashboard roles can activate this appearance. Operations inherits provider access automatically.
        </p>
        <div className="space-y-3">
          {roleChoices.map((option) => (
            <Checkbox
              key={option.value}
              label={option.label}
              description={option.value === 'admin' ? 'Required for admin previews' : undefined}
              checked={allowedRoles.includes(option.value)}
              onChange={() => onToggleRole(option.value)}
            />
          ))}
        </div>
      </Card>

      <Card padding="lg" className="space-y-4 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Actions</h3>
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            icon={PaintBrushIcon}
            loading={saving}
            onClick={onSave}
            analyticsId="appearance_save"
          >
            Save changes
          </Button>
          <Button variant="ghost" icon={ArrowPathIcon} disabled={saving} onClick={onReset}>
            Reset form
          </Button>
          <Button variant="danger" icon={TrashIcon} disabled={saving} onClick={onArchive}>
            {selectedProfileId && selectedProfileId !== 'new' ? 'Archive profile' : 'Discard draft'}
          </Button>
        </div>
      </Card>
    </aside>
  );
}

AppearanceSidebar.propTypes = {
  profiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      isDefault: PropTypes.bool
    })
  ).isRequired,
  selectedProfileId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectProfile: PropTypes.func.isRequired,
  onCreateProfile: PropTypes.func.isRequired,
  feedbackTone: PropTypes.string,
  feedbackMessage: PropTypes.string,
  roleChoices: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleRole: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  saving: PropTypes.bool
};
