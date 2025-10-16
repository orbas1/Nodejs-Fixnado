import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublishedLegalDocument } from '../api/legalClient.js';

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function Terms() {
  const { slug: routeSlug } = useParams();
  const slug = routeSlug || 'terms';
  const [state, setState] = useState({ loading: true, document: null, error: null });

  useEffect(() => {
    document.title = 'Terms and Conditions | Fixnado';
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const payload = await getPublishedLegalDocument(slug, { signal: controller.signal });
        setState({ loading: false, document: payload, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          loading: false,
          document: null,
          error: error instanceof Error ? error.message : 'Unable to load terms and conditions.'
        });
      }
    })();
    return () => controller.abort();
  }, [slug]);

  const { document: policy, loading, error } = state;
  const version = policy?.version ?? null;
  const hero = version?.hero ?? { eyebrow: 'Legal', title: policy?.title ?? 'Terms and Conditions', summary: policy?.summary ?? '' };
  const contact = version?.contact ?? { email: policy?.contactEmail, phone: policy?.contactPhone };
  const sections = useMemo(() => version?.sections ?? [], [version?.sections]);
  const attachments = useMemo(() => version?.attachments ?? [], [version?.attachments]);

  useEffect(() => {
    if (policy?.title) {
      document.title = `${policy.title} | Fixnado`;
    }
  }, [policy?.title]);

  return (
    <div className="bg-slate-50" id="top">
      <div className="relative bg-gradient-to-br from-primary to-primary/70 text-white">
        <div className="absolute inset-0 opacity-20 mix-blend-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(14,52,109,0.45),_transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-16 lg:px-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            {hero.eyebrow || 'Legal'}
          </span>
          <h1 className="mt-6 text-3xl font-semibold leading-snug text-white md:text-4xl">{hero.title}</h1>
          {hero.summary ? (
            <p className="mt-4 max-w-3xl text-base text-white/80 md:text-lg">{hero.summary}</p>
          ) : null}
          <dl className="mt-8 grid gap-6 text-sm text-white/80 md:grid-cols-3">
            <div>
              <dt className="uppercase tracking-[0.2em] text-xs text-white/60">Effective date</dt>
              <dd className="mt-1 font-medium">{formatDate(version?.effectiveAt)}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.2em] text-xs text-white/60">Published</dt>
              <dd className="mt-1 font-medium">{formatDate(version?.publishedAt)}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.2em] text-xs text-white/60">Contact</dt>
              <dd className="mt-1 font-medium">{contact?.email || 'legal@fixnado.com'}</dd>
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
            {contact?.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2 text-sm font-medium text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span aria-hidden="true" className="text-lg">✉️</span>
                Request legal clarification
              </a>
            ) : null}
          </div>
          {error ? (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-100/20 px-4 py-3 text-sm text-white/90">
              {error}
            </p>
          ) : null}
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
                  key={section.id || section.anchor}
                  href={`#${section.id || section.anchor}`}
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
              {contact?.email ? (
                <p className="mt-2">
                  Email: <a className="text-primary" href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
              ) : null}
              {contact?.phone ? <p className="mt-1">Telephone: {contact.phone}</p> : null}
              {contact?.url ? (
                <p className="mt-1">
                  Website:{' '}
                  <a className="text-primary" href={contact.url} target="_blank" rel="noopener noreferrer">
                    {contact.url}
                  </a>
                </p>
              ) : null}
              {policy?.owner ? <p className="mt-1">Owner: {policy.owner}</p> : null}
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-12">
          {loading ? (
            <div className="rounded-3xl border border-dashed border-primary/30 bg-white/70 p-10 text-center text-sm text-slate-500">
              Loading latest terms…
            </div>
          ) : null}

          {sections.map((section) => (
            <article
              key={section.id || section.anchor}
              id={section.id || section.anchor}
              className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <header>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Section</span>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{section.title}</h2>
                {section.summary ? <p className="mt-2 text-sm text-slate-600">{section.summary}</p> : null}
              </header>
              <div className="mt-6 space-y-5 text-base leading-7 text-slate-700">
                {Array.isArray(section.body) && section.body.length > 0
                  ? section.body.map((paragraph, index) => (
                      <p key={`${section.id}-paragraph-${index}`} className="whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))
                  : null}
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <a href="#top" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-primary hover:text-primary">
                  <span aria-hidden="true">↑</span> Back to top
                </a>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Fixnado • Blackwellen Ltd</span>
              </div>
            </article>
          ))}

          {attachments.length > 0 ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <header>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Appendix</span>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Supporting documents</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Download referenced policies, regulatory notices, and signed agreements linked to this policy.
                </p>
              </header>
              <ul className="mt-6 space-y-4 text-sm text-slate-700">
                {attachments.map((attachment, index) => (
                  <li
                    key={attachment.id || `${attachment.url}-${index}`}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-primary">{attachment.label || `Attachment ${index + 1}`}</p>
                      {attachment.description ? (
                        <p className="text-xs text-slate-500">{attachment.description}</p>
                      ) : null}
                    </div>
                    <a
                      href={attachment.url}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary underline decoration-dotted underline-offset-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span aria-hidden="true">📄</span>
                      {attachment.type || 'View document'}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default Terms;
