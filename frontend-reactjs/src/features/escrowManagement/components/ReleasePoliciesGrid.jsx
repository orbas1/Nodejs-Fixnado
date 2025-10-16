import PropTypes from 'prop-types';
import { Button, Card, Spinner, StatusPill } from '../../../components/ui/index.js';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function ReleasePoliciesGrid({
  policies,
  loading,
  managing,
  error,
  onCreate,
  onEdit,
  onDelete,
  onRefresh
}) {
  const hasPolicies = Array.isArray(policies) && policies.length > 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-primary">Escrow release policies</h2>
          <p className="text-sm text-slate-600">
            Configure automated release windows, evidence requirements, and notification recipients. These settings are stored
            centrally and applied across web and mobile control centres.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onRefresh} disabled={loading || managing}>
            Refresh policies
          </Button>
          <Button type="button" size="sm" onClick={onCreate} disabled={managing}>
            Add release policy
          </Button>
        </div>
      </div>

      {error ? (
        <StatusPill tone="danger">{error}</StatusPill>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner className="h-5 w-5" aria-hidden="true" />
          <span>Loading policies…</span>
        </div>
      ) : null}

      {hasPolicies ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {policies.map((policy) => (
            <Card key={policy.id} className="space-y-4 border-slate-200 bg-white/90 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{policy.name}</h3>
                    <p className="text-sm text-slate-600">{policy.description || 'No description provided.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => onEdit?.(policy)} disabled={managing}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => onDelete?.(policy)}
                    disabled={managing}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <dl className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                  <span>Auto release after {policy.autoReleaseDays} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                  <span>{policy.documentChecklist?.length ?? 0} document requirements</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span>{policy.requiresDualApproval ? 'Dual approval required' : 'Single approval allowed'}</span>
                </div>
                {policy.maxAmount != null ? (
                  <div className="text-xs text-slate-500">
                    Threshold:{' '}
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GBP' }).format(
                      Number(policy.maxAmount)
                    )}
                  </div>
                ) : null}
              </dl>
              {policy.notifyRoles?.length ? (
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">Alerts: {policy.notifyRoles.join(', ')}</div>
              ) : null}
              {policy.releaseConditions?.length ? (
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-600">Release conditions</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {policy.releaseConditions.map((condition, index) => (
                      <li key={`${policy.id}-condition-${index}`}>{condition}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && !hasPolicies ? (
        <Card className="border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-600">
          <p className="font-medium text-slate-700">No release policies defined yet.</p>
          <p className="mt-1">
            Create a policy to standardise hold thresholds, evidence requirements, and approval routing across manual escrows.
          </p>
        </Card>
      ) : null}
    </section>
  );
}

ReleasePoliciesGrid.propTypes = {
  policies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      autoReleaseDays: PropTypes.number,
      documentChecklist: PropTypes.array,
      requiresDualApproval: PropTypes.bool,
      notifyRoles: PropTypes.arrayOf(PropTypes.string),
      releaseConditions: PropTypes.arrayOf(PropTypes.string),
      maxAmount: PropTypes.number
    })
  ),
  loading: PropTypes.bool,
  managing: PropTypes.bool,
  error: PropTypes.string,
  onCreate: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRefresh: PropTypes.func
};

ReleasePoliciesGrid.defaultProps = {
  policies: [],
  loading: false,
  managing: false,
  error: null,
  onCreate: undefined,
  onEdit: undefined,
  onDelete: undefined,
  onRefresh: undefined
};
