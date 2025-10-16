import PropTypes from 'prop-types';

function ComplianceEvidenceBoard({ evidence, exceptions }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-primary">Evidence queue</h3>
          <p className="text-sm text-slate-600">Upcoming proof uploads linked to control attestations.</p>
        </header>
        <div className="mt-4 space-y-4">
          {evidence.length === 0 ? (
            <p className="text-sm text-slate-500">No evidence items due.</p>
          ) : (
            evidence.map((item) => (
              <article key={item.id} className="rounded-2xl border border-accent/10 bg-secondary p-4">
                <h4 className="text-sm font-semibold text-primary">{item.requirement}</h4>
                <p className="text-xs text-slate-500">{item.controlTitle}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-white/80 px-3 py-1 font-semibold">Owner: {item.owner}</span>
                  {item.dueAt ? (
                    <span className="rounded-full bg-white/80 px-3 py-1 font-semibold">
                      Due {new Date(item.dueAt).toLocaleDateString()}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-white/80 px-3 py-1 font-semibold capitalize">{item.status}</span>
                </div>
                {item.evidenceUrl ? (
                  <a
                    href={item.evidenceUrl}
                    className="mt-2 inline-block text-xs font-semibold text-accent hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View evidence
                  </a>
                ) : null}
                {item.notes ? <p className="mt-2 text-xs text-slate-500">{item.notes}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-100 bg-amber-50/60 p-6 shadow-sm">
        <header className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-amber-800">Exceptions &amp; waivers</h3>
          <p className="text-sm text-amber-700">Temporary allowances awaiting review or expiry.</p>
        </header>
        <div className="mt-4 space-y-4">
          {exceptions.length === 0 ? (
            <p className="text-sm text-amber-700">No open exceptions recorded.</p>
          ) : (
            exceptions.map((item) => (
              <article key={item.id} className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                <h4 className="text-sm font-semibold text-amber-800">{item.summary}</h4>
                <p className="text-xs text-amber-700">{item.controlTitle}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-amber-700">
                  <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold">Owner: {item.owner}</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold capitalize">{item.status}</span>
                  {item.expiresAt ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold">
                      Expires {new Date(item.expiresAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
                {item.notes ? <p className="mt-2 text-xs text-amber-700">{item.notes}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

ComplianceEvidenceBoard.propTypes = {
  evidence: PropTypes.arrayOf(PropTypes.object).isRequired,
  exceptions: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default ComplianceEvidenceBoard;
