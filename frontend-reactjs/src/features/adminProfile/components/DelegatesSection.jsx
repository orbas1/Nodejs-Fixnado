import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, TextInput } from '../../../components/ui/index.js';
import { MAX_DELEGATES } from '../defaults.js';

function DelegatesSection({ delegates, onAdd, onUpdate, onRemove }) {
  return (
    <Card className="space-y-6" padding="lg">
      <div>
        <h2 className="text-xl font-semibold text-primary">Delegate access &amp; escalation backups</h2>
        <p className="mt-1 text-sm text-slate-600">
          Provision trusted teammates who can action escalations or receive mirrored notifications when you are offline.
        </p>
      </div>
      <div className="space-y-4">
        {delegates.length === 0 ? (
          <p className="text-sm text-slate-600">No delegates configured yet.</p>
        ) : (
          <div className="space-y-4">
            {delegates.map((delegate, index) => (
              <div
                key={`delegate-${index}`}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <TextInput label="Name" value={delegate.name} onChange={(event) => onUpdate(index, 'name', event.target.value)} />
                <TextInput
                  label="Email"
                  type="email"
                  value={delegate.email}
                  onChange={(event) => onUpdate(index, 'email', event.target.value)}
                  required
                />
                <div className="flex items-end justify-between gap-2 md:flex-col md:items-stretch">
                  <TextInput label="Role" value={delegate.role} onChange={(event) => onUpdate(index, 'role', event.target.value)} />
                  <Button type="button" variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemove(index)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Up to {MAX_DELEGATES} trusted delegates can be configured.</p>
          <Button type="button" variant="secondary" icon={PlusIcon} onClick={onAdd} disabled={delegates.length >= MAX_DELEGATES}>
            Add delegate
          </Button>
        </div>
      </div>
    </Card>
  );
}

DelegatesSection.propTypes = {
  delegates: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      role: PropTypes.string
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

export default DelegatesSection;
