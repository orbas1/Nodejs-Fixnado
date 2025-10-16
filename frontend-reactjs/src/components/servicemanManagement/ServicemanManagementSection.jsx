import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import servicemanManagementClient from '../../api/servicemanManagementClient.js';
import SummaryPills from './SummaryPills.jsx';
import RosterList from './RosterList.jsx';
import ShiftPlanner from './ShiftPlanner.jsx';
import CertificationTracker from './CertificationTracker.jsx';
import CoverageInsights from './CoverageInsights.jsx';
import FollowUpActions from './FollowUpActions.jsx';
import ProfileModal from './modals/ProfileModal.jsx';
import ShiftModal from './modals/ShiftModal.jsx';
import CertificationModal from './modals/CertificationModal.jsx';
import DeleteConfirmModal from './modals/DeleteConfirmModal.jsx';
import { toInputValue } from './constants.js';

const SectionHeader = ({ section }) => (
  <div className="mb-6 space-y-2">
    <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
    {section.description ? <p className="text-sm text-slate-600 max-w-2xl">{section.description}</p> : null}
  </div>
);

SectionHeader.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired
};

const initialModalState = { type: null, mode: null, profile: null, shift: null, certification: null, day: null };

const initialDeleteState = { open: false, type: null, label: '', message: '', loading: false };

export default function ServicemanManagementSection({ section, onRefresh }) {
  const [localData, setLocalData] = useState(section.data ?? {});

  useEffect(() => {
    setLocalData(section.data ?? {});
  }, [section.data]);

  const data = localData ?? {};
  const summary = data.summary ?? {};
  const roster = useMemo(() => (Array.isArray(data.roster) ? data.roster : []), [data.roster]);
  const schedule = data.schedule ?? {};
  const scheduleDays = useMemo(
    () => (Array.isArray(schedule.days) ? schedule.days : []),
    [schedule.days]
  );
  const scheduleShifts = useMemo(
    () => (Array.isArray(schedule.shifts) ? schedule.shifts : []),
    [schedule.shifts]
  );
  const certifications = useMemo(
    () => (Array.isArray(data.certifications) ? data.certifications : []),
    [data.certifications]
  );
  const coverage = useMemo(
    () => ({
      regions: Array.isArray(data.coverage?.regions) ? data.coverage.regions : [],
      actions: Array.isArray(data.coverage?.actions) ? data.coverage.actions : []
    }),
    [data.coverage]
  );
  const formOptions = data.formOptions ?? {};
  const context = data.context ?? {};

  const [modalState, setModalState] = useState(initialModalState);
  const [formValues, setFormValues] = useState({});
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteState, setDeleteState] = useState(initialDeleteState);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }), []);

  const shiftMap = useMemo(() => {
    const map = new Map();
    scheduleShifts.forEach((shift) => {
      map.set(`${shift.profileId}|${shift.shiftDate}`, shift);
    });
    return map;
  }, [scheduleShifts]);

  const profileLookup = useMemo(() => {
    const map = new Map();
    roster.forEach((profile) => {
      map.set(profile.id, profile);
    });
    return map;
  }, [roster]);

  const updateField = useCallback(
    (field) => (event) => {
      setFormValues((previous) => ({ ...previous, [field]: event.target.value }));
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState(initialModalState);
    setFormValues({});
    setModalError(null);
    setSubmitting(false);
  }, []);

  const openProfileModal = useCallback(
    (profile = null) => {
      if (profile) {
        setModalState({ type: 'profile', mode: 'edit', profile, shift: null, certification: null, day: null });
        setFormValues({
          displayName: toInputValue(profile.displayName),
          role: toInputValue(profile.role),
          status: toInputValue(profile.status || formOptions.statuses?.[0] || 'active'),
          employmentType: toInputValue(profile.employmentType || formOptions.employmentTypes?.[0] || 'full_time'),
          primaryZone: toInputValue(profile.primaryZone),
          contactEmail: toInputValue(profile.contactEmail),
          contactPhone: toInputValue(profile.contactPhone),
          avatarUrl: toInputValue(profile.avatarUrl),
          skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
          notes: toInputValue(profile.notes)
        });
      } else {
        setModalState({ type: 'profile', mode: 'create', profile: null, shift: null, certification: null, day: null });
        setFormValues({
          displayName: '',
          role: '',
          status: formOptions.statuses?.[0] || 'active',
          employmentType: formOptions.employmentTypes?.[0] || 'full_time',
          primaryZone: '',
          contactEmail: '',
          contactPhone: '',
          avatarUrl: '',
          skills: '',
          notes: ''
        });
      }
      setModalError(null);
    },
    [formOptions.employmentTypes, formOptions.statuses]
  );

  const openShiftModal = useCallback(
    (profile, shift = null, day = null) => {
      if (!profile) return;
      if (shift) {
        setModalState({ type: 'shift', mode: 'edit', profile, shift, certification: null, day });
        setFormValues({
          shiftDate: shift.shiftDate,
          startTime: shift.startTime,
          endTime: shift.endTime,
          status: shift.status || formOptions.shiftStatuses?.[0] || 'available',
          assignmentTitle: toInputValue(shift.assignmentTitle),
          location: toInputValue(shift.location),
          notes: toInputValue(shift.notes)
        });
      } else {
        const defaultDay = day ?? scheduleDays[0] ?? null;
        setModalState({ type: 'shift', mode: 'create', profile, shift: null, certification: null, day: defaultDay });
        setFormValues({
          shiftDate: defaultDay?.date || '',
          startTime: '08:00',
          endTime: '16:00',
          status: formOptions.shiftStatuses?.[0] || 'available',
          assignmentTitle: '',
          location: toInputValue(profile.primaryZone),
          notes: ''
        });
      }
      setModalError(null);
    },
    [formOptions.shiftStatuses, scheduleDays]
  );

  const openCertificationModal = useCallback(
    (profile, certification = null) => {
      if (!profile) return;
      if (certification) {
        setModalState({ type: 'certification', mode: 'edit', profile, shift: null, certification, day: null });
        setFormValues({
          name: toInputValue(certification.name),
          issuer: toInputValue(certification.issuer),
          status: certification.status || formOptions.certificationStatuses?.[0] || 'valid',
          issuedAt: certification.issuedAt || '',
          expiresAt: certification.expiresAt || '',
          documentUrl: toInputValue(certification.documentUrl),
          notes: toInputValue(certification.notes)
        });
      } else {
        setModalState({ type: 'certification', mode: 'create', profile, shift: null, certification: null, day: null });
        setFormValues({
          name: '',
          issuer: '',
          status: formOptions.certificationStatuses?.[0] || 'valid',
          issuedAt: '',
          expiresAt: '',
          documentUrl: '',
          notes: ''
        });
      }
      setModalError(null);
    },
    [formOptions.certificationStatuses]
  );

  const parseSkills = useCallback((input) => {
    if (!input) return [];
    return input
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (typeof onRefresh === 'function') {
      try {
        await onRefresh();
      } catch (error) {
        console.error('Failed to refresh serviceman dashboard', error);
      }
      return;
    }

    try {
      const snapshot = await servicemanManagementClient.getOverview({
        companyId: context.companyId ?? undefined,
        timezone: context.timezone ?? undefined
      });
      setLocalData(snapshot ?? {});
    } catch (error) {
      console.error('Failed to load latest serviceman snapshot', error);
    }
  }, [context.companyId, context.timezone, onRefresh]);

  const handleProfileSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmitting(true);
      setModalError(null);
      const payload = {
        displayName: formValues.displayName?.trim(),
        role: formValues.role?.trim(),
        status: formValues.status,
        employmentType: formValues.employmentType,
        primaryZone: formValues.primaryZone?.trim() || null,
        contactEmail: formValues.contactEmail?.trim() || null,
        contactPhone: formValues.contactPhone?.trim() || null,
        avatarUrl: formValues.avatarUrl?.trim() || null,
        skills: parseSkills(formValues.skills),
        notes: formValues.notes?.trim() || null
      };

      try {
        if (modalState.mode === 'create') {
          if (context.companyId) {
            payload.companyId = context.companyId;
          }
          await servicemanManagementClient.createProfile(payload);
        } else if (modalState.profile) {
          await servicemanManagementClient.updateProfile(modalState.profile.id, payload);
        }
        closeModal();
        await refreshDashboard();
      } catch (error) {
        setModalError(error.message);
      } finally {
        setSubmitting(false);
      }
    },
    [closeModal, context.companyId, formValues, modalState.mode, modalState.profile, parseSkills, refreshDashboard]
  );

  const handleShiftSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!modalState.profile) return;
      setSubmitting(true);
      setModalError(null);
      const payload = {
        shiftDate: formValues.shiftDate,
        startTime: formValues.startTime,
        endTime: formValues.endTime,
        status: formValues.status,
        assignmentTitle: formValues.assignmentTitle?.trim() || null,
        location: formValues.location?.trim() || null,
        notes: formValues.notes?.trim() || null
      };

      try {
        if (modalState.mode === 'create') {
          await servicemanManagementClient.createShift(modalState.profile.id, payload);
        } else if (modalState.shift) {
          await servicemanManagementClient.updateShift(modalState.profile.id, modalState.shift.id, payload);
        }
        closeModal();
        await refreshDashboard();
      } catch (error) {
        setModalError(error.message);
      } finally {
        setSubmitting(false);
      }
    },
    [closeModal, formValues, modalState.mode, modalState.profile, modalState.shift, refreshDashboard]
  );

  const handleCertificationSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!modalState.profile) return;
      setSubmitting(true);
      setModalError(null);
      const payload = {
        name: formValues.name?.trim(),
        issuer: formValues.issuer?.trim() || null,
        status: formValues.status,
        issuedAt: formValues.issuedAt || null,
        expiresAt: formValues.expiresAt || null,
        documentUrl: formValues.documentUrl?.trim() || null,
        notes: formValues.notes?.trim() || null
      };

      try {
        if (modalState.mode === 'create') {
          await servicemanManagementClient.createCertification(modalState.profile.id, payload);
        } else if (modalState.certification) {
          await servicemanManagementClient.updateCertification(
            modalState.profile.id,
            modalState.certification.id,
            payload
          );
        }
        closeModal();
        await refreshDashboard();
      } catch (error) {
        setModalError(error.message);
      } finally {
        setSubmitting(false);
      }
    },
    [closeModal, formValues, modalState.certification, modalState.mode, modalState.profile, refreshDashboard]
  );

  const promptDelete = useCallback(() => {
    if (!modalState.type) return;
    let label = 'Delete record';
    let message = 'Are you sure you want to delete this record?';
    if (modalState.type === 'profile' && modalState.profile?.displayName) {
      label = 'Remove serviceman';
      message = `Remove ${modalState.profile.displayName} from the roster?`;
    }
    if (modalState.type === 'shift') {
      label = 'Delete shift';
      message = 'Remove this shift from the schedule?';
    }
    if (modalState.type === 'certification') {
      label = 'Delete certification';
      message = 'Delete this certification record?';
    }
    setDeleteState({ open: true, type: modalState.type, label, message, loading: false });
  }, [modalState]);

  const confirmDeletion = useCallback(async () => {
    if (!modalState.type || !modalState.profile) {
      setDeleteState(initialDeleteState);
      return;
    }
    setDeleteState((previous) => ({ ...previous, loading: true }));
    setSubmitting(true);
    setModalError(null);

    try {
      if (modalState.type === 'profile') {
        await servicemanManagementClient.deleteProfile(modalState.profile.id);
      } else if (modalState.type === 'shift' && modalState.shift) {
        await servicemanManagementClient.deleteShift(modalState.profile.id, modalState.shift.id);
      } else if (modalState.type === 'certification' && modalState.certification) {
        await servicemanManagementClient.deleteCertification(modalState.profile.id, modalState.certification.id);
      }
      setDeleteState(initialDeleteState);
      closeModal();
      await refreshDashboard();
    } catch (error) {
      setModalError(error.message);
      setDeleteState(initialDeleteState);
    } finally {
      setSubmitting(false);
    }
  }, [closeModal, modalState, refreshDashboard]);

  return (
    <div>
      <SectionHeader section={section} />
      <SummaryPills summary={summary} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <RosterList
            roster={roster}
            onCreateProfile={() => openProfileModal(null)}
            onEditProfile={openProfileModal}
            onPlanShift={(profile) => openShiftModal(profile)}
            onAddCertification={(profile) => openCertificationModal(profile)}
          />
          <ShiftPlanner
            roster={roster}
            scheduleDays={scheduleDays}
            shiftMap={shiftMap}
            timezone={context.timezone}
            onManageShift={(profile, shift, day) => openShiftModal(profile, shift, day)}
          />
          <CertificationTracker
            certifications={certifications}
            profileLookup={profileLookup}
            dateFormatter={dateFormatter}
            onManageCertification={(profile, certification) => openCertificationModal(profile, certification)}
          />
        </div>
        <div className="space-y-6">
          <CoverageInsights coverage={coverage} />
          <FollowUpActions actions={coverage.actions} />
        </div>
      </div>
      <ProfileModal
        open={modalState.type === 'profile'}
        mode={modalState.mode === 'edit' ? 'edit' : 'create'}
        formValues={formValues}
        options={formOptions}
        submitting={submitting}
        error={modalError}
        onClose={closeModal}
        onChange={updateField}
        onSubmit={handleProfileSubmit}
        onDelete={promptDelete}
      />
      <ShiftModal
        open={modalState.type === 'shift'}
        mode={modalState.mode === 'edit' ? 'edit' : 'create'}
        formValues={formValues}
        options={formOptions}
        submitting={submitting}
        error={modalError}
        profile={modalState.profile}
        onClose={closeModal}
        onChange={updateField}
        onSubmit={handleShiftSubmit}
        onDelete={promptDelete}
      />
      <CertificationModal
        open={modalState.type === 'certification'}
        mode={modalState.mode === 'edit' ? 'edit' : 'create'}
        formValues={formValues}
        options={formOptions}
        submitting={submitting}
        error={modalError}
        profile={modalState.profile}
        onClose={closeModal}
        onChange={updateField}
        onSubmit={handleCertificationSubmit}
        onDelete={promptDelete}
      />
      <DeleteConfirmModal
        open={deleteState.open}
        title="Confirm deletion"
        message={deleteState.message}
        confirmLabel={deleteState.label || 'Delete'}
        onCancel={() => setDeleteState(initialDeleteState)}
        onConfirm={confirmDeletion}
        loading={deleteState.loading}
      />
    </div>
  );
}

ServicemanManagementSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    data: PropTypes.shape({
      summary: PropTypes.object,
      roster: PropTypes.array,
      schedule: PropTypes.shape({
        days: PropTypes.array,
        shifts: PropTypes.array
      }),
      certifications: PropTypes.array,
      coverage: PropTypes.shape({
        regions: PropTypes.array,
        actions: PropTypes.array
      }),
      formOptions: PropTypes.object,
      context: PropTypes.object
    })
  }).isRequired,
  onRefresh: PropTypes.func
};

ServicemanManagementSection.defaultProps = {
  onRefresh: undefined
};
