import { Link } from 'react-router-dom';
import LanguageSelector from './LanguageSelector.jsx';
import { useLocale } from '../hooks/useLocale.js';

const stats = [
  { label: 'Active cities', value: '320+' },
  { label: 'Avg. dispatch', value: '11m' },
  { label: 'Enterprise CSAT', value: '97%' }
];

const heroImage = {
  src: 'https://i.ibb.co/qLCYkBVc/IMG-3140.jpg',
  alt: 'Night crane crew preparing a lift with city skyline lighting.'
};

export default function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-white via-sky-50 to-slate-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.12),transparent_60%)]" aria-hidden="true" />
      <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-48 -right-48 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 pb-20 pt-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            On-demand service marketplace
          </span>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-primary md:text-5xl lg:text-6xl">
              Deploy builders, technicians, and specialists the moment work appears.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600">
              Fixnado connects enterprises to vetted crews, logistics partners, and live dispatch tools so every project launches on time with total visibility.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/85 p-5 shadow-sm shadow-primary/5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-primary/40 hover:text-primary"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/40 transition-colors hover:bg-accent/90"
              >
                {t('nav.register')}
              </Link>
            </div>
            <LanguageSelector variant="hero" className="sm:min-w-[14rem]" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3 text-base font-semibold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent/90"
            >
              Launch a project
            </Link>
            <Link
              to="/register/company"
              className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white px-7 py-3 text-base font-semibold text-primary transition-colors hover:border-primary/40"
            >
              Join as a provider
            </Link>
          </div>
          <dl className="grid gap-6 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 text-center shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{item.label}</dt>
                <dd className="mt-3 text-3xl font-semibold text-primary">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -left-6 rounded-[3.5rem] bg-accent/20 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[3rem] border border-slate-200/60 bg-white/70 shadow-xl">
            <img
              src={heroImage.src}
              alt={heroImage.alt}
              className="h-full w-full object-cover object-center"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
