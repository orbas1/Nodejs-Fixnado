import PropTypes from 'prop-types';
import { formatLabel } from './constants.js';

export default function RosterList({ roster, onCreateProfile, onEditProfile, onReviewAssignment, onAddCertification }) {
  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Supplier roster</h3>
          <p className="text-sm text-slate-600">Oversee third-party crews, their employers, and coverage readiness.</p>
        </div>
        <button
          type="button"
          onClick={onCreateProfile}
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/90"
        >
          Add serviceman
        </button>
      </div>
      <ul className="mt-6 space-y-4">
        {roster.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-accent/30 bg-secondary px-4 py-6 text-sm text-slate-500">
            No supplier-managed servicemen have been registered yet. Add your first record to start tracking coverage.
          </li>
        ) : (
          roster.map((member) => (
            <li key={member.id} className="rounded-2xl border border-accent/20 bg-white px-4 py-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-primary">{member.displayName}</p>
                    <p className="text-xs text-slate-500">
                      {formatLabel(member.role)} • {formatLabel(member.employmentType)}
                      {member.primaryZone ? ` • ${member.primaryZone}` : ''}
                    </p>
                  </div>
                  {member.employerName ? (
                    <p className="text-xs text-slate-500">
                      Supplier: {member.employerName}
                      {member.employerType ? ` • ${formatLabel(member.employerType)}` : ''}
                    </p>
                  ) : null}
                  {member.employerContact ? (
                    <p className="text-xs text-slate-500">Supplier contact: {member.employerContact}</p>
                  ) : null}
                  {member.contactEmail ? (
                    <p className="text-xs text-slate-500">{member.contactEmail}</p>
                  ) : null}
                  {member.contactPhone ? (
                    <p className="text-xs text-slate-500">{member.contactPhone}</p>
                  ) : null}
                  {Array.isArray(member.skills) && member.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill) => (
                        <span
                          key={`${member.id}-${skill}`}
                          className="rounded-full border border-accent/20 bg-secondary px-3 py-1 text-xs font-semibold text-primary/80"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {member.certifications?.length ? (
                    <p className="text-xs text-slate-500">
                      Certifications: {member.certifications.map((cert) => cert.name).join(', ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 text-xs md:items-end">
                  <div className="rounded-2xl border border-accent/20 bg-secondary px-4 py-3 text-left text-primary md:text-right">
                    <p className="text-xs uppercase tracking-wide text-primary/70">Next shift</p>
                    {member.nextShift ? (
                      <div className="mt-1 space-y-1">
                        <p className="text-sm font-semibold text-primary">{member.nextShift.dayLabel}</p>
                        <p className="text-xs text-slate-600">{member.nextShift.label}</p>
                        <p className="text-[0.65rem] uppercase tracking-wide text-slate-500">
                          {formatLabel(member.nextShift.status)}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">No upcoming shift scheduled.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEditProfile(member)}
                      className="inline-flex items-center rounded-full border border-accent/20 bg-white px-3 py-1 font-semibold text-primary/80 transition hover:border-accent hover:text-primary"
                    >
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => onReviewAssignment(member)}
                      className="inline-flex items-center rounded-full border border-accent/20 bg-white px-3 py-1 font-semibold text-primary/80 transition hover:border-accent hover:text-primary"
                    >
                      Review assignment
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddCertification(member)}
                      className="inline-flex items-center rounded-full border border-accent/20 bg-white px-3 py-1 font-semibold text-primary/80 transition hover:border-accent hover:text-primary"
                    >
                      Add certification
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

RosterList.propTypes = {
  roster: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreateProfile: PropTypes.func.isRequired,
  onEditProfile: PropTypes.func.isRequired,
  onReviewAssignment: PropTypes.func.isRequired,
  onAddCertification: PropTypes.func.isRequired
};
