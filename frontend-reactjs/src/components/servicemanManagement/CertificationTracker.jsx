import PropTypes from 'prop-types';
import { CERTIFICATION_STATUS_CLASSES, formatLabel } from './constants.js';

export default function CertificationTracker({ certifications, profileLookup, dateFormatter, onManageCertification }) {
  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Certification tracker</h3>
          <p className="text-sm text-slate-600">Monitor expiring credentials and evidence.</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        {certifications.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-accent/30 bg-secondary px-4 py-4 text-sm text-slate-500">
            No certifications recorded yet. Log safety, compliance, and training credentials to stay audit-ready.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-secondary text-primary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Crew</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Certification</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Expires</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10 text-slate-700">
              {certifications.map((certification) => {
                const profile = profileLookup.get(certification.profileId) ?? null;
                return (
                  <tr key={certification.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-primary">{certification.profileName}</p>
                      {certification.issuer ? <p className="text-xs text-slate-500">Issued by {certification.issuer}</p> : null}
                      {profile?.contactEmail ? (
                        <p className="text-[0.65rem] text-slate-500">{profile.contactEmail}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-primary">{certification.name}</p>
                      {certification.documentUrl ? (
                        <a
                          href={certification.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent underline"
                        >
                          View document
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          CERTIFICATION_STATUS_CLASSES[certification.status] ?? 'border-accent/30 text-primary'
                        }`}
                      >
                        {formatLabel(certification.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {certification.expiresAt ? dateFormatter.format(new Date(certification.expiresAt)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onManageCertification(profile, certification)}
                        className="inline-flex items-center rounded-full border border-accent/20 bg-white px-3 py-1 text-xs font-semibold text-primary/80 transition hover:border-accent hover:text-primary"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

CertificationTracker.propTypes = {
  certifications: PropTypes.arrayOf(PropTypes.object).isRequired,
  profileLookup: PropTypes.instanceOf(Map).isRequired,
  dateFormatter: PropTypes.instanceOf(Intl.DateTimeFormat).isRequired,
  onManageCertification: PropTypes.func.isRequired
};
