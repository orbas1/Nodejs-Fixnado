import PropTypes from 'prop-types';
import { Button, Card, FormField, StatusPill, TextArea, TextInput } from '../../../components/ui/index.js';
import { PLAYBOOK_STATUS_OPTIONS } from '../constants.js';
import { getOptionLabel } from '../utils.js';
import { READ_ONLY_MESSAGE } from '../constants.js';

export default function EnterprisePlaybooksCard({
  playbooks,
  playbookForm,
  editingPlaybookId,
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
          <h2 className="text-lg font-semibold text-primary">Runbooks & playbooks</h2>
          <p className="text-sm text-slate-600">
            Track programme playbooks, owners, and review cadence for enterprise delivery teams.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStartEdit(null)}
          disabled={isReadOnly}
          title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
        >
          Add playbook
        </Button>
      </div>
      {isReadOnly ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Runbooks remain locked while the enterprise is archived.
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {playbooks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No playbooks captured yet. Add runbooks to keep operations aligned across web and mobile teams.
          </p>
        ) : (
          playbooks.map((playbook) => (
            <div
              key={playbook.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-primary">{playbook.name}</p>
                <p className="text-xs text-slate-500">Owner: {playbook.owner || 'Unassigned'}</p>
                {playbook.lastReviewedAt ? (
                  <p className="text-xs text-slate-500">
                    Reviewed {new Date(playbook.lastReviewedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={playbook.status === 'approved' ? 'success' : 'info'}>
                  {getOptionLabel(PLAYBOOK_STATUS_OPTIONS, playbook.status, playbook.status)}
                </StatusPill>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStartEdit(playbook)}
                  disabled={isReadOnly}
                  title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(playbook.id)}
                  disabled={isReadOnly}
                  title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
                >
                  Remove
                </Button>
                {playbook.documentUrl ? (
                  <Button as="a" href={playbook.documentUrl} target="_blank" rel="noreferrer" size="sm" variant="ghost">
                    View
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
      {editingPlaybookId ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="text-sm font-semibold text-primary">
            {editingPlaybookId === 'new' ? 'Add new playbook' : 'Edit playbook'}
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="Playbook name"
              value={playbookForm.name}
              onChange={(event) => onFormChange('name', event.target.value)}
              disabled={isReadOnly}
            />
            <FormField id="playbook-status" label="Status">
              <select
                id="playbook-status"
                className="fx-text-input"
                value={playbookForm.status}
                onChange={(event) => onFormChange('status', event.target.value)}
                disabled={isReadOnly}
              >
                {PLAYBOOK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <TextInput
              label="Owner"
              value={playbookForm.owner}
              onChange={(event) => onFormChange('owner', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Category"
              value={playbookForm.category}
              onChange={(event) => onFormChange('category', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Document URL"
              value={playbookForm.documentUrl}
              onChange={(event) => onFormChange('documentUrl', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Last reviewed"
              type="date"
              value={playbookForm.lastReviewedAt}
              onChange={(event) => onFormChange('lastReviewedAt', event.target.value)}
              disabled={isReadOnly}
            />
            <TextArea
              label="Summary"
              rows={3}
              value={playbookForm.summary}
              onChange={(event) => onFormChange('summary', event.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={onSave} loading={saving} disabled={isReadOnly}>
              Save playbook
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

EnterprisePlaybooksCard.propTypes = {
  playbooks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      status: PropTypes.string,
      owner: PropTypes.string,
      documentUrl: PropTypes.string,
      lastReviewedAt: PropTypes.string
    })
  ).isRequired,
  playbookForm: PropTypes.object.isRequired,
  editingPlaybookId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onStartEdit: PropTypes.func.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  isReadOnly: PropTypes.bool
};

EnterprisePlaybooksCard.defaultProps = {
  editingPlaybookId: null,
  saving: false,
  isReadOnly: false
};
