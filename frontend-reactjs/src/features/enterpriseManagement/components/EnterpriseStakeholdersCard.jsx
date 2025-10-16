import PropTypes from 'prop-types';
import { Button, Card, Checkbox, StatusPill, TextArea, TextInput } from '../../../components/ui/index.js';
import { READ_ONLY_MESSAGE } from '../constants.js';

export default function EnterpriseStakeholdersCard({
  stakeholders,
  stakeholderForm,
  editingStakeholderId,
  onStartEdit,
  onFormChange,
  onSave,
  onDelete,
  onCancel,
  saving,
  isReadOnly
}) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">Stakeholders & escalation</h2>
          <p className="text-sm text-slate-600">
            Define the escalation ladder for enterprise operations, finance approvals, and compliance.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStartEdit(null)}
          disabled={isReadOnly}
          title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
        >
          Add stakeholder
        </Button>
      </div>
      {isReadOnly ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Escalation contacts remain view-only while the enterprise is archived.
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {stakeholders.length === 0 ? (
          <p className="text-sm text-slate-500">
            No stakeholders recorded. Add primary contacts to unlock escalation notifications and RBAC provisioning.
          </p>
        ) : (
          stakeholders.map((stakeholder) => (
            <div
              key={stakeholder.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-primary">{stakeholder.name}</p>
                <p className="text-xs text-slate-500">{stakeholder.role}</p>
                {stakeholder.email ? <p className="text-xs text-slate-500">{stakeholder.email}</p> : null}
                {stakeholder.escalationLevel ? (
                  <p className="text-xs text-slate-500">Escalation: {stakeholder.escalationLevel}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {stakeholder.isPrimary ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700">
                    Primary
                  </span>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStartEdit(stakeholder)}
                  disabled={isReadOnly}
                  title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(stakeholder.id)}
                  disabled={isReadOnly}
                  title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {editingStakeholderId ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="text-sm font-semibold text-primary">
            {editingStakeholderId === 'new' ? 'Add new stakeholder' : 'Edit stakeholder'}
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="Full name"
              value={stakeholderForm.name}
              onChange={(event) => onFormChange('name', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Role"
              value={stakeholderForm.role}
              onChange={(event) => onFormChange('role', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Email"
              type="email"
              value={stakeholderForm.email}
              onChange={(event) => onFormChange('email', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Phone"
              value={stakeholderForm.phone}
              onChange={(event) => onFormChange('phone', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Escalation level"
              value={stakeholderForm.escalationLevel}
              onChange={(event) => onFormChange('escalationLevel', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Avatar URL"
              value={stakeholderForm.avatarUrl}
              onChange={(event) => onFormChange('avatarUrl', event.target.value)}
              disabled={isReadOnly}
            />
            <div className="md:col-span-2">
              <Checkbox
                checked={stakeholderForm.isPrimary}
                onChange={(event) => onFormChange('isPrimary', event.target.checked)}
                disabled={isReadOnly}
              >
                Primary escalation contact
              </Checkbox>
            </div>
            <TextArea
              label="Notes"
              rows={3}
              value={stakeholderForm.notes}
              onChange={(event) => onFormChange('notes', event.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={onSave} loading={saving} disabled={isReadOnly}>
              Save stakeholder
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

EnterpriseStakeholdersCard.propTypes = {
  stakeholders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      role: PropTypes.string,
      email: PropTypes.string,
      isPrimary: PropTypes.bool,
      escalationLevel: PropTypes.string
    })
  ).isRequired,
  stakeholderForm: PropTypes.object.isRequired,
  editingStakeholderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onStartEdit: PropTypes.func.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  isReadOnly: PropTypes.bool
};

EnterpriseStakeholdersCard.defaultProps = {
  editingStakeholderId: null,
  saving: false,
  isReadOnly: false
};
