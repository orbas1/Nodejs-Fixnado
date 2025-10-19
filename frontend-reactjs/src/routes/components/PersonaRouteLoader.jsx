import PropTypes from 'prop-types';
import clsx from 'clsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useLocale } from '../../hooks/useLocale.js';

const PERSONA_LOADER_KEY = {
  public: 'public',
  workspace: 'workspace',
  provider: 'provider',
  admin: 'admin',
  serviceman: 'serviceman'
};

function resolveMessage(t, persona, titleOverride, descriptionOverride) {
  const key = PERSONA_LOADER_KEY[persona] ?? 'default';
  const title = titleOverride || t(`routing.loader.${key}.title`);
  const description = descriptionOverride || t(`routing.loader.${key}.description`);
  return { title, description };
}

export default function PersonaRouteLoader({
  persona,
  qa,
  title,
  description,
  className
}) {
  const { t } = useLocale();
  const message = resolveMessage(t, persona, title, description);

  return (
    <section
      className={clsx(
        'flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center text-slate-600',
        className
      )}
      role="status"
      aria-live="polite"
      data-qa={qa ?? `route-loader.${persona}`}
    >
      <Spinner className="h-10 w-10 text-primary" />
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">
          {message.title}
        </p>
        <p className="text-sm text-slate-500">{message.description}</p>
      </div>
    </section>
  );
}

PersonaRouteLoader.propTypes = {
  persona: PropTypes.string,
  qa: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string
};

PersonaRouteLoader.defaultProps = {
  persona: 'default',
  qa: undefined,
  title: undefined,
  description: undefined,
  className: undefined
};
