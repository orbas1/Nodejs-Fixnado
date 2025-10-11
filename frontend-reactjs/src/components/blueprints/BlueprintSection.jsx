import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function BlueprintSection({
  eyebrow,
  title,
  description,
  children,
  aside,
  bleed,
  className,
  id
}) {
  return (
    <section
      id={id}
      className={clsx(
        'relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/85 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur',
        bleed ? 'px-0 py-0' : 'px-8 py-10',
        className
      )}
    >
      <div className={clsx('grid gap-8 lg:grid-cols-12', bleed ? '' : 'lg:gap-12')}>
        <div className={clsx(bleed ? 'lg:col-span-12' : 'lg:col-span-7', 'space-y-6 p-6 lg:p-0')}>
          <header className="space-y-3">
            {eyebrow && (
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                {eyebrow}
              </span>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-primary md:text-3xl">{title}</h2>
              {description && <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">{description}</p>}
            </div>
          </header>
          <div className="space-y-6 text-sm leading-relaxed text-slate-600 md:text-base">{children}</div>
        </div>
        {aside && <aside className="lg:col-span-5 space-y-4 border-t border-slate-100 p-6 lg:border-l lg:border-t-0 lg:p-0">{aside}</aside>}
      </div>
    </section>
  );
}

BlueprintSection.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  aside: PropTypes.node,
  bleed: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string
};

BlueprintSection.defaultProps = {
  eyebrow: undefined,
  description: undefined,
  aside: undefined,
  bleed: false,
  className: undefined,
  id: undefined
};
