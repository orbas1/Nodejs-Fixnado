import PropTypes from 'prop-types';
import { LinkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Checkbox, SegmentedControl, TextArea, TextInput } from '../../../components/ui/index.js';
import { ensureNonEmptyList } from '../state.js';

export default function WorkspacePreferencesSection({
  workspace,
  themeOptions,
  onToggle,
  onFieldChange,
  onUpdateRole,
  onAddRole,
  onRemoveRole,
  onUpdateQuickLink,
  onAddQuickLink,
  onRemoveQuickLink
}) {
  const allowedRoles = ensureNonEmptyList(workspace.allowedAdminRoles, 'admin');

  return (
    <Card padding="lg" className="border border-amber-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-primary">
            <LinkIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
            Workspace experience & quick links
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Configure what administrators see when they sign in and which tools they can jump to quickly.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Checkbox
            label="Maintenance mode"
            description="Show the maintenance banner and restrict non-essential workflows."
            checked={workspace.maintenanceMode}
            onChange={onToggle('maintenanceMode')}
          />
          <Checkbox
            label="Enable beta features"
            description="Expose experimental widgets to roles listed below."
            checked={workspace.enableBetaFeatures}
            onChange={onToggle('enableBetaFeatures')}
          />
        </div>
        <TextArea
          label="Maintenance message"
          hint="Displayed to admins while maintenance mode is active."
          value={workspace.maintenanceMessage}
          onChange={(event) => onFieldChange('maintenanceMessage', event.target.value)}
        />
        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <TextInput
            label="Default landing page"
            value={workspace.defaultLandingPage}
            onChange={(event) => onFieldChange('defaultLandingPage', event.target.value)}
          />
          <SegmentedControl
            name="Theme preference"
            value={workspace.theme}
            options={themeOptions}
            onChange={(value) => onFieldChange('theme', value)}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Allowed admin roles</h3>
            <Button variant="ghost" size="sm" icon={PlusIcon} onClick={onAddRole}>
              Add role
            </Button>
          </div>
          <div className="space-y-3">
            {allowedRoles.map((role, index) => (
              <div key={`role-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <TextInput
                    label={`Role ${index + 1}`}
                    value={role}
                    onChange={(event) => onUpdateRole(index, event.target.value)}
                    hint={index === 0 ? 'Use canonical roles (e.g. admin, operations).' : undefined}
                  />
                </div>
                <Button variant="ghost" icon={TrashIcon} onClick={() => onRemoveRole(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Quick launch links</h3>
            <Button variant="ghost" size="sm" icon={PlusIcon} onClick={onAddQuickLink}>
              Add quick link
            </Button>
          </div>
          <div className="space-y-4">
            {workspace.quickLinks.length === 0 ? (
              <p className="text-sm text-slate-500">
                Add quick links to surface secondary consoles such as compliance reports, support tools, or feature dashboards.
              </p>
            ) : null}
            {workspace.quickLinks.map((link, index) => (
              <div key={link.id ?? `quick-link-${index}`} className="rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label="Link label"
                    value={link.label}
                    onChange={(event) => onUpdateQuickLink(index, 'label', event.target.value)}
                  />
                  <TextInput
                    label="Destination URL"
                    value={link.href}
                    onChange={(event) => onUpdateQuickLink(index, 'href', event.target.value)}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" icon={TrashIcon} onClick={() => onRemoveQuickLink(index)}>
                    Remove link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

WorkspacePreferencesSection.propTypes = {
  workspace: PropTypes.shape({
    maintenanceMode: PropTypes.bool.isRequired,
    enableBetaFeatures: PropTypes.bool.isRequired,
    maintenanceMessage: PropTypes.string.isRequired,
    defaultLandingPage: PropTypes.string.isRequired,
    theme: PropTypes.string.isRequired,
    allowedAdminRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
    quickLinks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        href: PropTypes.string
      })
    ).isRequired
  }).isRequired,
  themeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onToggle: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onUpdateRole: PropTypes.func.isRequired,
  onAddRole: PropTypes.func.isRequired,
  onRemoveRole: PropTypes.func.isRequired,
  onUpdateQuickLink: PropTypes.func.isRequired,
  onAddQuickLink: PropTypes.func.isRequired,
  onRemoveQuickLink: PropTypes.func.isRequired
};
