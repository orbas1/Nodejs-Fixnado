import PropTypes from 'prop-types';
import {
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ArrowPathIcon,
  PlusIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

const statusToneMap = {
  active: 'success',
  standby: 'warning',
  leave: 'info',
  inactive: 'neutral'
};

function formatEmploymentLabel(type) {
  switch (type) {
    case 'contractor':
      return 'Contractor';
    case 'partner':
      return 'Partner crew';
    case 'employee':
    default:
      return 'Employee';
  }
}

export default function CrewRosterSection({
  crewMembers,
  onAddCrew,
  onEditCrew,
  onPlanAvailability,
  onScheduleDeployment,
  onDelegateCrew,
  onRemoveCrew
}) {
  return (
    <section className="space-y-6" aria-labelledby="provider-crew-roster" data-qa="provider-crew-roster">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="provider-crew-roster" className="text-xl font-semibold text-primary">
            Crew roster
          </h2>
          <p className="text-sm text-slate-500">
            Manage active servicemen, plan their availability, and coordinate on-call coverage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={ArrowPathIcon} onClick={onAddCrew}>
            Add crew member
          </Button>
        </div>
      </div>

      {crewMembers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
          <UsersIcon className="mx-auto mb-3 h-8 w-8 text-primary/60" />
          <p>No crew members found. Add your first crew member to begin tracking deployment readiness.</p>
          <Button className="mt-4" icon={PlusIcon} onClick={onAddCrew}>
            Add crew member
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2" data-qa="provider-crew-roster-list">
          {crewMembers.map((member) => {
            const tone = statusToneMap[member.status] || 'neutral';
            return (
              <article
                key={member.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-primary">{member.fullName}</p>
                    <p className="text-sm text-slate-500">
                      {member.role || 'Crew member'} · {formatEmploymentLabel(member.employmentType)}
                    </p>
                  </div>
                  <StatusPill tone={tone} data-qa={`crew-status-${member.id}`}>
                    {member.status === 'standby'
                      ? 'Standby'
                      : member.status === 'leave'
                      ? 'On leave'
                      : member.status === 'inactive'
                      ? 'Inactive'
                      : 'Active'}
                  </StatusPill>
                </header>

                <dl className="grid gap-2 text-sm text-slate-600">
                  {member.email ? (
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-primary/70" />
                      <a href={`mailto:${member.email}`} className="hover:text-primary">
                        {member.email}
                      </a>
                    </div>
                  ) : null}
                  {member.phone ? (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-primary/70" />
                      <a href={`tel:${member.phone}`} className="hover:text-primary">
                        {member.phone}
                      </a>
                    </div>
                  ) : null}
                  {member.timezone ? (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-primary/70" />
                      <span>{member.timezone}</span>
                    </div>
                  ) : null}
                  {member.defaultShiftStart || member.defaultShiftEnd ? (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-primary/70" />
                      <span>
                        Default shift · {member.defaultShiftStart || '—'} – {member.defaultShiftEnd || '—'}
                      </span>
                    </div>
                  ) : null}
                  {member.notes ? <p className="text-xs text-slate-500">{member.notes}</p> : null}
                </dl>

                {member.skills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" icon={CalendarDaysIcon} onClick={() => onPlanAvailability(member)}>
                    Plan rota
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ClipboardDocumentListIcon}
                    onClick={() => onScheduleDeployment(member)}
                  >
                    Schedule deployment
                  </Button>
                  <Button variant="ghost" size="sm" icon={ArrowPathIcon} onClick={() => onDelegateCrew(member)}>
                    Delegate access
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditCrew(member)}>
                    Edit details
                  </Button>
                  {onRemoveCrew ? (
                    <Button variant="danger" size="sm" onClick={() => onRemoveCrew(member)}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

CrewRosterSection.propTypes = {
  crewMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      fullName: PropTypes.string.isRequired,
      role: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      status: PropTypes.string,
      employmentType: PropTypes.string,
      timezone: PropTypes.string,
      defaultShiftStart: PropTypes.string,
      defaultShiftEnd: PropTypes.string,
      skills: PropTypes.arrayOf(PropTypes.string),
      notes: PropTypes.string
    })
  ).isRequired,
  onAddCrew: PropTypes.func.isRequired,
  onEditCrew: PropTypes.func.isRequired,
  onPlanAvailability: PropTypes.func.isRequired,
  onScheduleDeployment: PropTypes.func.isRequired,
  onDelegateCrew: PropTypes.func.isRequired,
  onRemoveCrew: PropTypes.func
};

CrewRosterSection.defaultProps = {
  onRemoveCrew: null
};
