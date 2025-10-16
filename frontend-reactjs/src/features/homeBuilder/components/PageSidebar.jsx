import PropTypes from 'prop-types';
import { PlusIcon, ArrowPathIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Button, Card, StatusPill } from '../../../components/ui/index.js';
import { STATUS_TONE } from '../constants.js';

function formatDateTime(value) {
  if (!value) {
    return 'Never';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Never';
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function PageSidebar({
  pages,
  activePageId,
  loading,
  refreshing,
  duplicatingPageId,
  onSelect,
  onCreate,
  onDuplicate
}) {
  const handleCreateClick = () => {
    onCreate?.();
  };

  return (
    <aside className="space-y-4">
      <Card className="sticky top-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Marketing home pages</h2>
            <p className="text-sm text-slate-500">Select a page to edit layouts, sections, and components.</p>
          </div>
          <Button
            type="button"
            onClick={handleCreateClick}
            icon={PlusIcon}
            variant="secondary"
            size="sm"
            disabled={loading || refreshing}
          >
            New page
          </Button>
        </div>

        <ul className="space-y-3" aria-label="Available home pages">
          {pages.map((page) => {
            const isActive = page.id === activePageId;
            const tone = STATUS_TONE[page.status] ?? 'neutral';
            const isDuplicating = duplicatingPageId === page.id;
            const containerClasses = clsx(
              'group rounded-2xl border transition focus-within:ring-2 focus-within:ring-primary',
              isActive
                ? 'border-primary bg-primary/5 text-primary shadow-glow'
                : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary'
            );
            return (
              <li key={page.id}>
                <div className={containerClasses}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(page.id)}
                    className="flex w-full flex-col gap-3 rounded-2xl px-4 py-4 text-left focus-visible:outline-none"
                    aria-pressed={isActive}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-lg text-inherit">{page.name}</p>
                        <p className="text-xs text-slate-500 group-hover:text-slate-600">/{page.slug}</p>
                      </div>
                      <StatusPill tone={tone}>{page.status}</StatusPill>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                      <div>
                        <dt className="font-semibold text-slate-600">Sections</dt>
                        <dd>{page.sectionsCount ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-600">Components</dt>
                        <dd>{page.componentsCount ?? 0}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-semibold text-slate-600">Updated</dt>
                        <dd>{formatDateTime(page.updatedAt)}</dd>
                      </div>
                    </dl>
                  </button>
                  <div className="flex justify-end gap-2 px-4 pb-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Squares2X2Icon}
                      onClick={() => onDuplicate?.(page.id)}
                      disabled={loading || refreshing || isDuplicating}
                      loading={isDuplicating}
                    >
                      Duplicate
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
          {!pages.length && !loading && (
            <li className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
              No pages created yet. Use the <span className="font-semibold text-primary">New page</span> button to get started.
            </li>
          )}
        </ul>

        {refreshing && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            Syncing latest changes…
          </div>
        )}
      </Card>
    </aside>
  );
}

PageSidebar.propTypes = {
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      sectionsCount: PropTypes.number,
      componentsCount: PropTypes.number,
      updatedAt: PropTypes.string,
      publishedAt: PropTypes.string
    })
  ),
  activePageId: PropTypes.string,
  loading: PropTypes.bool,
  refreshing: PropTypes.bool,
  duplicatingPageId: PropTypes.string,
  onSelect: PropTypes.func,
  onCreate: PropTypes.func,
  onDuplicate: PropTypes.func
};

PageSidebar.defaultProps = {
  pages: [],
  activePageId: undefined,
  loading: false,
  refreshing: false,
  duplicatingPageId: undefined,
  onSelect: undefined,
  onCreate: undefined,
  onDuplicate: undefined
};
