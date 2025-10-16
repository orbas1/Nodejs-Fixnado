import PropTypes from 'prop-types';
import { DocumentTextIcon, LinkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, TextInput } from '../../../components/ui/index.js';
import { MAX_RESOURCE_LINKS } from '../defaults.js';

function ResourcesSection({ resources, onAdd, onUpdate, onRemove }) {
  return (
    <Card className="space-y-6" padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Runbooks &amp; resource library</h2>
          <p className="mt-1 text-sm text-slate-600">
            Surface the documentation, dashboards, and tooling your responders rely on during escalations.
          </p>
        </div>
        <Button
          type="button"
          href="https://fixnado.com/docs/admin/runbooks"
          target="_blank"
          rel="noreferrer"
          variant="tertiary"
          icon={DocumentTextIcon}
          iconPosition="start"
        >
          View runbook guide
        </Button>
      </div>
      <div className="space-y-4">
        {resources.length === 0 ? (
          <p className="text-sm text-slate-600">No resources have been linked yet.</p>
        ) : (
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div
                key={`resource-${index}`}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <TextInput
                  label="Resource name"
                  value={resource.label}
                  onChange={(event) => onUpdate(index, 'label', event.target.value)}
                />
                <TextInput
                  label="URL"
                  type="url"
                  value={resource.url}
                  onChange={(event) => onUpdate(index, 'url', event.target.value)}
                  prefix={<LinkIcon aria-hidden="true" className="h-4 w-4 text-slate-400" />}
                />
                <div className="flex items-end justify-end">
                  <Button type="button" variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemove(index)}>
                    Remove link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Curate up to {MAX_RESOURCE_LINKS} critical resources for your operations team.</p>
          <Button type="button" variant="secondary" icon={PlusIcon} onClick={onAdd} disabled={resources.length >= MAX_RESOURCE_LINKS}>
            Add resource link
          </Button>
        </div>
      </div>
    </Card>
  );
}

ResourcesSection.propTypes = {
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      url: PropTypes.string
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

export default ResourcesSection;
