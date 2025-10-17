import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DashboardOverview from '../../../components/dashboard/DashboardOverview.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import useServicemanOverview from '../hooks/useServicemanOverview.js';
import AvailabilityModal from './AvailabilityModal.jsx';
import CertificationModal from './CertificationModal.jsx';
import EquipmentModal from './EquipmentModal.jsx';

const PROFILE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active duty' },
  { value: 'standby', label: 'Standby' },
  { value: 'offline', label: 'Offline' }
];

const SHIFT_STATUS_TONES = {
  available: 'success',
  standby: 'warning',
  unavailable: 'neutral'
};

const EQUIPMENT_STATUS_TONES = {
  ready: 'success',
  maintenance: 'warning',
  checked_out: 'info',
  retired: 'neutral'
};

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultProfile = {
  displayName: '',
  callSign: '',
  status: 'active',
  primaryRegion: '',
  travelBufferMinutes: 30,
  coverageRadiusKm: 25,
  defaultVehicle: '',
  bio: '',
  timezone: '',
  autoAcceptAssignments: false,
  allowAfterHours: false,
  notifyOpsTeam: true
};

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTimeRange(start, end) {
  if (!start && !end) return '—';
  if (!start) return end;
  if (!end) return start;
  return `${start} – ${end}`;
}

function sortAvailability(entries) {
  return [...(entries ?? [])].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return (a.startTime ?? '').localeCompare(b.startTime ?? '');
  });
}

function sortCertifications(entries) {
  return [...(entries ?? [])].sort((a, b) => {
    const aExpires = a.expiresOn ?? '';
    const bExpires = b.expiresOn ?? '';
    if (aExpires && bExpires && aExpires !== bExpires) {
      return aExpires.localeCompare(bExpires);
    }
    return (a.title ?? '').localeCompare(b.title ?? '');
  });
}

function sortEquipment(entries) {
  return [...(entries ?? [])].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
}

function SelectField({ id, label, value, onChange, options, disabled }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600" htmlFor={id}>
      <span className="font-medium text-slate-700">{label}</span>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

SelectField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired
};

SelectField.defaultProps = {
  disabled: false
};

export default function ServicemanOverviewModule({ analytics, metadata }) {
  const {
    overview,
    loading,
    error,
    usingMock,
    refresh,
    updateProfile,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    createCertification,
    updateCertification,
    deleteCertification,
    createEquipment,
    updateEquipment,
    deleteEquipment
  } = useServicemanOverview();

  const [profileForm, setProfileForm] = useState(defaultProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  const [availabilityModal, setAvailabilityModal] = useState({ open: false, initialValue: null });
  const [certificationModal, setCertificationModal] = useState({ open: false, initialValue: null });
  const [equipmentModal, setEquipmentModal] = useState({ open: false, initialValue: null });
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    if (overview?.profile) {
      setProfileFeedback(null);
      setProfileForm({
        ...defaultProfile,
        ...overview.profile,
        travelBufferMinutes:
          overview.profile.travelBufferMinutes === null || overview.profile.travelBufferMinutes === undefined
            ? ''
            : overview.profile.travelBufferMinutes,
        coverageRadiusKm:
          overview.profile.coverageRadiusKm === null || overview.profile.coverageRadiusKm === undefined
            ? ''
            : overview.profile.coverageRadiusKm
      });
    }
  }, [overview?.profile]);

  const availability = useMemo(() => sortAvailability(overview?.availability ?? []), [overview?.availability]);
  const certifications = useMemo(() => sortCertifications(overview?.certifications ?? []), [overview?.certifications]);
  const equipment = useMemo(() => sortEquipment(overview?.equipment ?? []), [overview?.equipment]);

  const permissions = overview?.permissions ?? {
    canEditProfile: true,
    canManageAvailability: true,
    canManageCertifications: true,
    canManageEquipment: true
  };

  const handleProfileChange = (field, type = 'text') => (event) => {
    if (type === 'boolean') {
      setProfileForm((current) => ({ ...current, [field]: event.target.checked }));
      return;
    }

    if (type === 'number') {
      const raw = event.target.value;
      setProfileForm((current) => ({ ...current, [field]: raw === '' ? '' : Number.parseInt(raw, 10) }));
      return;
    }

    setProfileForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!permissions.canEditProfile || !overview?.profile) {
      return;
    }

    setProfileSaving(true);
    setProfileFeedback(null);

    try {
      const payload = {
        displayName: profileForm.displayName,
        callSign: profileForm.callSign,
        status: profileForm.status,
        primaryRegion: profileForm.primaryRegion || null,
        travelBufferMinutes:
          profileForm.travelBufferMinutes === '' || Number.isNaN(profileForm.travelBufferMinutes)
            ? undefined
            : Number(profileForm.travelBufferMinutes),
        coverageRadiusKm:
          profileForm.coverageRadiusKm === '' || Number.isNaN(profileForm.coverageRadiusKm)
            ? undefined
            : Number(profileForm.coverageRadiusKm),
        defaultVehicle: profileForm.defaultVehicle || null,
        bio: profileForm.bio || null,
        timezone: profileForm.timezone || null,
        autoAcceptAssignments: Boolean(profileForm.autoAcceptAssignments),
        allowAfterHours: Boolean(profileForm.allowAfterHours),
        notifyOpsTeam: Boolean(profileForm.notifyOpsTeam)
      };

      await updateProfile(payload);
      setProfileFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setProfileFeedback({ type: 'error', message: err?.body?.message || err?.message || 'Unable to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleResetProfile = () => {
    if (overview?.profile) {
      setProfileForm({
        ...defaultProfile,
        ...overview.profile,
        travelBufferMinutes:
          overview.profile.travelBufferMinutes === null || overview.profile.travelBufferMinutes === undefined
            ? ''
            : overview.profile.travelBufferMinutes,
        coverageRadiusKm:
          overview.profile.coverageRadiusKm === null || overview.profile.coverageRadiusKm === undefined
            ? ''
            : overview.profile.coverageRadiusKm
      });
      setProfileFeedback(null);
    }
  };

  const closeAvailabilityModal = () => setAvailabilityModal({ open: false, initialValue: null });
  const closeCertificationModal = () => setCertificationModal({ open: false, initialValue: null });
  const closeEquipmentModal = () => setEquipmentModal({ open: false, initialValue: null });

  const handleAvailabilitySubmit = async (values) => {
    setModalSaving(true);
    try {
      if (availabilityModal.initialValue?.id) {
        await updateAvailability(availabilityModal.initialValue.id, values);
      } else {
        await createAvailability(values);
      }
    } catch (err) {
      throw err;
    } finally {
      setModalSaving(false);
    }
  };

  const handleCertificationSubmit = async (values) => {
    setModalSaving(true);
    try {
      if (certificationModal.initialValue?.id) {
        await updateCertification(certificationModal.initialValue.id, values);
      } else {
        await createCertification(values);
      }
    } catch (err) {
      throw err;
    } finally {
      setModalSaving(false);
    }
  };

  const handleEquipmentSubmit = async (values) => {
    setModalSaving(true);
    try {
      if (equipmentModal.initialValue?.id) {
        await updateEquipment(equipmentModal.initialValue.id, values);
      } else {
        await createEquipment(values);
      }
    } catch (err) {
      throw err;
    } finally {
      setModalSaving(false);
    }
  };

  const confirmDeletion = async (action, message) => {
    if (!window.confirm(message)) {
      return;
    }
    try {
      await action();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.body?.message || err?.message || 'Unable to complete the request');
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner aria-label="Loading overview" />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50/70 p-8 text-center text-red-700">
        <p className="text-lg font-semibold">We were unable to load your overview.</p>
        <p className="mt-2 text-sm text-red-600">{error?.body?.message || error?.message}</p>
        <div className="mt-6 flex justify-center">
          <Button onClick={refresh} variant="primary">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-white/80 to-sky-50 p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-primary/60">Serviceman control centre</p>
            <h1 className="mt-2 text-2xl font-semibold text-primary">Overview</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Keep your profile, availability windows, compliance records, and assigned equipment in sync with the operations
              command centre.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {usingMock ? <StatusPill tone="info">Demo data active</StatusPill> : null}
            <Button onClick={refresh} variant="secondary" loading={loading}>
              Refresh data
            </Button>
          </div>
        </div>
        {metadata?.lastSyncedAt ? (
          <p className="mt-4 text-xs text-slate-500">Last synced {formatDate(metadata.lastSyncedAt)}.</p>
        ) : null}
      </header>

      <DashboardOverview analytics={analytics} />

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" aria-labelledby="serviceman-profile-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="serviceman-profile-heading" className="text-xl font-semibold text-primary">
              Profile & routing rules
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Update your call sign, duty status, and travel buffers to keep dispatch allocations accurate.
            </p>
          </div>
          {overview?.profile?.status ? (
            <StatusPill tone={SHIFT_STATUS_TONES[overview.profile.status] ?? 'neutral'}>
              {overview.profile.status.replace('_', ' ')}
            </StatusPill>
          ) : null}
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleProfileSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              id="profile-display-name"
              label="Display name"
              value={profileForm.displayName}
              onChange={handleProfileChange('displayName')}
              required
              disabled={!permissions.canEditProfile}
            />
            <TextInput
              id="profile-call-sign"
              label="Call sign"
              value={profileForm.callSign}
              onChange={handleProfileChange('callSign')}
              placeholder="e.g. Metro Crew"
              disabled={!permissions.canEditProfile}
            />
        <SelectField
          id="profile-status"
          label="Duty status"
          value={profileForm.status}
          onChange={handleProfileChange('status')}
          disabled={!permissions.canEditProfile}
          options={PROFILE_STATUS_OPTIONS}
        />
            <TextInput
              id="profile-region"
              label="Primary region"
              value={profileForm.primaryRegion}
              onChange={handleProfileChange('primaryRegion')}
              placeholder="Metro North"
              disabled={!permissions.canEditProfile}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              id="profile-coverage"
              label="Coverage radius (km)"
              type="number"
              min="0"
              value={profileForm.coverageRadiusKm}
              onChange={handleProfileChange('coverageRadiusKm', 'number')}
              disabled={!permissions.canEditProfile}
            />
            <TextInput
              id="profile-travel-buffer"
              label="Travel buffer (minutes)"
              type="number"
              min="0"
              value={profileForm.travelBufferMinutes}
              onChange={handleProfileChange('travelBufferMinutes', 'number')}
              disabled={!permissions.canEditProfile}
            />
            <TextInput
              id="profile-default-vehicle"
              label="Default vehicle"
              value={profileForm.defaultVehicle}
              onChange={handleProfileChange('defaultVehicle')}
              placeholder="Fleet Van 21"
              disabled={!permissions.canEditProfile}
            />
          </div>

          <TextInput
            id="profile-timezone"
            label="Timezone"
            value={profileForm.timezone}
            onChange={handleProfileChange('timezone')}
            placeholder="Europe/London"
            disabled={!permissions.canEditProfile}
          />

          <TextInput
            id="profile-bio"
            label="Bio"
            value={profileForm.bio}
            onChange={handleProfileChange('bio')}
            placeholder="Add a short summary to help dispatch coordinate assignments."
            disabled={!permissions.canEditProfile}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Checkbox
              id="profile-auto-accept"
              label="Auto-accept assignments"
              checked={Boolean(profileForm.autoAcceptAssignments)}
              onChange={handleProfileChange('autoAcceptAssignments', 'boolean')}
              disabled={!permissions.canEditProfile}
              description="Automatically lock in new dispatches within your coverage window."
            />
            <Checkbox
              id="profile-after-hours"
              label="Allow after-hours work"
              checked={Boolean(profileForm.allowAfterHours)}
              onChange={handleProfileChange('allowAfterHours', 'boolean')}
              disabled={!permissions.canEditProfile}
              description="Signal availability for emergency or out-of-hours escalations."
            />
            <Checkbox
              id="profile-notify-ops"
              label="Notify ops team"
              checked={Boolean(profileForm.notifyOpsTeam)}
              onChange={handleProfileChange('notifyOpsTeam', 'boolean')}
              disabled={!permissions.canEditProfile}
              description="Send alerts to operations when profile settings change."
            />
          </div>

          {profileFeedback ? (
            <p
              className={`text-sm ${profileFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
              role="status"
            >
              {profileFeedback.message}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleResetProfile} disabled={profileSaving}>
              Reset changes
            </Button>
            <Button type="submit" variant="primary" loading={profileSaving} disabled={!permissions.canEditProfile}>
              Save profile
            </Button>
          </div>
        </form>
      </section>

      <section
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        aria-labelledby="serviceman-availability-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="serviceman-availability-heading" className="text-xl font-semibold text-primary">
              Shift availability
            </h2>
            <p className="mt-2 text-sm text-slate-600">Manage weekly coverage windows and standby shifts.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setAvailabilityModal({ open: true, initialValue: null })}
            disabled={!permissions.canManageAvailability}
          >
            Add availability
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {availability.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                    No availability windows captured yet.
                  </td>
                </tr>
              ) : (
                availability.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-medium text-slate-700">{DAY_LABELS[entry.dayOfWeek] ?? entry.dayOfWeek}</td>
                    <td className="px-4 py-3 text-slate-600">{formatTimeRange(entry.startTime, entry.endTime)}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={SHIFT_STATUS_TONES[entry.status] ?? 'neutral'}>
                        {entry.status?.replace('_', ' ') ?? '—'}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.locationLabel || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAvailabilityModal({ open: true, initialValue: entry })}
                          disabled={!permissions.canManageAvailability}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() =>
                            confirmDeletion(
                              () => deleteAvailability(entry.id),
                              'Remove this availability window? This action cannot be undone.'
                            )
                          }
                          disabled={!permissions.canManageAvailability}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        aria-labelledby="serviceman-certifications-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="serviceman-certifications-heading" className="text-xl font-semibold text-primary">
              Certifications & compliance
            </h2>
            <p className="mt-2 text-sm text-slate-600">Track safety passports and compliance expiries.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setCertificationModal({ open: true, initialValue: null })}
            disabled={!permissions.canManageCertifications}
          >
            Add certification
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Issuer</th>
                <th className="px-4 py-3">Credential</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                    No certifications recorded yet.
                  </td>
                </tr>
              ) : (
                certifications.map((cert) => (
                  <tr key={cert.id}>
                    <td className="px-4 py-3 font-medium text-slate-700">{cert.title}</td>
                    <td className="px-4 py-3 text-slate-600">{cert.issuer || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{cert.credentialId || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(cert.issuedOn)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(cert.expiresOn)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCertificationModal({ open: true, initialValue: cert })}
                          disabled={!permissions.canManageCertifications}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() =>
                            confirmDeletion(
                              () => deleteCertification(cert.id),
                              'Remove this certification? This action cannot be undone.'
                            )
                          }
                          disabled={!permissions.canManageCertifications}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" aria-labelledby="serviceman-equipment-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="serviceman-equipment-heading" className="text-xl font-semibold text-primary">
              Equipment & asset readiness
            </h2>
            <p className="mt-2 text-sm text-slate-600">Keep allocation records updated to avoid assignment delays.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setEquipmentModal({ open: true, initialValue: null })}
            disabled={!permissions.canManageEquipment}
          >
            Assign equipment
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Maintenance due</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipment.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-slate-500">
                    No equipment has been assigned yet.
                  </td>
                </tr>
              ) : (
                equipment.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.serialNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={EQUIPMENT_STATUS_TONES[item.status] ?? 'neutral'}>
                        {item.status?.replace('_', ' ') ?? '—'}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.assignedAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.maintenanceDueOn)}</td>
                    <td className="px-4 py-3 text-slate-600">{item.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEquipmentModal({ open: true, initialValue: item })}
                          disabled={!permissions.canManageEquipment}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() =>
                            confirmDeletion(
                              () => deleteEquipment(item.id),
                              'Remove this equipment record? This action cannot be undone.'
                            )
                          }
                          disabled={!permissions.canManageEquipment}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {overview?.quickLinks?.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" aria-labelledby="serviceman-links-heading">
          <h2 id="serviceman-links-heading" className="text-xl font-semibold text-primary">
            Quick launch
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Open supporting dashboards to monitor travel, assignments, and escalations.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {overview.quickLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target={link.target || '_self'}
                rel={link.target === '_blank' ? 'noreferrer' : undefined}
                className="block rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-primary">{link.label}</p>
                <p className="mt-2 text-sm text-slate-600">{link.description}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <AvailabilityModal
        open={availabilityModal.open}
        onClose={closeAvailabilityModal}
        onSubmit={handleAvailabilitySubmit}
        initialValue={availabilityModal.initialValue}
        saving={modalSaving}
      />
      <CertificationModal
        open={certificationModal.open}
        onClose={closeCertificationModal}
        onSubmit={handleCertificationSubmit}
        initialValue={certificationModal.initialValue}
        saving={modalSaving}
      />
      <EquipmentModal
        open={equipmentModal.open}
        onClose={closeEquipmentModal}
        onSubmit={handleEquipmentSubmit}
        initialValue={equipmentModal.initialValue}
        saving={modalSaving}
      />
    </div>
  );
}

ServicemanOverviewModule.propTypes = {
  analytics: PropTypes.shape({}),
  metadata: PropTypes.shape({
    lastSyncedAt: PropTypes.string
  })
};

ServicemanOverviewModule.defaultProps = {
  analytics: undefined,
  metadata: undefined
};
