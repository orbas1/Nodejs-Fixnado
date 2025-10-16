import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';

function EnterpriseUpgradeSitesCard({ sites, onAddSite, onFieldChange, onRemoveSite }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-primary">Rollout sites</h3>
          <p className="text-xs text-slate-500">Document the enterprise locations included in this upgrade.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onAddSite({
              siteName: '',
              region: '',
              headcount: '',
              goLiveDate: '',
              imageUrl: '',
              notes: ''
            })
          }
        >
          Add site
        </Button>
      </header>
      <div className="mt-4 space-y-4">
        {sites.map((site, index) => (
          <div key={site.id ?? site.clientId} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="Site name"
                value={site.siteName}
                onChange={(event) => onFieldChange(index, 'siteName', event.target.value)}
                required
              />
              <TextInput
                label="Region"
                value={site.region || ''}
                onChange={(event) => onFieldChange(index, 'region', event.target.value)}
              />
              <TextInput
                label="Headcount"
                type="number"
                min="0"
                value={site.headcount || ''}
                onChange={(event) => onFieldChange(index, 'headcount', event.target.value)}
              />
              <TextInput
                label="Go-live"
                type="date"
                value={site.goLiveDate || ''}
                onChange={(event) => onFieldChange(index, 'goLiveDate', event.target.value)}
              />
              <TextInput
                label="Image URL"
                value={site.imageUrl || ''}
                onChange={(event) => onFieldChange(index, 'imageUrl', event.target.value)}
              />
              <TextArea
                label="Notes"
                value={site.notes || ''}
                onChange={(event) => onFieldChange(index, 'notes', event.target.value)}
                minRows={2}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => onRemoveSite(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {sites.length === 0 ? (
          <p className="text-sm text-slate-500">Add sites or campuses that will be part of the enterprise rollout.</p>
        ) : null}
      </div>
    </article>
  );
}

EnterpriseUpgradeSitesCard.propTypes = {
  sites: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      clientId: PropTypes.string,
      siteName: PropTypes.string,
      region: PropTypes.string,
      headcount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      goLiveDate: PropTypes.string,
      imageUrl: PropTypes.string,
      notes: PropTypes.string
    })
  ).isRequired,
  onAddSite: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onRemoveSite: PropTypes.func.isRequired
};

export default EnterpriseUpgradeSitesCard;
