export default function EscrowSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6 grid gap-10 rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-glow md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Escrow and dispute management</h2>
          <p className="mt-4 text-sm text-slate-600">
            Every service purchase is secured with Fixnado Escrow. Funds are released only when both parties agree the job is completed. If something goes wrong, the dispute desk triages cases, resolves with evidence, and keeps your reputation intact.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            <li>• Multi-party milestone escrow support</li>
            <li>• Automated reminders and completion approvals</li>
            <li>• Dedicated dispute managers with evidence vault</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-accent/20 bg-secondary p-6">
          <div className="rounded-2xl bg-white p-6 shadow-inner border border-slate-100">
            <h3 className="text-lg font-semibold text-primary">Escrow timeline</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li>1. Buyer funds the escrow for a service or marketplace order.</li>
              <li>2. Provider completes the work and submits evidence.</li>
              <li>3. Buyer approves or raises a dispute with mediation tools.</li>
              <li>4. Funds release automatically or after mediation.</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
