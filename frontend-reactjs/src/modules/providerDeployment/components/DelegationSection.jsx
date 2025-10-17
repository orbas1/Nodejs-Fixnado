import PropTypes from 'prop-types';
import {
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

const statusToneMap = {
  active: 'success',
  scheduled: 'info',
  expired: 'neutral',
  revoked: 'danger'
};

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    return `${date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })}`;
  } catch (error) {
    return value;
  }
}

export default function DelegationSection({ delegations, onCreate, onEdit, onDelete }) {
  return (
    <section className="space-y-6" aria-labelledby="provider-delegation-centre" data-qa="provider-delegation-centre">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="provider-delegation-centre" className="text-xl font-semibold text-primary">
            Delegation & escalation
          </h2>
          <p className="text-sm text-slate-500">
            Grant temporary access to other coordinators or supervisors to keep operations moving while crews are deployed.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={PlusIcon} onClick={onCreate}>
          Add delegation
        </Button>
      </div>

      {delegations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
          <ShieldCheckIcon className="mx-auto mb-3 h-8 w-8 text-primary/60" />
          <p>No delegations logged. Assign a delegate to cover approvals or communications when primary crew are unavailable.</p>
          <Button className="mt-4" icon={PlusIcon} onClick={onCreate}>
            Add delegation
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2" data-qa="provider-delegation-list">
          {delegations.map((delegation) => {
            const tone = statusToneMap[delegation.status] || 'neutral';
            return (
              <article
                key={delegation.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-primary">{delegation.delegateName}</p>
                    <p className="text-sm text-slate-500">
                      {delegation.crewMemberName ? `Supporting ${delegation.crewMemberName}` : 'General access'}
                    </p>
                  </div>
                  <StatusPill tone={tone}>{delegation.status?.replace(/_/g, ' ') || 'active'}</StatusPill>
                </header>

                <dl className="grid gap-2 text-sm text-slate-600">
                  {delegation.delegateEmail ? (
                    <div className="flex items-center gap-2">
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 text-primary/70" />
                      <a href={`mailto:${delegation.delegateEmail}`} className="hover:text-primary">
                        {delegation.delegateEmail}
                      </a>
                    </div>
                  ) : null}
                  {delegation.delegatePhone ? (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-primary/70" />
                      <a href={`tel:${delegation.delegatePhone}`} className="hover:text-primary">
                        {delegation.delegatePhone}
                      </a>
                    </div>
                  ) : null}
                  {delegation.role ? (
                    <div className="flex items-center gap-2">
                      <IdentificationIcon className="h-4 w-4 text-primary/70" />
                      <span>{delegation.role}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-primary/70" />
                    <span>
                      {formatDate(delegation.startAt)} – {formatDate(delegation.endAt)}
                    </span>
                  </div>
                </dl>

                {delegation.scope?.length ? (
                  <div className="flex flex-wrap gap-2 text-xs text-primary">
                    {delegation.scope.map((scopeEntry) => (
                      <span
                        key={scopeEntry}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-semibold uppercase tracking-wide"
                      >
                        {scopeEntry}
                      </span>
                    ))}
                  </div>
                ) : null}

                {delegation.notes ? (
                  <p className="text-xs text-slate-500">{delegation.notes}</p>
                ) : null}

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(delegation)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(delegation)}>
                    Remove
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

DelegationSection.propTypes = {
  delegations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      crewMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      crewMemberName: PropTypes.string,
      delegateName: PropTypes.string.isRequired,
      delegateEmail: PropTypes.string,
      delegatePhone: PropTypes.string,
      role: PropTypes.string,
      status: PropTypes.string,
      scope: PropTypes.arrayOf(PropTypes.string),
      startAt: PropTypes.string,
      endAt: PropTypes.string,
      notes: PropTypes.string
    })
  ).isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};
