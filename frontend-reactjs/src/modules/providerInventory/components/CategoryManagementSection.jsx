import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { useProviderInventory } from '../ProviderInventoryProvider.jsx';

export default function CategoryManagementSection() {
  const {
    data: { categories, categoriesLoading, categoryForm, categorySaving, categoryFeedback, categoryError },
    actions: {
      loadCategories,
      handleCategoryFieldChange,
      handleCategoryEdit,
      resetCategoryForm,
      handleCategorySubmit,
      handleCategoryDelete
    }
  } = useProviderInventory();

  return (
    <Card padding="lg" className="space-y-6 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Category management</h2>
          <p className="text-sm text-slate-600">
            Organise tools and materials into navigable categories. Categories sync across marketplace listings and
            analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={resetCategoryForm}>
            New category
          </Button>
          <Button type="button" variant="ghost" size="sm" icon={ArrowPathIcon} onClick={() => loadCategories()}>
            Refresh categories
          </Button>
        </div>
      </header>

      {categoryFeedback ? <StatusPill tone="success">{categoryFeedback}</StatusPill> : null}
      {categoryError ? <StatusPill tone="danger">{categoryError}</StatusPill> : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <section className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100/80">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Sort order</th>
                    <th className="px-4 py-3 font-semibold text-right text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoriesLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        <Spinner className="h-4 w-4 text-primary" />
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No categories defined yet.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.id} className="bg-white/70">
                        <td className="px-4 py-3 font-medium text-slate-800">{category.name}</td>
                        <td className="px-4 py-3 text-slate-600">{category.description || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{category.sortOrder ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" size="xs" variant="secondary" onClick={() => handleCategoryEdit(category)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              icon={TrashIcon}
                              iconPosition="start"
                              onClick={() => handleCategoryDelete(category.id)}
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
            <h3 className="text-lg font-semibold text-primary">{categoryForm.id ? 'Edit category' : 'Create category'}</h3>
            <p className="text-xs text-slate-500">Categories power search filters and default storefront groupings.</p>
          </header>
          <TextInput
            label="Name"
            value={categoryForm.name}
            onChange={(event) => handleCategoryFieldChange('name', event.target.value)}
            required
          />
          <Textarea
            label="Description"
            minRows={3}
            value={categoryForm.description}
            onChange={(event) => handleCategoryFieldChange('description', event.target.value)}
          />
          <TextInput
            label="Sort order"
            type="number"
            value={categoryForm.sortOrder}
            onChange={(event) => handleCategoryFieldChange('sortOrder', event.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" size="sm" onClick={handleCategorySubmit} disabled={categorySaving}>
              {categorySaving ? 'Saving…' : 'Save category'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetCategoryForm}>
              Cancel
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}
