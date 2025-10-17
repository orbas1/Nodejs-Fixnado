import { ArrowPathIcon, PlusIcon, TagIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { useProviderInventory } from '../ProviderInventoryProvider.jsx';

export default function TagManagementSection() {
  const {
    data: { tags, tagsLoading, tagForm, tagSaving, tagFeedback, tagError },
    actions: { loadTags, handleTagFieldChange, handleTagEdit, resetTagForm, handleTagSubmit, handleTagDelete }
  } = useProviderInventory();

  return (
    <Card padding="lg" className="space-y-6 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Word tagging</h2>
          <p className="text-sm text-slate-600">
            Curate a dictionary of descriptive tags. Tags help operations teams surface equipment by use-case, compliance
            flag, or marketing angle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={resetTagForm}>
            New tag
          </Button>
          <Button type="button" variant="ghost" size="sm" icon={ArrowPathIcon} onClick={() => loadTags()}>
            Refresh tags
          </Button>
        </div>
      </header>

      {tagFeedback ? <StatusPill tone="success">{tagFeedback}</StatusPill> : null}
      {tagError ? <StatusPill tone="danger">{tagError}</StatusPill> : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <section className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100/80">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Tag</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-right text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tagsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        <Spinner className="h-4 w-4 text-primary" />
                      </td>
                    </tr>
                  ) : tags.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No tags captured yet.
                      </td>
                    </tr>
                  ) : (
                    tags.map((tag) => (
                      <tr key={tag.id} className="bg-white/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200"
                              style={{ backgroundColor: tag.color || undefined }}
                            >
                              <TagIcon className="h-4 w-4 text-slate-600" />
                            </span>
                            <span className="font-medium text-slate-800">{tag.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{tag.description || '—'}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone={tag.status === 'active' ? 'success' : 'warning'}>{tag.status}</StatusPill>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" size="xs" variant="secondary" onClick={() => handleTagEdit(tag)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              icon={TrashIcon}
                              iconPosition="start"
                              onClick={() => handleTagDelete(tag.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <header>
            <h3 className="text-lg font-semibold text-primary">{tagForm.id ? 'Edit tag' : 'Create tag'}</h3>
            <p className="text-xs text-slate-500">Keep tag names short and action oriented for fast filtering.</p>
          </header>
          <TextInput
            label="Tag name"
            value={tagForm.name}
            onChange={(event) => handleTagFieldChange('name', event.target.value)}
            required
          />
          <TextInput
            label="Hex colour"
            placeholder="#2563eb"
            value={tagForm.color}
            onChange={(event) => handleTagFieldChange('color', event.target.value)}
          />
          <Textarea
            label="Description"
            minRows={3}
            value={tagForm.description}
            onChange={(event) => handleTagFieldChange('description', event.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" size="sm" onClick={handleTagSubmit} disabled={tagSaving}>
              {tagSaving ? 'Saving…' : 'Save tag'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetTagForm}>
              Cancel
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}
