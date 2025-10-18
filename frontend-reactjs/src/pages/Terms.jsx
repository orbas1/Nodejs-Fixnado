import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { getPublishedLegalDocument } from '../api/legalClient.js';
import ukTerms from '../data/legal/uk_terms.json';

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildNavLabel(title = '', index) {
  const safeTitle = title.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim();
  if (!safeTitle) {
    return `Part ${index + 1}`;
  }
  const firstWord = safeTitle.split(/\s+/)[0];
  if (!firstWord) {
    return `Part ${index + 1}`;
  }
  return firstWord.length > 12 ? `${firstWord.slice(0, 11)}…` : firstWord;
}

function normaliseLocalSection(section, index) {
  const body = [];
  const clauseEntries = [];
  const sectionId = section?.id || `section-${index + 1}`;

  (section?.clauses ?? []).forEach((clause, clauseIndex) => {
    const paragraphs = Array.isArray(clause?.content) ? clause.content.filter(Boolean) : [];
    const bullets = Array.isArray(clause?.bullets?.items)
      ? {
          style: clause?.bullets?.style === 'decimal' ? 'decimal' : 'disc',
          items: clause.bullets.items.filter(Boolean)
        }
      : null;

    if (clause?.heading) {
      body.push(clause.heading);
    }
    paragraphs.forEach((paragraph) => body.push(paragraph));
    if (bullets) {
      const ordered = bullets.style === 'decimal';
      body.push(
        bullets.items
          .map((item, itemIndex) => (ordered ? `${itemIndex + 1}. ${item}` : `• ${item}`))
          .join('\n')
      );
    }

    clauseEntries.push({
      id: clause?.id || `${sectionId}-clause-${clauseIndex + 1}`,
      heading: clause?.heading || null,
      content: paragraphs,
      bullets
    });
  });

  if (body.length === 0 && Array.isArray(section?.body)) {
    body.push(...section.body.filter(Boolean));
  }

  return {
    id: sectionId,
    anchor: section?.id || `section-${index + 1}`,
    title: section?.title || `Section ${index + 1}`,
    summary: section?.summary || '',
    body,
    clauses: clauseEntries
  };
}

function buildLocalDocument(source) {
  if (!source) {
    return null;
  }

  const sections = (source.sections ?? []).map((section, index) => normaliseLocalSection(section, index));
  const heroTitle = source.documentTitle || 'Terms and Conditions';
  const heroSummary = sections[0]?.summary ?? '';

  return {
    slug: 'terms',
    title: heroTitle,
    summary: heroSummary,
    owner: source.owner || 'Fixnado',
    contactEmail: source.contact?.email ?? null,
    contactPhone: source.contact?.telephone ?? null,
    version: {
      hero: {
        eyebrow: 'Legal',
        title: heroTitle,
        summary: heroSummary
      },
      effectiveAt: source.effectiveDate ?? null,
      publishedAt: source.lastUpdated ?? null,
      contact: {
        email: source.contact?.email ?? null,
        phone: source.contact?.telephone ?? null,
        url: 'https://fixnado.com/legal/terms'
      },
      sections,
      attachments: []
    }
  };
}

const LOCAL_DOCUMENTS = {
  terms: buildLocalDocument(ukTerms)
};

function normaliseSectionClauses(section) {
  if (!section) return [];
  if (Array.isArray(section?.clauses) && section.clauses.length > 0) {
    return section.clauses.map((clause, index) => ({
      id: clause?.id || `${section?.anchor || section?.id || 'section'}-clause-${index + 1}`,
      heading: clause?.heading || null,
      content: Array.isArray(clause?.content) ? clause.content.filter(Boolean) : [],
      bullets: Array.isArray(clause?.bullets?.items)
        ? {
            style: clause?.bullets?.style === 'decimal' ? 'decimal' : 'disc',
            items: clause.bullets.items.filter(Boolean)
          }
        : null
    }));
  }

  const body = Array.isArray(section?.body)
    ? section.body.filter(Boolean)
    : section?.body
      ? [section.body]
      : [];

  if (body.length === 0) {
    return [];
  }

  return [
    {
      id: `${section?.anchor || section?.id || 'section'}-clause-1`,
      heading: section?.title || null,
      content: body,
      bullets: null
    }
  ];
}

function buildHighlights(section, clauseDetails) {
  if (!section) return [];
  const highlights = [];
  const seen = new Set();

  (clauseDetails ?? []).forEach((clause) => {
    if (!clause?.heading) return;
    const trimmed = clause.heading.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    highlights.push(trimmed.length > 96 ? `${trimmed.slice(0, 93)}…` : trimmed);
  });

  if (highlights.length === 0 && section?.summary) {
    const fallback = section.summary.trim();
    if (fallback) {
      highlights.push(fallback.length > 120 ? `${fallback.slice(0, 117)}…` : fallback);
    }
  }

  return highlights.slice(0, 4);
}

function countSectionWords(section) {
  if (!section) return 0;
  const segments = [];

  if (Array.isArray(section?.clauses)) {
    section.clauses.forEach((clause) => {
      if (clause?.heading) segments.push(clause.heading);
      if (Array.isArray(clause?.content)) {
        segments.push(...clause.content.filter(Boolean));
      }
      if (Array.isArray(clause?.bullets?.items)) {
        segments.push(...clause.bullets.items.filter(Boolean));
      }
    });
  }

  if (Array.isArray(section?.body)) {
    segments.push(...section.body.filter(Boolean));
  } else if (typeof section?.body === 'string') {
    segments.push(section.body);
  }

  if (section?.summary) {
    segments.push(section.summary);
  }

  if (segments.length === 0) return 0;
  return segments
    .join(' ')
    .replace(/[\r\n]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function Terms() {
  const { slug: routeSlug } = useParams();
  const slug = routeSlug || 'terms';
  const [state, setState] = useState({ loading: true, document: null, error: null });
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [isExpandedViewOpen, setExpandedViewOpen] = useState(false);
  const [view, setView] = useState('info');
  const modalScrollRef = useRef(null);

  useEffect(() => {
    document.title = 'Terms and Conditions | Fixnado';
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const payload = await getPublishedLegalDocument(slug, { signal: controller.signal });
        if (payload) {
          setState({ loading: false, document: payload, error: null });
          return;
        }

        const fallbackDocument = LOCAL_DOCUMENTS[slug];
        if (fallbackDocument) {
          setState({ loading: false, document: fallbackDocument, error: null });
          return;
        }

        setState({
          loading: false,
          document: null,
          error: 'Unable to load terms and conditions.'
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const fallbackDocument = LOCAL_DOCUMENTS[slug];
        if (fallbackDocument) {
          setState({ loading: false, document: fallbackDocument, error: null });
          return;
        }
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
  const hero = version?.hero ?? {
    eyebrow: 'Legal',
    title: policy?.title ?? 'Terms and Conditions',
    summary: policy?.summary ?? ''
  };
  const contact = version?.contact ?? {
    email: policy?.contactEmail,
    phone: policy?.contactPhone,
    url: policy?.contactUrl
  };
  const sections = useMemo(() => version?.sections ?? [], [version?.sections]);
  const attachments = useMemo(() => version?.attachments ?? [], [version?.attachments]);

  useEffect(() => {
    if (policy?.title) {
      document.title = `${policy.title} | Fixnado`;
    }
  }, [policy?.title]);

  useEffect(() => {
    setSelectedSectionIndex(0);
  }, [sections.length]);

  useEffect(() => {
    setView('info');
  }, [slug]);

  const navItems = useMemo(
    () =>
      sections.map((section, index) => ({
        ...section,
        anchor: section?.id || section?.anchor || `section-${index + 1}`,
        label: buildNavLabel(section?.title || `Section ${index + 1}`, index)
      })),
    [sections]
  );

  const selectedSection = navItems[selectedSectionIndex] ?? null;
  const clauseDetails = useMemo(() => normaliseSectionClauses(selectedSection), [selectedSection]);
  const sectionHighlights = useMemo(
    () => buildHighlights(selectedSection, clauseDetails),
    [selectedSection, clauseDetails]
  );
  const sectionMetrics = useMemo(
    () => ({
      clauseCount: clauseDetails.length,
      wordCount: countSectionWords(selectedSection)
    }),
    [clauseDetails, selectedSection]
  );

  useEffect(() => {
    if (!isExpandedViewOpen) return;
    const node = modalScrollRef.current;
    if (node) {
      if (typeof node.scrollTo === 'function') {
        node.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        node.scrollTop = 0;
      }
    }
  }, [selectedSectionIndex, isExpandedViewOpen]);

  useEffect(() => {
    if (!isExpandedViewOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setExpandedViewOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpandedViewOpen]);

  const handleClauseJump = (targetId) => {
    if (!targetId) return;
    requestAnimationFrame(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const viewTabs = useMemo(
    () => [
      { id: 'info', label: 'Info' },
      { id: 'read', label: 'Read' },
      { id: 'support', label: 'Help' }
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" id="top">
      <header className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(148,163,184,0.14),_transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {hero.eyebrow || 'Legal'}
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">{hero.title}</h1>
              {hero.summary ? <p className="text-base text-slate-600 md:text-lg">{hero.summary}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span aria-hidden="true" className="text-lg">
                  🖨️
                </span>
                Export
              </button>
              {contact?.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span aria-hidden="true" className="text-lg">
                    ✉️
                  </span>
                  Email
                </a>
              ) : null}
            </div>
          </div>
          <dl className="grid gap-6 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Effective</dt>
              <dd className="mt-2 text-base font-semibold text-slate-800">{formatDate(version?.effectiveAt)}</dd>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Published</dt>
              <dd className="mt-2 text-base font-semibold text-slate-800">{formatDate(version?.publishedAt)}</dd>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Owner</dt>
              <dd className="mt-2 text-base font-semibold text-slate-800">{policy?.owner || 'Fixnado'}</dd>
            </div>
          </dl>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 lg:px-8">
        {error ? (
          <p className="mb-10 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-semibold text-amber-700">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-8">
          <nav aria-label="Terms views" className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-600 shadow-sm">
              {viewTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={
                    view === tab.id
                      ? 'flex-1 rounded-2xl bg-primary/10 px-4 py-2 text-primary shadow-sm'
                      : 'flex-1 rounded-2xl px-4 py-2 transition hover:bg-slate-50'
                  }
                >
                {tab.label}
              </button>
            ))}
          </nav>

          {view === 'info' ? (
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <article className="rounded-4xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
                <header className="mb-6 flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Summary</span>
                  <h2 className="text-3xl font-semibold text-slate-900">What to know</h2>
                </header>
                <ul className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
                  {navItems.slice(0, 4).map((section, index) => (
                    <li key={section.anchor} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Part {index + 1}</p>
                      <h3 className="mt-2 text-base font-semibold text-slate-800">{section.title}</h3>
                      {section.summary ? (
                        <p className="mt-2 text-sm text-slate-600">{section.summary}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </article>
              <aside className="flex flex-col gap-6">
                <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Stats</h3>
                  <dl className="mt-4 grid gap-4 text-sm text-slate-600">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Sections</dt>
                      <dd className="mt-2 text-2xl font-semibold text-slate-900">{navItems.length}</dd>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Clauses</dt>
                      <dd className="mt-2 text-2xl font-semibold text-slate-900">{sectionMetrics.clauseCount}</dd>
                    </div>
                  </dl>
                </div>
                {attachments.length > 0 ? (
                  <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Files</h3>
                    <ul className="mt-4 space-y-4 text-sm text-slate-700">
                      {attachments.map((attachment, index) => (
                        <li
                          key={attachment.id || `${attachment.url}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 p-4"
                        >
                          <div>
                            <p className="text-base font-semibold text-primary">{attachment.label || `Attachment ${index + 1}`}</p>
                            {attachment.description ? (
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{attachment.description}</p>
                            ) : null}
                          </div>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline decoration-dotted underline-offset-2"
                          >
                            <span aria-hidden="true">📄</span>
                            {attachment.type || 'Open'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </aside>
            </section>
          ) : null}

          {view === 'read' ? (
            <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Sections</h2>
                <nav aria-label="Terms sections" className="mt-4 space-y-2">
                  {navItems.length > 0 ? (
                    navItems.map((section, index) => (
                      <button
                        key={section.anchor}
                        type="button"
                        aria-label={section.title || section.label}
                        aria-current={index === selectedSectionIndex ? 'page' : undefined}
                        onClick={() => setSelectedSectionIndex(index)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          index === selectedSectionIndex
                            ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
                            : 'border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white'
                        }`}
                      >
                        <span className="truncate">{section.label}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{index + 1}</span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No sections</p>
                  )}
                </nav>
              </aside>
              <article className="flex flex-col gap-6 rounded-4xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
                {selectedSection ? (
                  <>
                    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
                          Section {selectedSectionIndex + 1} of {navItems.length}
                        </span>
                        <h2 className="text-3xl font-semibold text-slate-900">{selectedSection.title}</h2>
                        {selectedSection.summary ? (
                          <p className="text-sm text-slate-600">{selectedSection.summary}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedViewOpen(true)}
                          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <span aria-hidden="true">📖</span>
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSectionIndex((value) => Math.max(0, value - 1))}
                          disabled={selectedSectionIndex === 0}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSectionIndex((value) => (value + 1 < navItems.length ? value + 1 : value))
                          }
                          disabled={selectedSectionIndex >= navItems.length - 1}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                        >
                          Next
                        </button>
                      </div>
                    </header>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Highlights</h3>
                        {sectionHighlights.length > 0 ? (
                          <ul className="mt-4 grid gap-3 text-sm font-medium text-slate-700">
                            {sectionHighlights.map((item, index) => (
                              <li key={`${selectedSection.anchor}-highlight-${index}`} className="rounded-2xl bg-white px-4 py-3">
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-4 text-sm text-slate-500">Full text in reader.</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-4 rounded-3xl bg-slate-50 p-6 text-sm text-slate-600">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Clauses</p>
                          <p className="mt-1 text-2xl font-semibold text-slate-900">{sectionMetrics.clauseCount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Words</p>
                          <p className="mt-1 text-2xl font-semibold text-slate-900">{sectionMetrics.wordCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
                          <p className="mt-1 text-base font-semibold text-slate-900">{formatDate(version?.publishedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
                    No sections.
                  </div>
                )}
              </article>
            </section>
          ) : null}

          {view === 'support' ? (
            <section className="grid gap-8 lg:grid-cols-2">
              <article className="rounded-4xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
                <header className="mb-6 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Contact</span>
                  <h2 className="text-3xl font-semibold text-slate-900">Talk with us</h2>
                </header>
                <div className="grid gap-4 text-sm text-slate-600">
                  {contact?.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/10"
                    >
                      <span>Email</span>
                      <span aria-hidden="true" className="text-lg">
                        ✉️
                      </span>
                    </a>
                  ) : null}
                  {contact?.url ? (
                    <a
                      href={contact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/10"
                    >
                      <span>Site</span>
                      <span aria-hidden="true" className="text-lg">
                        ↗️
                      </span>
                    </a>
                  ) : null}
                </div>
              </article>
              <article className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">Need a record?</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Save or print this policy for your compliance files anytime.
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span aria-hidden="true">🖨️</span>
                  Export
                </button>
              </article>
            </section>
          ) : null}
        </div>
      </main>

      {isExpandedViewOpen && selectedSection
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
              <div className="absolute inset-0" onClick={() => setExpandedViewOpen(false)} aria-hidden="true" />
              <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-4xl bg-white text-slate-900 shadow-2xl"
              >
                <div className="flex h-full w-full flex-col lg:flex-row">
                  <aside className="hidden h-full w-72 flex-shrink-0 border-r border-slate-200 bg-slate-50/80 px-6 py-6 lg:flex">
                    <div className="flex-1 overflow-y-auto">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Clauses</p>
                      <nav className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                        {clauseDetails.map((clause) => (
                          <button
                            key={clause.id}
                            type="button"
                            onClick={() => handleClauseJump(clause.id)}
                            className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition hover:bg-primary/10"
                          >
                            {clause.heading || 'Clause'}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </aside>
                  <div className="flex-1 overflow-hidden">
                    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
                            Section {selectedSectionIndex + 1} of {navItems.length}
                          </p>
                          <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedSection.title}</h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setExpandedViewOpen(false)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </header>
                    <div ref={modalScrollRef} className="h-full overflow-y-auto px-6 py-8">
                      <div className="space-y-8">
                        {clauseDetails.map((clause) => (
                          <article key={clause.id} id={clause.id} className="space-y-4">
                            {clause.heading ? (
                              <h3 className="text-lg font-semibold text-slate-900">{clause.heading}</h3>
                            ) : null}
                            {Array.isArray(clause.content)
                              ? clause.content.map((paragraph, paragraphIndex) => (
                                  <p key={`${clause.id}-paragraph-${paragraphIndex}`} className="text-base leading-7 text-slate-700 whitespace-pre-line">
                                    {paragraph}
                                  </p>
                                ))
                              : null}
                            {clause.bullets ? (
                              clause.bullets.style === 'decimal' ? (
                                <ol className="ml-5 list-decimal space-y-2 text-base leading-7 text-slate-700">
                                  {clause.bullets.items.map((item, itemIndex) => (
                                    <li key={`${clause.id}-bullet-${itemIndex}`}>{item}</li>
                                  ))}
                                </ol>
                              ) : (
                                <ul className="ml-5 list-disc space-y-2 text-base leading-7 text-slate-700">
                                  {clause.bullets.items.map((item, itemIndex) => (
                                    <li key={`${clause.id}-bullet-${itemIndex}`}>{item}</li>
                                  ))}
                                </ul>
                              )
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <footer className="border-t border-slate-200 bg-slate-50/80 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectionIndex((value) => {
                          const nextValue = Math.max(0, value - 1);
                          return nextValue;
                        });
                      }}
                      disabled={selectedSectionIndex === 0}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedViewOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 font-semibold transition hover:border-primary hover:text-primary"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectionIndex((value) => {
                          if (value + 1 < navItems.length) {
                            return value + 1;
                          }
                          return value;
                        });
                      }}
                      disabled={selectedSectionIndex >= navItems.length - 1}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </footer>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export default Terms;

