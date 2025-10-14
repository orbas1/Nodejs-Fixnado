import { useEffect } from 'react';
import PropTypes from 'prop-types';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import policyContent from '../content/privacy_policy_content.json';

const { meta, sections } = policyContent;

function formatEffectiveDate(value) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  } catch (error) {
    console.error('Unable to format effective date', error);
    return value;
  }
}

function TableOfContents({ items }) {
  return (
    <nav aria-label="Privacy policy sections" className="sticky top-28 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-primary/5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">On this page</h2>
      <ol className="mt-4 space-y-3 text-sm text-slate-600">
        {items.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-2 transition hover:border-primary/20 hover:bg-primary/5 focus:outline-none focus-visible:border-primary focus-visible:bg-primary/10"
            >
              <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-primary/40 transition group-hover:bg-primary" aria-hidden="true" />
              <span className="flex-1 text-left font-medium text-slate-600 group-hover:text-primary">{section.title}</span>
            </a>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-xs text-primary">
        <p className="font-semibold">Need a signed copy?</p>
        <p className="mt-1 text-primary/80">
          Email <a className="underline decoration-dotted underline-offset-2" href="mailto:privacy@fixnado.com">privacy@fixnado.com</a> for a signed PDF or DPA reference.
        </p>
      </div>
    </nav>
  );
}

TableOfContents.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  ).isRequired
};

export default function Privacy() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formattedEffectiveDate = formatEffectiveDate(meta.effectiveDate);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <PageHeader
        eyebrow="Legal & compliance"
        title={meta.title}
        description={meta.summary}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Privacy' }
        ]}
        actions={[
          {
            label: 'Privacy Center',
            variant: 'primary',
            to: '/enterprise/panel?tab=privacy'
          },
          {
            label: 'Contact the Privacy Office',
            to: 'mailto:privacy@fixnado.com',
            variant: 'secondary'
          }
        ]}
        meta={[
          {
            label: 'Effective date',
            value: formattedEffectiveDate,
            caption: `Version ${meta.version}`,
            emphasis: true
          },
          {
            label: 'Policy owner',
            value: meta.owner,
            caption: 'Blackwellen Ltd Privacy Office'
          },
          {
            label: 'Review cadence',
            value: 'Bi-annual',
            caption: 'Governance & oversight forum'
          }
        ]}
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 pt-16 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
        <article className="space-y-12">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-primary/5 transition hover:border-primary/30"
            >
              <header className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/60">{meta.owner}</p>
                <h2 className="text-2xl font-semibold text-primary md:text-3xl">{section.title}</h2>
              </header>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {section.lists?.map((list) => (
                  <div key={list.title} className="mt-4 space-y-2">
                    {list.title && <p className="font-semibold text-primary">{list.title}</p>}
                    <ul className="space-y-1 pl-5 text-sm text-slate-600">
                      {list.items.map((item) => (
                        <li key={item} className="list-disc">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </article>

        <aside className="space-y-6">
          <TableOfContents items={sections} />
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-inner">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Security posture</h2>
            <p className="mt-3 text-sm text-emerald-900">
              Web and mobile use the same privacy controls, RBAC, and incident playbooks.
            </p>
            <p className="mt-3 text-xs text-emerald-800/80">
              Need SOC 2, ISO, or DPIA packs? Request them from the Enterprise Trust Center.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
