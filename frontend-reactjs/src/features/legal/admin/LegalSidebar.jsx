import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { DocumentCheckIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/index.js';

export default function LegalSidebar({
  detail,
  timeline,
  versionHistory,
  documents,
  selectedSlug,
  formatDateTime
}) {
  return (
    <aside className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <DocumentCheckIcon className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-primary">Current status</h3>
            <p className="text-xs text-slate-500">Snapshot of the live and draft states.</p>
          </div>
        </div>
        <dl className="space-y-3 text-sm text-slate-600">
          <div>
            <dt className="font-semibold text-primary">Published version</dt>
            <dd className="mt-1">
              {detail?.currentVersion
                ? `v${detail.currentVersion.version} • ${formatDateTime(detail.currentVersion.publishedAt)}`
                : 'Not published'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">Draft</dt>
            <dd className="mt-1">
              {detail?.draftVersion
                ? `v${detail.draftVersion.version} • updated ${formatDateTime(detail.draftVersion.updatedAt)}`
                : 'No draft in progress'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">Next effective date</dt>
            <dd className="mt-1">
              {detail?.draftVersion?.effectiveAt
                ? formatDateTime(detail.draftVersion.effectiveAt)
                : 'Not scheduled'}
            </dd>
          </div>
        </dl>
      </Card>

      <Card padding="lg" className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Recent activity</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">No recorded activity yet for this document.</p>
        ) : (
          <ul className="space-y-3 text-sm text-slate-600">
            {timeline.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-200 bg-white/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">
                      v{entry.version} • {entry.status === 'draft' ? 'Draft updated' : 'Published'}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(entry.updatedAt)}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{entry.actor || 'System'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="lg" className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Version history</h3>
        {versionHistory.length === 0 ? (
          <p className="text-sm text-slate-500">No versions recorded yet. Save a draft to begin tracking changes.</p>
        ) : (
          <ul className="space-y-3 text-sm text-slate-600">
            {versionHistory.map((version) => (
              <li key={version.id} className="rounded-xl border border-slate-200 bg-white/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-primary">v{version.version}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-400">{version.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Updated {formatDateTime(version.updatedAt || version.createdAt)}
                </p>
                {version.changeNotes ? (
                  <p className="mt-2 text-xs text-slate-500">{version.changeNotes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="lg" className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Other documents</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          {documents.map((doc) => (
            <li key={doc.slug} className="rounded-xl border border-slate-200 bg-white/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.statusLabel}</p>
                </div>
                {doc.slug === selectedSlug ? (
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">Viewing</span>
                ) : (
                  <Link
                    to={`/admin/legal/${doc.slug}`}
                    className="text-xs font-semibold text-accent underline decoration-dotted underline-offset-2"
                  >
                    Manage
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </aside>
  );
}

LegalSidebar.propTypes = {
  detail: PropTypes.shape({
    currentVersion: PropTypes.shape({
      version: PropTypes.number,
      publishedAt: PropTypes.string
    }),
    draftVersion: PropTypes.shape({
      version: PropTypes.number,
      updatedAt: PropTypes.string,
      effectiveAt: PropTypes.string
    })
  }),
  timeline: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      version: PropTypes.number,
      status: PropTypes.string,
      updatedAt: PropTypes.string,
      actor: PropTypes.string
    })
  ),
  versionHistory: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      version: PropTypes.number,
      status: PropTypes.string,
      updatedAt: PropTypes.string,
      createdAt: PropTypes.string,
      changeNotes: PropTypes.string
    })
  ),
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      slug: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      statusLabel: PropTypes.string
    })
  ),
  selectedSlug: PropTypes.string,
  formatDateTime: PropTypes.func.isRequired
};

LegalSidebar.defaultProps = {
  detail: null,
  timeline: [],
  versionHistory: [],
  documents: [],
  selectedSlug: null
};
