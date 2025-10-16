import PropTypes from 'prop-types';
import {
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  UserCircleIcon,
  TagIcon,
  PaperClipIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button.jsx';

const statusBadgeClasses = {
  open: 'border-slate-200 bg-slate-100 text-slate-700',
  in_progress: 'border-sky-200 bg-sky-50 text-sky-700',
  blocked: 'border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
  default: 'border-slate-200 bg-white text-slate-600'
};

const typeBadgeClasses = {
  note: 'bg-slate-100 text-slate-700 border-slate-200',
  status_update: 'bg-sky-100 text-sky-700 border-sky-200',
  milestone: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  handoff: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  document: 'bg-amber-100 text-amber-700 border-amber-200',
  default: 'bg-slate-100 text-slate-600 border-slate-200'
};

const actorBadgeClasses = {
  customer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  provider: 'bg-primary/10 text-primary border-primary/20',
  operations: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  support: 'bg-sky-50 text-sky-700 border-sky-200',
  finance: 'bg-amber-50 text-amber-700 border-amber-200',
  system: 'bg-slate-100 text-slate-600 border-slate-200',
  default: 'bg-slate-100 text-slate-600 border-slate-200'
};

const formatDateHeading = (iso) => {
  if (!iso) {
    return 'Undated';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Undated';
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (iso) => {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatRelative = (iso) => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'moments ago';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const renderBadge = (value, lookup, classes, fallback = 'default') => {
  const resolved = lookup.get(value)?.label ?? value;
  const tone = classes[value] ?? classes[fallback] ?? classes.default;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${tone}`}>
      {resolved}
    </span>
  );
};

const AttachmentPreview = ({ attachment }) => {
  const preview = attachment.previewImage;
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm text-primary shadow-sm transition hover:border-primary hover:bg-primary/5"
    >
      {preview ? (
        <img
          src={preview}
          alt=""
          className="h-12 w-12 rounded-xl object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <PaperClipIcon aria-hidden="true" className="h-5 w-5 text-primary/70" />
      )}
      <div className="flex-1">
        <p className="font-medium text-primary group-hover:underline">{attachment.label ?? attachment.url}</p>
        {attachment.description ? <p className="text-xs text-slate-500">{attachment.description}</p> : null}
        <p className="flex items-center gap-1 text-xs text-slate-400">
          <DocumentTextIcon aria-hidden="true" className="h-4 w-4" />
          {attachment.type}
        </p>
      </div>
      <ArrowTopRightOnSquareIcon aria-hidden="true" className="h-4 w-4 text-primary/60" />
    </a>
  );
};

AttachmentPreview.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    url: PropTypes.string.isRequired,
    type: PropTypes.string,
    description: PropTypes.string,
    previewImage: PropTypes.string
  }).isRequired
};

function OrderHistoryTimeline({
  entries,
  entryTypeLookup,
  statusLookup,
  actorRoleLookup,
  canManage,
  onEdit,
  onDelete,
  emptyState,
  header
}) {
  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-secondary/60 p-8 text-center text-sm text-slate-600">
        {emptyState ?? 'No history entries captured yet. Add your first note to begin the audit trail.'}
      </div>
    );
  }

  const groups = entries.reduce((acc, entry) => {
    const key = formatDateHeading(entry.occurredAt ?? entry.createdAt ?? entry.updatedAt);
    acc[key] = acc[key] ?? [];
    acc[key].push(entry);
    return acc;
  }, {});

  const dateKeys = Object.keys(groups);

  return (
    <div className="space-y-8">
      {header ?? null}
      {dateKeys.map((dateKey) => (
        <div key={dateKey} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/70">{dateKey}</h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-primary/20 via-primary/10 to-transparent" />
          </div>
          <div className="space-y-6">
            {groups[dateKey]
              .slice()
              .sort((a, b) => new Date(b.occurredAt ?? b.createdAt ?? 0) - new Date(a.occurredAt ?? a.createdAt ?? 0))
              .map((entry) => {
                const statusBadge = renderBadge(entry.status, statusLookup, statusBadgeClasses);
                const typeBadge = renderBadge(entry.entryType, entryTypeLookup, typeBadgeClasses);
                const actorBadge = renderBadge(entry.actorRole, actorRoleLookup, actorBadgeClasses);

                const relative = formatRelative(entry.updatedAt ?? entry.createdAt ?? entry.occurredAt);

                return (
                  <article key={entry.id} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon aria-hidden="true" className="h-4 w-4" />
                            {formatTime(entry.occurredAt ?? entry.createdAt)}
                          </span>
                          {relative ? <span className="text-slate-400">· {relative}</span> : null}
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">{entry.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          {typeBadge}
                          {statusBadge}
                          {actorBadge}
                          {entry.actorId ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              <UserCircleIcon aria-hidden="true" className="h-4 w-4" />
                              {entry.actorId}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {canManage ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={PencilSquareIcon}
                            onClick={() => onEdit?.(entry)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            icon={TrashIcon}
                            onClick={() => onDelete?.(entry)}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {entry.summary ? (
                      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{entry.summary}</p>
                    ) : null}

                    {Array.isArray(entry.attachments) && entry.attachments.length > 0 ? (
                      <div className="mt-5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {entry.attachments.map((attachment) => (
                            <AttachmentPreview key={attachment.id ?? attachment.url} attachment={attachment} />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {entry.meta && typeof entry.meta === 'object' && Object.keys(entry.meta).length > 0 ? (
                      <div className="mt-5 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</p>
                        <dl className="flex flex-wrap gap-2">
                          {Object.entries(entry.meta).map(([key, value]) => (
                            <div
                              key={`${entry.id}-${key}`}
                              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary"
                            >
                              <TagIcon aria-hidden="true" className="h-4 w-4" />
                              <span className="font-semibold uppercase tracking-wide">{key}</span>
                              <span className="text-primary/80">{String(value)}</span>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ) : null}
                  </article>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

OrderHistoryTimeline.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string,
      summary: PropTypes.string,
      entryType: PropTypes.string,
      actorRole: PropTypes.string,
      actorId: PropTypes.string,
      occurredAt: PropTypes.string,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string,
      attachments: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string,
          url: PropTypes.string,
          type: PropTypes.string,
          description: PropTypes.string,
          previewImage: PropTypes.string
        })
      ),
      meta: PropTypes.object
    })
  ),
  entryTypeLookup: PropTypes.instanceOf(Map),
  statusLookup: PropTypes.instanceOf(Map),
  actorRoleLookup: PropTypes.instanceOf(Map),
  canManage: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  emptyState: PropTypes.node,
  header: PropTypes.node
};

OrderHistoryTimeline.defaultProps = {
  entries: [],
  entryTypeLookup: new Map(),
  statusLookup: new Map(),
  actorRoleLookup: new Map(),
  canManage: false,
  onEdit: undefined,
  onDelete: undefined,
  emptyState: null,
  header: null
};

export default OrderHistoryTimeline;
