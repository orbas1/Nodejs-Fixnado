import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import CreationStudioWizard from '../features/creation/components/CreationStudioWizard.jsx';
import { fetchCreationBlueprints, publishCreationDraft, saveCreationDraft, validateCreationSlug } from '../api/creationStudioClient.js';
import { useSession } from '../hooks/useSession.js';
import { useLocale } from '../hooks/useLocale.js';
import { CREATION_STUDIO_ALLOWED_ROLES } from '../constants/accessControl.js';

function RestrictedAccess({ expectedRoles, supportEmail }) {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <div className="rounded-3xl border border-primary/30 bg-white/90 p-12 text-center shadow-glow">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
          {t('creationStudio.guard.restricted')}
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">{t('creationStudio.guard.title')}</h1>
        <p className="mt-4 text-sm text-slate-600">
          {t('creationStudio.guard.body', { roles: expectedRoles })}
        </p>
        <p className="mt-6 text-sm text-slate-500">
          {t('creationStudio.guard.help', { email: supportEmail })}
        </p>
      </div>
    </div>
  );
}

RestrictedAccess.propTypes = {
  expectedRoles: PropTypes.string.isRequired,
  supportEmail: PropTypes.string.isRequired
};

function CreationStudio() {
  const { isAuthenticated, hasRole, organisation } = useSession();
  const { t } = useLocale();
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadBlueprints() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchCreationBlueprints({ signal: controller.signal });
        if (isMounted) {
          setBlueprints(payload);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('[CreationStudio] Failed to load blueprints', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBlueprints();

    return () => {
      isMounted = false;
      controller.abort('component-unmount');
    };
  }, []);

  const formattedRoles = CREATION_STUDIO_ALLOWED_ROLES.map((role) => t(`roles.${role}`) ?? role).join(', ');
  const isAuthorised = CREATION_STUDIO_ALLOWED_ROLES.some((role) => hasRole(role));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorised) {
    return (
      <RestrictedAccess
        expectedRoles={formattedRoles}
        supportEmail={organisation?.support?.email ?? 'support@fixnado.com'}
      />
    );
  }

  return (
    <div className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {t('creationStudio.errors.loadFailure')} {error}
          </div>
        ) : null}
        <CreationStudioWizard
          blueprints={blueprints}
          loading={loading}
          onSaveDraft={async (payload) => saveCreationDraft(payload)}
          onPublish={async (payload) => publishCreationDraft(payload)}
          onSlugValidate={async (slug) => validateCreationSlug({ slug })}
        />
      </div>
    </div>
  );
}

export default CreationStudio;
