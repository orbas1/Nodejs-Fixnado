import { useEffect, useMemo } from 'react';
import termsDocument from '../data/legal/uk_terms.json';

const contactDetails = termsDocument.contact;

function getBulletClass(style) {
  return style === 'decimal' ? 'list-decimal' : 'list-disc';
}

function Terms() {
  useEffect(() => {
    document.title = 'Terms and Conditions | Fixnado';
  }, []);

  const sections = useMemo(() => termsDocument.sections ?? [], []);

  return (
    <div className="bg-slate-50" id="top">
      <div className="relative bg-gradient-to-br from-primary to-primary/70 text-white">
        <div className="absolute inset-0 opacity-20 mix-blend-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(14,52,109,0.45),_transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 lg:px-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            Legal
          </span>
          <h1 className="mt-6 text-3xl font-semibold leading-snug text-white md:text-4xl">
            {termsDocument.documentTitle}
          </h1>
          <p className="mt-4 max-w-3xl text-base text-white/80 md:text-lg">
            The Fixnado marketplace terms for England and Wales covering how clients and providers work with
            Blackwellen Ltd.
          </p>
          <dl className="mt-8 grid gap-6 text-sm text-white/80 md:grid-cols-3">
            <div>
              <dt className="uppercase tracking-[0.2em] text-xs text-white/60">Effective date</dt>
              <dd className="mt-1 font-medium">{termsDocument.effectiveDate}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.2em] text-xs text-white/60">Last updated</dt>
              <dd className="mt-1 font-medium">{termsDocument.lastUpdated}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.2em] text-xs text-white/60">Jurisdiction</dt>
              <dd className="mt-1 font-medium">{termsDocument.jurisdiction}</dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden="true" className="text-lg">🖨️</span>
              Download PDF
            </button>
            <a
              href={`mailto:${contactDetails.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2 text-sm font-medium text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden="true" className="text-lg">✉️</span>
              Request legal clarification
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row lg:px-8 lg:py-16">
        <aside className="lg:w-72">
          <div className="sticky top-28 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Contents</h2>
            <p className="mt-2 text-sm text-slate-600">Jump straight to any clause.</p>
            <nav aria-label="Terms of service sections" className="mt-4 space-y-2 text-sm text-slate-700">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-start gap-3 rounded-2xl px-3 py-2 transition hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60 transition group-hover:bg-primary" />
                  <span className="leading-snug font-medium text-slate-900 group-hover:text-primary">
                    {section.title}
                  </span>
                </a>
              ))}
            </nav>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Regulated contact points</p>
              <p className="mt-2">Email: <a className="text-primary" href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a></p>
              <p className="mt-1">Telephone: {contactDetails.telephone}</p>
              <p className="mt-1">Postal: {contactDetails.postal}</p>
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-12">
          {sections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <header>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Section</span>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{section.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{section.summary}</p>
              </header>
              <div className="mt-6 space-y-6 text-base leading-7 text-slate-700">
                {section.clauses.map((clause) => (
                  <div key={`${section.id}-${clause.heading}`}>
                    {clause.heading && (
                      <h3 className="text-lg font-semibold text-slate-900">{clause.heading}</h3>
                    )}
                    {clause.content?.map((paragraph, index) => (
                      <p key={`${section.id}-${clause.heading}-paragraph-${index}`} className="mt-3 first:mt-0">
                        {paragraph}
                      </p>
                    ))}
                    {clause.bullets && clause.bullets.items?.length > 0 && (
                      <ul
                        className={`mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-700 ${getBulletClass(
                          clause.bullets.style
                        )}`}
                      >
                        {clause.bullets.items.map((item, bulletIndex) => (
                          <li key={`${section.id}-${clause.heading}-bullet-${bulletIndex}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <a href="#top" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-primary hover:text-primary">
                  <span aria-hidden="true">↑</span> Back to top
                </a>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Fixnado • Blackwellen Ltd</span>
              </div>
            </article>
          ))}

          <article className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Acceptance</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">{termsDocument.acceptance.statement}</p>
            <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-700">
              {termsDocument.acceptance.requiredActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}

export default Terms;
