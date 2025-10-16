import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  defaults as DEFAULT_PROFILE,
  normaliseAppearanceProfile,
  fetchAppearanceProfiles,
  createAppearanceProfile,
  updateAppearanceProfile,
  archiveAppearanceProfile,
  buildProfilePayload
} from '../../api/appearanceClient.js';
import { DASHBOARD_ROLES } from '../../constants/dashboardConfig.js';
import { buildRoleOptions, STATUS_TONES } from './constants.js';

function buildRoleSummary(roles, roleChoices) {
  if (!roles || roles.length === 0) {
    return 'Admin only';
  }
  const names = roles
    .map((role) => roleChoices.find((option) => option.value === role)?.label || role)
    .slice(0, 3)
    .join(', ');
  return roles.length > 3 ? `${names}, +${roles.length - 3}` : names;
}

function buildHeaderMeta(profile, roleChoices) {
  if (!profile) {
    return [];
  }

  return [
    {
      label: 'Access roles',
      value: buildRoleSummary(profile.allowedRoles, roleChoices),
      caption: 'Roles permitted to apply this appearance'
    },
    {
      label: 'Published',
      value: profile.publishedAt ? new Date(profile.publishedAt).toLocaleDateString() : 'Not published',
      caption: profile.isDefault ? 'Default profile' : 'Draft workspace'
    },
    {
      label: 'Assets',
      value: profile.assets?.length ? `${profile.assets.length} linked` : 'No assets yet',
      caption: 'Logos, imagery, and iconography'
    }
  ];
}

export function useAppearanceManagement() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [form, setForm] = useState(() => normaliseAppearanceProfile(DEFAULT_PROFILE));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const roleChoices = useMemo(() => buildRoleOptions(DASHBOARD_ROLES), []);

  const applyDefaultForm = useCallback(() => {
    setSelectedProfileId('new');
    setForm(normaliseAppearanceProfile({ ...DEFAULT_PROFILE, name: 'New appearance profile' }));
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAppearanceProfiles();
      setProfiles(data);
      if (data.length) {
        const first = data[0];
        setSelectedProfileId(first.id);
        setForm(normaliseAppearanceProfile(first));
      } else {
        applyDefaultForm();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('Unable to load appearance management'));
    } finally {
      setLoading(false);
    }
  }, [applyDefaultForm]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAppearanceProfiles();
        if (!mounted) {
          return;
        }
        setProfiles(data);
        if (data.length) {
          const first = data[0];
          setSelectedProfileId(first.id);
          setForm(normaliseAppearanceProfile(first));
        } else {
          applyDefaultForm();
        }
      } catch (caught) {
        if (!mounted) {
          return;
        }
        setError(caught instanceof Error ? caught : new Error('Unable to load appearance management'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applyDefaultForm]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const updateForm = useCallback((updater) => {
    setForm((current) => {
      const nextState = typeof updater === 'function' ? updater(current) : updater;
      return normaliseAppearanceProfile(nextState);
    });
  }, []);

  const handleSelectProfile = useCallback(
    (profileId) => {
      if (profileId === 'new') {
        applyDefaultForm();
        return;
      }
      const target = profiles.find((profile) => profile.id === profileId);
      if (!target) {
        return;
      }
      setSelectedProfileId(profileId);
      setForm(normaliseAppearanceProfile(target));
    },
    [applyDefaultForm, profiles]
  );

  const handleFieldChange = useCallback((field, value) => {
    updateForm((current) => ({ ...current, [field]: value }));
  }, [updateForm]);

  const handleRoleToggle = useCallback((role) => {
    updateForm((current) => {
      const roles = new Set(current.allowedRoles);
      if (roles.has(role)) {
        roles.delete(role);
      } else {
        roles.add(role);
      }
      return { ...current, allowedRoles: Array.from(roles) };
    });
  }, [updateForm]);

  const handleColorChange = useCallback((key, value) => {
    updateForm((current) => ({
      ...current,
      colorPalette: { ...current.colorPalette, [key]: value }
    }));
  }, [updateForm]);

  const handleTypographyChange = useCallback((key, value) => {
    updateForm((current) => ({
      ...current,
      typography: { ...current.typography, [key]: value }
    }));
  }, [updateForm]);

  const handleLayoutChange = useCallback((key, value) => {
    updateForm((current) => ({
      ...current,
      layout: { ...current.layout, [key]: value }
    }));
  }, [updateForm]);

  const handleImageryChange = useCallback((key, value) => {
    updateForm((current) => ({
      ...current,
      imagery: { ...current.imagery, [key]: value }
    }));
  }, [updateForm]);

  const handleWidgetChange = useCallback((section, key, value) => {
    updateForm((current) => ({
      ...current,
      widgets: {
        ...current.widgets,
        [section]: {
          ...current.widgets?.[section],
          [key]: value
        }
      }
    }));
  }, [updateForm]);

  const handleMoveAsset = useCallback((index, direction) => {
    updateForm((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.assets.length) {
        return current;
      }
      const reordered = [...current.assets];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      return {
        ...current,
        assets: reordered.map((asset, sortIndex) => ({
          ...asset,
          sortOrder: sortIndex
        }))
      };
    });
  }, [updateForm]);

  const handleMoveVariant = useCallback((index, direction) => {
    updateForm((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.variants.length) {
        return current;
      }
      const reordered = [...current.variants];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      return {
        ...current,
        variants: reordered.map((variant, sortIndex) => ({
          ...variant,
          sortOrder: sortIndex
        }))
      };
    });
  }, [updateForm]);

  const handlePreviewVariant = useCallback((variantKey) => {
    if (!form.id) {
      setFeedback({ type: 'info', message: 'Save the appearance before previewing marketing variants.' });
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams({ profileId: form.id });
    if (variantKey) {
      params.set('variant', variantKey);
    }
    const url = `/admin/theme-studio?${params.toString()}`;
    window.open(url, '_blank', 'noopener');
  }, [form.id]);

  const handleGovernanceChange = useCallback((key, value) => {
    updateForm((current) => ({
      ...current,
      governance: { ...current.governance, [key]: value }
    }));
  }, [updateForm]);

  const handleAddAsset = useCallback(() => {
    updateForm((current) => ({
      ...current,
      assets: [
        ...current.assets,
        {
          id: null,
          assetType: 'logo',
          label: '',
          description: '',
          url: '',
          altText: '',
          metadata: { usage: '', background: '' },
          sortOrder: current.assets.length
        }
      ]
    }));
  }, [updateForm]);

  const handleAssetChange = useCallback((index, field, value) => {
    updateForm((current) => ({
      ...current,
      assets: current.assets.map((asset, idx) =>
        idx === index
          ? {
              ...asset,
              [field]: field === 'sortOrder' ? Number.parseInt(value ?? 0, 10) || 0 : value
            }
          : asset
      )
    }));
  }, [updateForm]);

  const handleAssetMetadataChange = useCallback((index, key, value) => {
    updateForm((current) => ({
      ...current,
      assets: current.assets.map((asset, idx) =>
        idx === index
          ? {
              ...asset,
              metadata: { ...asset.metadata, [key]: value }
            }
          : asset
      )
    }));
  }, [updateForm]);

  const handleRemoveAsset = useCallback((index) => {
    updateForm((current) => ({
      ...current,
      assets: current.assets.filter((_, idx) => idx !== index)
    }));
  }, [updateForm]);

  const handleAddVariant = useCallback(() => {
    updateForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          id: null,
          variantKey: `variant-${current.variants.length + 1}`,
          name: '',
          headline: '',
          subheadline: '',
          ctaLabel: '',
          ctaUrl: '',
          heroImageUrl: '',
          heroVideoUrl: '',
          publishState: 'draft',
          scheduledFor: null,
          marketingCopy: { audience: '', keywords: [] },
          sortOrder: current.variants.length
        }
      ]
    }));
  }, [updateForm]);

  const handleVariantChange = useCallback((index, field, value) => {
    updateForm((current) => ({
      ...current,
      variants: current.variants.map((variant, idx) =>
        idx === index
          ? {
              ...variant,
              [field]:
                field === 'scheduledFor'
                  ? value || null
                  : field === 'sortOrder'
                  ? Number.parseInt(value ?? 0, 10) || 0
                  : value
            }
          : variant
      )
    }));
  }, [updateForm]);

  const handleVariantCopyChange = useCallback((index, key, value) => {
    updateForm((current) => ({
      ...current,
      variants: current.variants.map((variant, idx) =>
        idx === index
          ? {
              ...variant,
              marketingCopy: {
                ...variant.marketingCopy,
                [key]:
                  key === 'keywords'
                    ? value
                        .split(',')
                        .map((entry) => entry.trim())
                        .filter(Boolean)
                    : value
              }
            }
          : variant
      )
    }));
  }, [updateForm]);

  const handleRemoveVariant = useCallback((index) => {
    updateForm((current) => ({
      ...current,
      variants: current.variants
        .filter((_, idx) => idx !== index)
        .map((variant, sortIndex) => ({ ...variant, sortOrder: sortIndex }))
    }));
  }, [updateForm]);

  const handleReset = useCallback(() => {
    if (!selectedProfileId || selectedProfileId === 'new') {
      applyDefaultForm();
      return;
    }
    const target = profiles.find((profile) => profile.id === selectedProfileId);
    if (target) {
      setForm(normaliseAppearanceProfile(target));
    }
  }, [applyDefaultForm, profiles, selectedProfileId]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const payload = buildProfilePayload(form);
      let saved;
      if (form.id) {
        saved = await updateAppearanceProfile(form.id, payload);
      } else {
        saved = await createAppearanceProfile(payload);
      }
      setProfiles((current) => {
        const next = current.filter((profile) => profile.id !== saved.id);
        next.push(saved);
        next.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return a.name.localeCompare(b.name);
        });
        return next;
      });
      setForm(normaliseAppearanceProfile(saved));
      setSelectedProfileId(saved.id);
      setFeedback({ type: 'success', message: 'Appearance profile saved' });
    } catch (caught) {
      const failure = caught instanceof Error ? caught : new Error('Failed to save profile');
      setFeedback({ type: 'error', message: failure.message });
    } finally {
      setSaving(false);
    }
  }, [form]);

  const handleArchive = useCallback(async () => {
    if (!form.id) {
      applyDefaultForm();
      return;
    }
    const confirmArchive = window.confirm(
      'Archive this appearance profile? Assets and marketing variants will be hidden.'
    );
    if (!confirmArchive) {
      return;
    }
    try {
      setSaving(true);
      await archiveAppearanceProfile(form.id);
      const remaining = profiles.filter((profile) => profile.id !== form.id);
      setProfiles(remaining);
      setFeedback({ type: 'info', message: 'Appearance profile archived' });
      if (remaining.length) {
        const next = remaining[0];
        setSelectedProfileId(next.id);
        setForm(normaliseAppearanceProfile(next));
      } else {
        applyDefaultForm();
      }
    } catch (caught) {
      const failure = caught instanceof Error ? caught : new Error('Failed to archive profile');
      setFeedback({ type: 'error', message: failure.message });
    } finally {
      setSaving(false);
    }
  }, [applyDefaultForm, form, profiles]);

  const headerMeta = useMemo(() => buildHeaderMeta(form, roleChoices), [form, roleChoices]);
  const previewHref = form.id ? `/admin/theme-studio?profileId=${encodeURIComponent(form.id)}` : null;

  return {
    profiles,
    selectedProfileId,
    form,
    roleChoices,
    loading,
    saving,
    feedback,
    error,
    headerMeta,
    previewHref,
    statusTones: STATUS_TONES,
    handleSelectProfile,
    handleFieldChange,
    handleRoleToggle,
    handleGovernanceChange,
    handleColorChange,
    handleTypographyChange,
    handleLayoutChange,
    handleImageryChange,
    handleWidgetChange,
    handleAddAsset,
    handleAssetChange,
    handleAssetMetadataChange,
    handleMoveAsset,
    handleRemoveAsset,
    handleAddVariant,
    handleVariantChange,
    handleVariantCopyChange,
    handleMoveVariant,
    handleRemoveVariant,
    handlePreviewVariant,
    handleSave,
    handleArchive,
    handleReset,
    reload: loadProfiles,
    setFeedback
  };
}

export function useFeedbackTone(feedback, tones = STATUS_TONES) {
  if (!feedback) {
    return null;
  }
  return tones[feedback.type] || tones.info;
}
