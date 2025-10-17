import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';

function EnterpriseUpgradeDocumentsCard({ documents, onAddDocument, onFieldChange, onRemoveDocument }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-primary">Supporting documents</h3>
          <p className="text-xs text-slate-500">Link proposals, playbooks, and supporting collateral for the upgrade.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onAddDocument({
              title: '',
              type: '',
              url: '',
              thumbnailUrl: '',
              description: ''
            })
          }
        >
          Add document
        </Button>
      </header>
      <div className="mt-4 space-y-4">
        {documents.map((doc, index) => (
          <div key={doc.id ?? doc.clientId} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="Title"
                value={doc.title}
                onChange={(event) => onFieldChange(index, 'title', event.target.value)}
                required
              />
              <TextInput
                label="Type"
                value={doc.type || ''}
                onChange={(event) => onFieldChange(index, 'type', event.target.value)}
              />
              <TextInput
                label="Document URL"
                value={doc.url}
                onChange={(event) => onFieldChange(index, 'url', event.target.value)}
                required
              />
              <TextInput
                label="Thumbnail URL"
                value={doc.thumbnailUrl || ''}
                onChange={(event) => onFieldChange(index, 'thumbnailUrl', event.target.value)}
              />
            </div>
            <TextArea
              className="mt-3"
              label="Description"
              value={doc.description || ''}
              onChange={(event) => onFieldChange(index, 'description', event.target.value)}
              minRows={2}
            />
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => onRemoveDocument(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">Share proposals, playbooks, or blueprint links for reviewers.</p>
        ) : null}
      </div>
    </article>
  );
}

EnterpriseUpgradeDocumentsCard.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      clientId: PropTypes.string,
      title: PropTypes.string,
      type: PropTypes.string,
      url: PropTypes.string,
      thumbnailUrl: PropTypes.string,
      description: PropTypes.string
    })
  ).isRequired,
  onAddDocument: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onRemoveDocument: PropTypes.func.isRequired
};

export default EnterpriseUpgradeDocumentsCard;
