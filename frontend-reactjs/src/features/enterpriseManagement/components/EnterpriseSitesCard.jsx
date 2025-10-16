import PropTypes from 'prop-types';
import { Button, Card, FormField, StatusPill, TextArea, TextInput } from '../../../components/ui/index.js';
import { SITE_STATUS_OPTIONS } from '../constants.js';
import { getOptionLabel } from '../utils.js';
import { READ_ONLY_MESSAGE } from '../constants.js';

export default function EnterpriseSitesCard({
  sites,
  siteForm,
  editingSiteId,
  onStartEdit,
  onFormChange,
  onSave,
  onDelete,
  onCancel,
  saving,
  isReadOnly
}) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">Sites & coverage</h2>
          <p className="text-sm text-slate-600">
            Capture site-level contacts, address details, and map references for dispatch teams.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStartEdit(null)}
          disabled={isReadOnly}
          title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
        >
          Add site
        </Button>
      </div>
      {isReadOnly ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Coverage locations are locked while this enterprise is archived.
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {sites.length === 0 ? (
          <p className="text-sm text-slate-500">
            No sites recorded for this enterprise yet. Add a coverage location to unlock geo-matching rules.
          </p>
        ) : (
          sites.map((site) => (
            <div
              key={site.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-primary">{site.name}</p>
                <p className="text-xs text-slate-500">
                  {[site.code, [site.city, site.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'Location pending'}
                </p>
                {site.contactName ? (
                  <p className="mt-1 text-xs text-slate-500">Contact: {site.contactName}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  tone={
                    site.status === 'operational'
                      ? 'success'
                      : site.status === 'offline'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {getOptionLabel(SITE_STATUS_OPTIONS, site.status, site.status)}
                </StatusPill>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStartEdit(site)}
                  disabled={isReadOnly}
                  title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(site.id)}
                  disabled={isReadOnly}
                  title={isReadOnly ? READ_ONLY_MESSAGE : undefined}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {editingSiteId ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="text-sm font-semibold text-primary">
            {editingSiteId === 'new' ? 'Add new site' : 'Edit site'}
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput label="Site name" value={siteForm.name} onChange={(event) => onFormChange('name', event.target.value)} disabled={isReadOnly} />
            <FormField id="site-status" label="Status">
              <select
                id="site-status"
                className="fx-text-input"
                value={siteForm.status}
                onChange={(event) => onFormChange('status', event.target.value)}
                disabled={isReadOnly}
              >
                {SITE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <TextInput
              label="Site code"
              value={siteForm.code}
              onChange={(event) => onFormChange('code', event.target.value)}
              hint="Optional identifier that matches operational tooling"
              disabled={isReadOnly}
            />
            <TextInput
              label="Address line 1"
              value={siteForm.addressLine1}
              onChange={(event) => onFormChange('addressLine1', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Address line 2"
              value={siteForm.addressLine2}
              onChange={(event) => onFormChange('addressLine2', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput label="City" value={siteForm.city} onChange={(event) => onFormChange('city', event.target.value)} disabled={isReadOnly} />
            <TextInput label="Region" value={siteForm.region} onChange={(event) => onFormChange('region', event.target.value)} disabled={isReadOnly} />
            <TextInput
              label="Postal code"
              value={siteForm.postalCode}
              onChange={(event) => onFormChange('postalCode', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput label="Country" value={siteForm.country} onChange={(event) => onFormChange('country', event.target.value)} disabled={isReadOnly} />
            <TextInput
              label="Timezone"
              value={siteForm.timezone}
              onChange={(event) => onFormChange('timezone', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Primary contact"
              value={siteForm.contactName}
              onChange={(event) => onFormChange('contactName', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Contact email"
              type="email"
              value={siteForm.contactEmail}
              onChange={(event) => onFormChange('contactEmail', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Contact phone"
              value={siteForm.contactPhone}
              onChange={(event) => onFormChange('contactPhone', event.target.value)}
              disabled={isReadOnly}
            />
            <TextInput
              label="Map URL"
              value={siteForm.mapUrl}
              onChange={(event) => onFormChange('mapUrl', event.target.value)}
              hint="Link to coverage map or GIS view"
              disabled={isReadOnly}
            />
            <TextInput
              label="Image URL"
              value={siteForm.imageUrl}
              onChange={(event) => onFormChange('imageUrl', event.target.value)}
              disabled={isReadOnly}
            />
            <TextArea
              label="Capacity notes"
              rows={3}
              value={siteForm.capacityNotes}
              onChange={(event) => onFormChange('capacityNotes', event.target.value)}
              disabled={isReadOnly}
            />
            <TextArea
              label="Additional notes"
              rows={3}
              value={siteForm.notes}
              onChange={(event) => onFormChange('notes', event.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={onSave} loading={saving} disabled={isReadOnly}>
              Save site
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

EnterpriseSitesCard.propTypes = {
  sites: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      status: PropTypes.string,
      city: PropTypes.string,
      country: PropTypes.string,
      code: PropTypes.string,
      contactName: PropTypes.string
    })
  ).isRequired,
  siteForm: PropTypes.object.isRequired,
  editingSiteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onStartEdit: PropTypes.func.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  isReadOnly: PropTypes.bool
};

EnterpriseSitesCard.defaultProps = {
  editingSiteId: null,
  saving: false,
  isReadOnly: false
};
