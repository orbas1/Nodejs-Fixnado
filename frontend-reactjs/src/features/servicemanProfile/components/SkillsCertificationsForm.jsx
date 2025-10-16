import PropTypes from 'prop-types';
import SectionCard from './SectionCard.jsx';

function SkillsCertificationsForm({
  form,
  onSpecialtyChange,
  onAddSpecialty,
  onRemoveSpecialty,
  onCertificationChange,
  onAddCertification,
  onRemoveCertification,
  onSubmit,
  saving,
  status
}) {
  return (
    <SectionCard
      title="Skills & certifications"
      description="Document the services you specialise in and the credentials required for high-risk environments."
      onSubmit={onSubmit}
      saving={saving}
      status={status}
    >
      <div className="rounded-2xl border border-accent/10 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-primary">Specialties</h4>
            <p className="text-xs text-slate-600">Showcase the workstreams you can take without supervision.</p>
          </div>
          <button
            type="button"
            onClick={onAddSpecialty}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent"
          >
            Add specialty
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {form.specialties.length === 0 ? (
            <p className="rounded-xl border border-dashed border-accent/20 px-4 py-4 text-sm text-slate-500">
              No specialties added yet. Add the services or environments you handle regularly (e.g. Emergency HVAC, Hospital isolation rooms).
            </p>
          ) : (
            form.specialties.map((entry, index) => (
              <div key={`specialty-${index}`} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={entry}
                  onChange={(event) => onSpecialtyChange(index, event.target.value)}
                  className="flex-1 rounded-xl border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                  placeholder="e.g. Vertical transport, Sterile facilities"
                />
                <button
                  type="button"
                  onClick={() => onRemoveSpecialty(index)}
                  className="text-xs font-semibold text-rose-600 transition hover:text-rose-800"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-accent/10 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-primary">Certifications</h4>
            <p className="text-xs text-slate-600">Include safety, access, and compliance credentials used for dispatch routing.</p>
          </div>
          <button
            type="button"
            onClick={onAddCertification}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent"
          >
            Add certification
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {form.certifications.length === 0 ? (
            <p className="rounded-xl border border-dashed border-accent/20 px-4 py-4 text-sm text-slate-500">
              No certifications recorded yet. Add IPAF, PASMA, NHS Estates, or other credentials needed for work authorisation.
            </p>
          ) : (
            form.certifications.map((certification, index) => (
              <div key={certification.id} className="space-y-3 rounded-xl border border-accent/10 bg-white p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                    <input
                      type="text"
                      value={certification.name}
                      onChange={(event) => onCertificationChange(index, 'name', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                      placeholder="Certification name"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Issuer
                    <input
                      type="text"
                      value={certification.issuer ?? ''}
                      onChange={(event) => onCertificationChange(index, 'issuer', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                      placeholder="Issuing body"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Issued on
                    <input
                      type="date"
                      value={certification.issuedOn ?? ''}
                      onChange={(event) => onCertificationChange(index, 'issuedOn', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Expires on
                    <input
                      type="date"
                      value={certification.expiresOn ?? ''}
                      onChange={(event) => onCertificationChange(index, 'expiresOn', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Credential URL
                  <input
                    type="url"
                    value={certification.credentialUrl ?? ''}
                    onChange={(event) => onCertificationChange(index, 'credentialUrl', event.target.value)}
                    placeholder="https://"
                    className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoveCertification(index)}
                    className="text-xs font-semibold text-rose-600 transition hover:text-rose-800"
                  >
                    Remove certification
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
}

SkillsCertificationsForm.propTypes = {
  form: PropTypes.shape({
    specialties: PropTypes.arrayOf(PropTypes.string),
    certifications: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        issuer: PropTypes.string,
        issuedOn: PropTypes.string,
        expiresOn: PropTypes.string,
        credentialUrl: PropTypes.string
      })
    )
  }).isRequired,
  onSpecialtyChange: PropTypes.func.isRequired,
  onAddSpecialty: PropTypes.func.isRequired,
  onRemoveSpecialty: PropTypes.func.isRequired,
  onCertificationChange: PropTypes.func.isRequired,
  onAddCertification: PropTypes.func.isRequired,
  onRemoveCertification: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

SkillsCertificationsForm.defaultProps = {
  saving: false,
  status: null
};

export default SkillsCertificationsForm;
