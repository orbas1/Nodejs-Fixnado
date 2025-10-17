import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ServicemanDirectory from './components/ServicemanDirectory.jsx';
import ServicemanProfileForm from './components/ServicemanProfileForm.jsx';
import ServicemanAvailabilityForm from './components/ServicemanAvailabilityForm.jsx';
import ServicemanZonesForm from './components/ServicemanZonesForm.jsx';
import ServicemanMediaForm from './components/ServicemanMediaForm.jsx';
import {
  listProviderServicemen,
  createProviderServiceman,
  updateProviderServiceman,
  deleteProviderServiceman
} from '../../api/panelClient.js';
import StatusPill from '../../components/ui/StatusPill.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Button from '../../components/ui/Button.jsx';

function buildEmptyEnums() {
  return {
    statuses: [],
    availabilityStatuses: [],
    daysOfWeek: [],
    timezones: [],
    mediaTypes: [],
    zones: [],
    currencies: []
  };
}

function buildEmptyProfile(enums) {
  return {
    id: null,
    name: '',
    role: '',
    email: '',
    phone: '',
    status: enums.statuses?.[0]?.value ?? 'active',
    availabilityStatus: enums.availabilityStatuses?.[0]?.value ?? 'available',
    availabilityPercentage: 100,
    hourlyRate: '',
    currency: enums.currencies?.[0] ?? 'GBP',
    avatarUrl: '',
    bio: '',
    notes: '',
    skillsInput: '',
    certifications: ''
  };
}

function buildDefaultAvailability(enums) {
  return {
    id: null,
    dayOfWeek: enums.daysOfWeek?.[0]?.value ?? 1,
    startTime: '08:00',
    endTime: '17:00',
    timezone: enums.timezones?.[0] ?? 'Europe/London',
    isActive: true
  };
}

export default function ServicemanManagementSection({ companyId, onRefresh }) {
  const [state, setState] = useState({
    loading: true,
    servicemen: [],
    enums: buildEmptyEnums(),
    error: null
  });
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('');
  const [profileForm, setProfileForm] = useState(buildEmptyProfile(state.enums));
  const [availabilityForm, setAvailabilityForm] = useState([buildDefaultAvailability(state.enums)]);
  const [zoneForm, setZoneForm] = useState([]);
  const [mediaForm, setMediaForm] = useState([]);

  const [profileSaving, setProfileSaving] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [zonesSaving, setZonesSaving] = useState(false);
  const [mediaSaving, setMediaSaving] = useState(false);

  const [profileMessage, setProfileMessage] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState(null);
  const [zonesMessage, setZonesMessage] = useState(null);
  const [mediaMessage, setMediaMessage] = useState(null);

  const [profileError, setProfileError] = useState(null);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [zonesError, setZonesError] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const enums = useMemo(() => state.enums ?? buildEmptyEnums(), [state.enums]);

  const selectedServiceman = useMemo(
    () => state.servicemen.find((member) => member.id === selectedId) ?? null,
    [state.servicemen, selectedId]
  );

  const isNew = !profileForm.id;

  const sortServicemen = useCallback((list) => {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const loadServicemen = useCallback(
    async ({ forceRefresh } = {}) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const result = await listProviderServicemen({ companyId, forceRefresh });
        setState({ loading: false, servicemen: sortServicemen(result.servicemen), enums: result.enums, error: null });
        setFilter('');
        if (result.servicemen.length > 0) {
          setSelectedId((currentSelected) => {
            if (currentSelected && result.servicemen.some((member) => member.id === currentSelected)) {
              return currentSelected;
            }
            return result.servicemen[0].id;
          });
        } else {
          setSelectedId(null);
        }
      } catch (error) {
        setState((current) => ({ ...current, loading: false, error }));
      }
    },
    [companyId, sortServicemen]
  );

  useEffect(() => {
    loadServicemen();
  }, [loadServicemen]);

  useEffect(() => {
    if (selectedServiceman) {
      setProfileForm({
        id: selectedServiceman.id,
        name: selectedServiceman.name ?? '',
        role: selectedServiceman.role ?? '',
        email: selectedServiceman.email ?? '',
        phone: selectedServiceman.phone ?? '',
        status: selectedServiceman.status ?? enums.statuses?.[0]?.value ?? 'active',
        availabilityStatus:
          selectedServiceman.availabilityStatus ?? enums.availabilityStatuses?.[0]?.value ?? 'available',
        availabilityPercentage: selectedServiceman.availabilityPercentage ?? 0,
        hourlyRate: selectedServiceman.hourlyRate ?? '',
        currency: selectedServiceman.currency ?? enums.currencies?.[0] ?? 'GBP',
        avatarUrl: selectedServiceman.avatarUrl ?? '',
        bio: selectedServiceman.bio ?? '',
        notes: selectedServiceman.notes ?? '',
        skillsInput: Array.isArray(selectedServiceman.skills) ? selectedServiceman.skills.join(', ') : '',
        certifications: selectedServiceman.certifications ?? ''
      });
      setAvailabilityForm(
        selectedServiceman.availabilities?.length
          ? selectedServiceman.availabilities.map((entry) => ({
              id: entry.id,
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
              timezone: entry.timezone,
              isActive: entry.isActive
            }))
          : [buildDefaultAvailability(enums)]
      );
      setZoneForm(
        selectedServiceman.zones?.map((entry) => ({
          zoneId: entry.zoneId ?? entry.zone?.id,
          isPrimary: Boolean(entry.isPrimary)
        })) ?? []
      );
      setMediaForm(
        selectedServiceman.media?.map((item, index) => ({
          id: item.id,
          url: item.url ?? '',
          label: item.label ?? '',
          type: item.type ?? enums.mediaTypes?.[0]?.value ?? 'gallery',
          isPrimary: Boolean(item.isPrimary),
          sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
          notes: item.notes ?? ''
        })) ?? []
      );
    } else {
      setProfileForm(buildEmptyProfile(enums));
      setAvailabilityForm([buildDefaultAvailability(enums)]);
      setZoneForm([]);
      setMediaForm([]);
    }
    setProfileMessage(null);
    setAvailabilityMessage(null);
    setZonesMessage(null);
    setMediaMessage(null);
    setProfileError(null);
    setAvailabilityError(null);
    setZonesError(null);
    setMediaError(null);
    setDeleteError(null);
  }, [selectedServiceman, enums]);

  const normaliseSkillsForSave = (skillsInput) =>
    skillsInput
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

  const refreshParent = useCallback(() => {
    try {
      onRefresh?.();
    } catch (error) {
      console.error('[ServicemanManagementSection] onRefresh handler failed', error);
    }
  }, [onRefresh]);

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    setProfileForm(buildEmptyProfile(enums));
    setAvailabilityForm([buildDefaultAvailability(enums)]);
    setZoneForm([]);
    setMediaForm([]);
  };

  const handleProfileChange = (updates) => {
    setProfileForm((current) => ({ ...current, ...updates }));
  };

  const handleAvailabilityChange = (entries) => {
    setAvailabilityForm(entries);
    setAvailabilityMessage(null);
  };

  const handleZoneChange = (entries) => {
    setZoneForm(entries);
    setZonesMessage(null);
  };

  const handleMediaChange = (entries) => {
    setMediaForm(entries);
    setMediaMessage(null);
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const payload = {
        profile: {
          name: profileForm.name.trim(),
          role: profileForm.role?.trim() || null,
          email: profileForm.email?.trim() || null,
          phone: profileForm.phone?.trim() || null,
          status: profileForm.status,
          availabilityStatus: profileForm.availabilityStatus,
          availabilityPercentage: Number.parseInt(profileForm.availabilityPercentage, 10) || 0,
          hourlyRate: profileForm.hourlyRate === '' ? null : Number.parseFloat(profileForm.hourlyRate),
          currency: profileForm.currency,
          avatarUrl: profileForm.avatarUrl?.trim() || null,
          bio: profileForm.bio ?? null,
          notes: profileForm.notes ?? null,
          skills: normaliseSkillsForSave(profileForm.skillsInput ?? ''),
          certifications: profileForm.certifications ?? null
        }
      };

      let result;
      if (isNew) {
        result = await createProviderServiceman(companyId, {
          ...payload,
          availability: availabilityForm,
          zones: zoneForm,
          media: mediaForm
        });
        setState((current) => ({
          ...current,
          servicemen: sortServicemen([...current.servicemen, result])
        }));
        setSelectedId(result.id);
        refreshParent();
      } else {
        result = await updateProviderServiceman(companyId, profileForm.id, payload);
        setState((current) => ({
          ...current,
          servicemen: sortServicemen(
            current.servicemen.map((member) => (member.id === result.id ? result : member))
          )
        }));
        refreshParent();
      }
      setProfileMessage(isNew ? 'Serviceman created successfully' : 'Profile saved');
    } catch (error) {
      setProfileError(error.message ?? 'Unable to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (isNew) return;
    setAvailabilitySaving(true);
    setAvailabilityError(null);
    try {
      const result = await updateProviderServiceman(companyId, profileForm.id, {
        availability: availabilityForm
      });
      setState((current) => ({
        ...current,
        servicemen: sortServicemen(
          current.servicemen.map((member) => (member.id === result.id ? result : member))
        )
      }));
      setAvailabilityMessage('Availability saved');
      refreshParent();
    } catch (error) {
      setAvailabilityError(error.message ?? 'Unable to save availability');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleSaveZones = async () => {
    if (isNew) return;
    setZonesSaving(true);
    setZonesError(null);
    try {
      const result = await updateProviderServiceman(companyId, profileForm.id, {
        zones: zoneForm
      });
      setState((current) => ({
        ...current,
        servicemen: sortServicemen(
          current.servicemen.map((member) => (member.id === result.id ? result : member))
        )
      }));
      setZonesMessage('Zones saved');
      refreshParent();
    } catch (error) {
      setZonesError(error.message ?? 'Unable to save zones');
    } finally {
      setZonesSaving(false);
    }
  };

  const handleSaveMedia = async () => {
    if (isNew) return;
    setMediaSaving(true);
    setMediaError(null);
    try {
      const result = await updateProviderServiceman(companyId, profileForm.id, {
        media: mediaForm
      });
      setState((current) => ({
        ...current,
        servicemen: sortServicemen(
          current.servicemen.map((member) => (member.id === result.id ? result : member))
        )
      }));
      setMediaMessage('Media saved');
      refreshParent();
    } catch (error) {
      setMediaError(error.message ?? 'Unable to save media');
    } finally {
      setMediaSaving(false);
    }
  };

  const handleDeleteServiceman = async () => {
    if (isNew || !profileForm.id) return;
    const shouldDelete = window.confirm(
      'Removing this serviceman will delete their availability, zone coverage, and gallery records. Continue?'
    );
    if (!shouldDelete) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProviderServiceman(companyId, profileForm.id);
      let nextSelection = null;
      setState((current) => {
        const remaining = current.servicemen.filter((member) => member.id !== profileForm.id);
        nextSelection = remaining[0]?.id ?? null;
        return { ...current, servicemen: remaining };
      });
      setSelectedId((currentSelected) => {
        if (currentSelected === profileForm.id) {
          return nextSelection;
        }
        return currentSelected;
      });
      refreshParent();
    } catch (error) {
      setDeleteError(error.message ?? 'Unable to delete serviceman');
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    loadServicemen({ forceRefresh: true });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/60">Crew operations</p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">Serviceman management</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Provision crew members, manage their availability, assign coverage zones, and maintain the gallery of
            documentation that surfaces across storefronts and dispatch tooling.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={state.loading}>
          Refresh data
        </Button>
      </div>
      {state.error ? <StatusPill tone="danger">{state.error.message ?? 'Unable to load crew'}</StatusPill> : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:grid-cols-[minmax(0,360px)_1fr]">
        <ServicemanDirectory
          servicemen={state.servicemen}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={handleCreateNew}
          loading={state.loading}
          onRefresh={handleRefresh}
          filter={filter}
          onFilterChange={setFilter}
          error={state.error}
        />
        <div className="space-y-6">
          {state.loading && !state.servicemen.length ? (
            <div className="flex min-h-[10rem] items-center justify-center rounded-2xl border border-dashed border-accent/40 bg-secondary/40">
              <Spinner />
            </div>
          ) : null}
          <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
            <ServicemanProfileForm
              form={profileForm}
              onChange={handleProfileChange}
              onSubmit={handleSaveProfile}
              enums={enums}
              isNew={isNew}
              saving={profileSaving}
              message={profileMessage}
              error={profileError}
            />
            {!isNew ? (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-xs text-rose-700">
                <div>
                  <p className="font-semibold">Danger zone</p>
                  <p className="text-rose-600">Removing a serviceman clears scheduling history and media references.</p>
                  {deleteError ? <StatusPill tone="danger">{deleteError}</StatusPill> : null}
                </div>
                <Button type="button" size="sm" variant="danger" loading={deleting} onClick={handleDeleteServiceman}>
                  Remove serviceman
                </Button>
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
            <ServicemanAvailabilityForm
              entries={availabilityForm}
              onChange={handleAvailabilityChange}
              onSave={handleSaveAvailability}
              enums={enums}
              disabled={isNew}
              saving={availabilitySaving}
              message={availabilityMessage}
              error={availabilityError}
            />
          </div>
          <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
            <ServicemanZonesForm
              zones={enums.zones}
              selectedZones={zoneForm}
              onChange={handleZoneChange}
              onSave={handleSaveZones}
              disabled={isNew}
              saving={zonesSaving}
              message={zonesMessage}
              error={zonesError}
            />
          </div>
          <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
            <ServicemanMediaForm
              media={mediaForm}
              onChange={handleMediaChange}
              onSave={handleSaveMedia}
              enums={enums}
              disabled={isNew}
              saving={mediaSaving}
              message={mediaMessage}
              error={mediaError}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

ServicemanManagementSection.propTypes = {
  companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func
};

ServicemanManagementSection.defaultProps = {
  companyId: null,
  onRefresh: null
};
