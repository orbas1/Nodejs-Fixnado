import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { CloudArrowUpIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import { Button, Checkbox, TextInput } from '../../ui/index.js';

const ZoneBulkImportSection = forwardRef(function ZoneBulkImportSection(
  {
    id,
    form,
    demandLevels,
    roleOptions,
    roleLabels,
    formatRoleLabel,
    onFieldChange,
    onDemandChange,
    onFileImport,
    onRoleToggle,
    onSubmit,
    onReset,
    feedback,
    loading,
    fileError
  },
  ref
) {
  return (
    <section id={id} ref={ref} className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Bulk zone import</p>
        <h2 className="text-xl font-semibold text-primary">Sync GeoJSON collections</h2>
        <p className="text-sm text-slate-600">
          Paste or upload a GeoJSON collection to seed multiple service zones in one operation. We validate each polygon,
          enforce role allowances, and emit analytics events for every created record.
        </p>
      </header>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Company ID"
            value={form.companyId}
            onChange={onFieldChange('companyId')}
            placeholder="UUID of the operating company"
            required
          />

          <label className="fx-field">
            <span className="fx-field__label">Default demand level</span>
            <select className="fx-text-input" value={form.demandLevel} onChange={onDemandChange}>
              {demandLevels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <TextInput
          label="Shared operational tags"
          value={form.tags}
          onChange={onFieldChange('tags')}
          placeholder="installations, premium-support"
          hint="Optional tags appended to every imported zone."
        />

        <label className="fx-field">
          <span className="fx-field__label">GeoJSON payload</span>
          <textarea
            rows={7}
            className="fx-text-input font-mono text-xs"
            value={form.geojson}
            onChange={onFieldChange('geojson')}
            placeholder='{"type":"FeatureCollection","features":[]}'
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <label className="flex cursor-pointer items-center gap-2 font-semibold uppercase tracking-[0.3em] text-primary">
            <input type="file" accept=".json,.geojson" className="hidden" onChange={onFileImport} />
            <CloudArrowUpIcon className="h-4 w-4" aria-hidden="true" /> Upload GeoJSON
          </label>
          {fileError ? (
            <span className="text-danger">{fileError}</span>
          ) : (
            <span>We support FeatureCollection, Feature, Polygon, and MultiPolygon payloads.</span>
          )}
        </div>

        <label className="fx-field">
          <span className="fx-field__label">Shared ops notes</span>
          <textarea
            rows={3}
            className="fx-text-input"
            value={form.notes}
            onChange={onFieldChange('notes')}
            placeholder="Document why these polygons are being onboarded and any launch guardrails."
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-primary">Role allowances</span>
          <p className="text-xs text-slate-500">
            Restrict ownership to specific roles once the zones are created. These values will be stored in metadata alongside
            each polygon.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {roleOptions.map((role) => (
              <Checkbox
                key={role}
                label={roleLabels[role] || formatRoleLabel(role)}
                checked={form.allowedRoles.includes(role)}
                onChange={onRoleToggle(role)}
              />
            ))}
          </div>
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : feedback.tone === 'info'
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-danger/40 bg-danger/10 text-danger'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" icon={SquaresPlusIcon} loading={loading}>
            Import zones
          </Button>
          <Button type="button" variant="ghost" onClick={onReset}>
            Clear fields
          </Button>
          <p className="text-xs text-slate-500">
            Imports respect duplicate detection, overlap prevention, and compliance checks automatically.
          </p>
        </div>
      </form>
    </section>
  );
});

ZoneBulkImportSection.propTypes = {
  id: PropTypes.string.isRequired,
  form: PropTypes.shape({
    companyId: PropTypes.string,
    demandLevel: PropTypes.string,
    geojson: PropTypes.string,
    tags: PropTypes.string,
    notes: PropTypes.string,
    allowedRoles: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  demandLevels: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  roleOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  roleLabels: PropTypes.object.isRequired,
  formatRoleLabel: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onDemandChange: PropTypes.func.isRequired,
  onFileImport: PropTypes.func.isRequired,
  onRoleToggle: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  feedback: PropTypes.shape({
    tone: PropTypes.string,
    message: PropTypes.string
  }),
  loading: PropTypes.bool,
  fileError: PropTypes.string
};

ZoneBulkImportSection.defaultProps = {
  feedback: null,
  loading: false,
  fileError: null
};

export default ZoneBulkImportSection;
