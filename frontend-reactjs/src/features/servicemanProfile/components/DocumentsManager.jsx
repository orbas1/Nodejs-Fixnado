import PropTypes from 'prop-types';
import SectionCard from './SectionCard.jsx';

function DocumentsManager({ documents, onDocumentChange, onAddDocument, onRemoveDocument, onSubmit, saving, status }) {
  return (
    <SectionCard
      title="Documents & IDs"
      description="Store security passes, background checks, and permits the provider needs to maintain compliance."
      onSubmit={onSubmit}
      saving={saving}
      status={status}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Links should point to secure storage. We only display metadata – sensitive files stay in your vault of choice.
        </p>
        <button
          type="button"
          onClick={onAddDocument}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent"
        >
          Add document
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {documents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-accent/20 px-4 py-6 text-sm text-slate-500">
            No documents captured. Add ID, DBS checks, or site-specific inductions to speed up job approvals.
          </p>
        ) : (
          documents.map((document, index) => (
            <div key={document.id} className="space-y-3 rounded-xl border border-accent/10 bg-white p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                  <input
                    type="text"
                    value={document.name}
                    onChange={(event) => onDocumentChange(index, 'name', event.target.value)}
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    placeholder="Document title"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                  <input
                    type="text"
                    value={document.type ?? ''}
                    onChange={(event) => onDocumentChange(index, 'type', event.target.value)}
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    placeholder="Identity, Clearance, Permit"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Secure link
                  <input
                    type="url"
                    value={document.url ?? ''}
                    onChange={(event) => onDocumentChange(index, 'url', event.target.value)}
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    placeholder="https://"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Expires on
                  <input
                    type="date"
                    value={document.expiresOn ?? ''}
                    onChange={(event) => onDocumentChange(index, 'expiresOn', event.target.value)}
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
                <textarea
                  value={document.notes ?? ''}
                  onChange={(event) => onDocumentChange(index, 'notes', event.target.value)}
                  rows={2}
                  className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                  placeholder="Renewal reminders or access notes"
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveDocument(index)}
                  className="text-xs font-semibold text-rose-600 transition hover:text-rose-800"
                >
                  Remove document
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

DocumentsManager.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      type: PropTypes.string,
      url: PropTypes.string,
      expiresOn: PropTypes.string,
      notes: PropTypes.string
    })
  ).isRequired,
  onDocumentChange: PropTypes.func.isRequired,
  onAddDocument: PropTypes.func.isRequired,
  onRemoveDocument: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

DocumentsManager.defaultProps = {
  saving: false,
  status: null
};

export default DocumentsManager;
