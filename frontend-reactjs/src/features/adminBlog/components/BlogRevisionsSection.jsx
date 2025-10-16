import PropTypes from 'prop-types';
import Spinner from '../../../components/ui/Spinner.jsx';

const BlogRevisionsSection = ({
  editingPostId,
  revisions,
  revisionsLoading,
  revisionError,
  onRefresh,
  onOpenTimeline,
  onRestore,
  restoringRevisionId
}) => (
  <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <h3 className="text-lg font-semibold text-primary">Revision history</h3>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent disabled:opacity-60"
          disabled={!editingPostId || revisionsLoading}
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={onOpenTimeline}
          className="rounded-full border border-primary/20 px-3 py-1 font-semibold text-primary hover:border-primary"
          disabled={!editingPostId}
        >
          Open timeline
        </button>
      </div>
    </div>

    {!editingPostId ? (
      <p className="mt-4 text-sm text-primary/60">Select an existing post to review captured revisions.</p>
    ) : null}

    {revisionError ? <p className="mt-3 text-xs text-rose-600">{revisionError}</p> : null}

    {revisionsLoading ? (
      <div className="mt-4 flex items-center gap-2 text-primary">
        <Spinner className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.3em]">Loading revisions…</span>
      </div>
    ) : null}

    {editingPostId && !revisionsLoading ? (
      <ul className="mt-4 space-y-3">
        {revisions.length === 0 ? (
          <li className="text-xs text-primary/50">No revisions captured yet for this post.</li>
        ) : null}
        {revisions.map((revision) => {
          const actorName = revision.recordedBy
            ? `${revision.recordedBy.firstName ?? ''} ${revision.recordedBy.lastName ?? ''}`.trim() ||
              revision.recordedBy.email ||
              'Administrator'
            : 'System';
          const restoring = restoringRevisionId === revision.id;
          return (
            <li key={revision.id} className="rounded-2xl border border-white/40 bg-white/80 p-4 text-sm text-primary">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div className="text-xs uppercase tracking-[0.3em] text-primary/60">
                  {revision.action} • {revision.status}
                </div>
                <div className="text-xs text-primary/50">
                  {revision.createdAt ? new Date(revision.createdAt).toLocaleString() : '—'}
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-primary">{revision.title}</p>
              <p className="text-xs text-primary/60">By {actorName} • slug /{revision.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onRestore(revision.id)}
                  className="rounded-full border border-primary/20 px-3 py-1 font-semibold text-primary hover:border-primary disabled:opacity-60"
                  disabled={!editingPostId || restoring}
                >
                  {restoring ? 'Restoring…' : 'Restore this version'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    ) : null}
  </div>
);

BlogRevisionsSection.propTypes = {
  editingPostId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  revisions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      slug: PropTypes.string,
      action: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string,
      recordedBy: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string
      })
    })
  ).isRequired,
  revisionsLoading: PropTypes.bool.isRequired,
  revisionError: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  onOpenTimeline: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  restoringRevisionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

BlogRevisionsSection.defaultProps = {
  editingPostId: null,
  revisionError: null,
  restoringRevisionId: null
};

export default BlogRevisionsSection;
