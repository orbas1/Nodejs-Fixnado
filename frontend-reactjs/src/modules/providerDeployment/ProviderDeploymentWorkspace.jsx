import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import CrewRosterSection from './components/CrewRosterSection.jsx';
import DeploymentBoard from './components/DeploymentBoard.jsx';
import AvailabilityPlanner from './components/AvailabilityPlanner.jsx';
import DelegationSection from './components/DelegationSection.jsx';
import CrewMemberModal from './components/modals/CrewMemberModal.jsx';
import AvailabilityModal from './components/modals/AvailabilityModal.jsx';
import DeploymentModal from './components/modals/DeploymentModal.jsx';
import DelegationModal from './components/modals/DelegationModal.jsx';
import { useProviderDeployment } from './ProviderDeploymentProvider.jsx';

function formatTimestamp(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

const initialModalState = { type: null, mode: 'create', data: null, context: {} };

export default function ProviderDeploymentWorkspace() {
  const { t } = useLocale();
  const {
    data,
    loading,
    error,
    meta,
    actions: {
      refresh,
      createCrewMember,
      updateCrewMember,
      deleteCrewMember,
      upsertAvailability,
      deleteAvailability,
      upsertDeployment,
      deleteDeployment,
      upsertDelegation,
      deleteDelegation
    }
  } = useProviderDeployment();
  const [modalState, setModalState] = useState(initialModalState);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const crewMembers = data?.crewMembers ?? [];
  const deployments = data?.deployments ?? [];
  const delegations = data?.delegations ?? [];
  const rota = data?.rota ?? [];
  const summary = data?.summary ?? {};

  const headerMeta = useMemo(() => {
    const snapshotCaption = meta?.offline
      ? t('providerDeployment.meta.delegationsActiveCaptionOffline')
      : t('providerDeployment.meta.delegationsActiveCaptionOnline', {
          timestamp: formatTimestamp(meta?.generatedAt)
        });

    return [
      {
        label: t('providerDeployment.meta.activeCrew'),
        value: String(summary.activeCrew ?? 0),
        caption: t('providerDeployment.meta.activeCrewCaption'),
        emphasis: true
      },
      {
        label: t('providerDeployment.meta.standbyCrew'),
        value: String(summary.standbyCrew ?? 0),
        caption: t('providerDeployment.meta.standbyCrewCaption')
      },
      {
        label: t('providerDeployment.meta.upcomingDeployments'),
        value: String(summary.upcomingDeployments ?? 0),
        caption: t('providerDeployment.meta.upcomingDeploymentsCaption')
      },
      {
        label: t('providerDeployment.meta.delegationsActive'),
        value: String(summary.delegationsActive ?? 0),
        caption: snapshotCaption
      }
    ];
  }, [meta?.generatedAt, meta?.offline, summary.activeCrew, summary.delegationsActive, summary.standbyCrew, summary.upcomingDeployments, t]);

  const openModal = (type, { mode = 'create', data: modalData = null, context = {} } = {}) => {
    setModalState({ type, mode, data: modalData, context });
  };

  const closeModal = () => {
    setModalState(initialModalState);
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleAddCrew = () => openModal('crew', { mode: 'create' });
  const handleEditCrew = (crewMember) => openModal('crew', { mode: 'edit', data: crewMember });
  const handlePlanAvailability = (crewMember) =>
    openModal('availability', {
      mode: 'create',
      context: { crewMemberId: crewMember.id, day: undefined }
    });
  const handleScheduleDeployment = (crewMember) =>
    openModal('deployment', { mode: 'create', context: { crewMemberId: crewMember.id } });
  const handleDelegateCrew = (crewMember) =>
    openModal('delegation', { mode: 'create', context: { crewMemberId: crewMember.id } });

  const handleRemoveCrew = async (crewMember) => {
    if (!crewMember?.id) return;
    const confirmed = window.confirm(
      t('providerDeployment.confirmRemoveCrew', { name: crewMember.fullName })
    );
    if (!confirmed) return;
    setSubmittingDelete(true);
    try {
      await deleteCrewMember(crewMember.id);
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleAvailabilityCreate = (day) => {
    openModal('availability', { mode: 'create', context: { day } });
  };

  const handleAvailabilityEdit = (slot) => {
    if (!slot?.id) return;
    const crewMember = crewMembers.find((member) => member.id === slot.crewMemberId);
    const availabilityRecord = crewMember?.availability?.find((entry) => entry.id === slot.id);
    openModal('availability', {
      mode: 'edit',
      data: availabilityRecord ? { ...availabilityRecord, day: availabilityRecord.dayOfWeek } : { ...slot },
      context: { crewMemberId: slot.crewMemberId, availabilityId: slot.id, day: slot.day || availabilityRecord?.dayOfWeek }
    });
  };

  const handleAvailabilityDelete = async (slot) => {
    if (!slot?.id || !slot?.crewMemberId) return;
    const confirmed = window.confirm(t('providerDeployment.confirmRemoveAvailability'));
    if (!confirmed) return;
    await deleteAvailability(slot.crewMemberId, slot.id);
  };

  const handleDeploymentEdit = (deployment) => {
    openModal('deployment', { mode: 'edit', data: deployment, context: { deploymentId: deployment.id } });
  };

  const handleDeploymentDelete = async (deployment) => {
    if (!deployment?.id) return;
    const confirmed = window.confirm(t('providerDeployment.confirmRemoveDeployment'));
    if (!confirmed) return;
    await deleteDeployment(deployment.id);
  };

  const handleDelegationEdit = (delegation) => {
    openModal('delegation', { mode: 'edit', data: delegation, context: { delegationId: delegation.id } });
  };

  const handleDelegationDelete = async (delegation) => {
    if (!delegation?.id) return;
    const confirmed = window.confirm(t('providerDeployment.confirmRemoveDelegation'));
    if (!confirmed) return;
    await deleteDelegation(delegation.id);
  };

  const selectedCrewMember = useMemo(() => {
    if (modalState.type === 'crew' && modalState.mode === 'edit' && modalState.data) {
      return crewMembers.find((member) => member.id === modalState.data.id) || modalState.data;
    }
    return modalState.data;
  }, [crewMembers, modalState.data, modalState.mode, modalState.type]);

  const availabilityModalData = useMemo(() => {
    if (modalState.type !== 'availability') return null;
    if (modalState.mode === 'edit') {
      if (!modalState.data?.id) return modalState.data;
      const crewMember = crewMembers.find((member) => member.availability?.some((slot) => slot.id === modalState.data.id));
      const availabilityRecord = crewMember?.availability?.find((slot) => slot.id === modalState.data.id);
      if (availabilityRecord) {
        return { ...availabilityRecord, day: availabilityRecord.dayOfWeek };
      }
      return modalState.data;
    }
    return null;
  }, [crewMembers, modalState]);

  const deploymentModalData = useMemo(() => {
    if (modalState.type !== 'deployment') return null;
    if (modalState.mode === 'edit' && modalState.data?.id) {
      return deployments.find((entry) => entry.id === modalState.data.id) || modalState.data;
    }
    return null;
  }, [deployments, modalState]);

  const delegationModalData = useMemo(() => {
    if (modalState.type !== 'delegation') return null;
    if (modalState.mode === 'edit' && modalState.data?.id) {
      return delegations.find((entry) => entry.id === modalState.data.id) || modalState.data;
    }
    return null;
  }, [delegations, modalState]);

  const pageLoading = loading && !data;

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="provider-deployment-management">
      <PageHeader
        eyebrow={t('providerDeployment.eyebrow')}
        title={t('providerDeployment.title')}
        description={t('providerDeployment.description')}
        breadcrumbs={[
          { label: t('providerDeployment.breadcrumbs.provider'), to: '/dashboards/provider' },
          { label: t('providerDeployment.breadcrumbs.centre'), to: '/dashboards/provider/crew-control' },
          { label: t('providerDeployment.breadcrumbs.current') }
        ]}
        actions={[
          {
            label: t('providerDeployment.refreshAction'),
            variant: 'secondary',
            icon: ArrowPathIcon,
            onClick: handleRefresh,
            disabled: loading
          }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-6 pt-16">
        {loading && !pageLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500" role="status" aria-live="polite">
            <Skeleton className="h-4 w-4 rounded-full" />
            <span>{t('providerDeployment.refreshing')}</span>
          </div>
        ) : null}

        {meta?.offline ? (
          <div className="flex items-start gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t('providerDeployment.offlineTitle')}</p>
              <p className="mt-1">{t('providerDeployment.offlineDescription')}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={handleRefresh}>
                {t('providerDeployment.retryConnection')}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p className="font-semibold">{t('providerDeployment.errorTitle')}</p>
            <p className="mt-2">{error.message || t('providerDeployment.errorDescription')}</p>
            <Button variant="ghost" size="sm" className="mt-4" onClick={handleRefresh}>
              {t('providerDeployment.retryAction')}
            </Button>
          </div>
        ) : null}

        {pageLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
          </div>
        ) : (
          <>
            <CrewRosterSection
              crewMembers={crewMembers}
              onAddCrew={handleAddCrew}
              onEditCrew={handleEditCrew}
              onPlanAvailability={handlePlanAvailability}
              onScheduleDeployment={handleScheduleDeployment}
              onDelegateCrew={handleDelegateCrew}
              onRemoveCrew={handleRemoveCrew}
            />

            <AvailabilityPlanner
              rota={rota}
              onCreate={handleAvailabilityCreate}
              onEdit={handleAvailabilityEdit}
              onDelete={handleAvailabilityDelete}
            />

            <DeploymentBoard
              deployments={deployments}
              onCreate={() => openModal('deployment', { mode: 'create' })}
              onEdit={handleDeploymentEdit}
              onDelete={handleDeploymentDelete}
            />

            <DelegationSection
              delegations={delegations}
              onCreate={() => openModal('delegation', { mode: 'create' })}
              onEdit={handleDelegationEdit}
              onDelete={handleDelegationDelete}
            />
          </>
        )}
      </div>

      <CrewMemberModal
        open={modalState.type === 'crew'}
        mode={modalState.mode}
        crewMember={selectedCrewMember}
        onClose={closeModal}
        onSubmit={(payload) =>
          modalState.mode === 'edit' && selectedCrewMember?.id
            ? updateCrewMember(selectedCrewMember.id, payload)
            : createCrewMember(payload)
        }
        onDelete={
          modalState.mode === 'edit' && selectedCrewMember?.id
            ? async () => {
                const confirmed = window.confirm(t('providerDeployment.confirmRemoveCrewSimple'));
                if (!confirmed) return;
                await deleteCrewMember(selectedCrewMember.id);
                closeModal();
              }
            : undefined
        }
      />

      <AvailabilityModal
        open={modalState.type === 'availability'}
        mode={modalState.mode}
        availability={availabilityModalData}
        crewMembers={crewMembers}
        initialCrewMemberId={modalState.context?.crewMemberId || availabilityModalData?.crewMemberId || ''}
        initialDay={modalState.context?.day || availabilityModalData?.day || availabilityModalData?.dayOfWeek || 'monday'}
        onClose={closeModal}
        onSubmit={async (payload) => {
          const { crewMemberId, ...rest } = payload;
          const targetCrewId = crewMemberId || modalState.context?.crewMemberId;
          if (!targetCrewId) {
            throw new Error(t('providerDeployment.errorCrewRequired'));
          }
          await upsertAvailability(targetCrewId, {
            ...rest,
            id: modalState.context?.availabilityId
          });
        }}
        onDelete={
          modalState.mode === 'edit' && modalState.context?.availabilityId && modalState.context?.crewMemberId
            ? async () => {
                const confirmed = window.confirm(t('providerDeployment.confirmRemoveAvailability'));
                if (!confirmed) return;
                await deleteAvailability(modalState.context.crewMemberId, modalState.context.availabilityId);
                closeModal();
              }
            : undefined
        }
      />

      <DeploymentModal
        open={modalState.type === 'deployment'}
        mode={modalState.mode}
        deployment={deploymentModalData}
        crewMembers={crewMembers}
        initialCrewMemberId={modalState.context?.crewMemberId || deploymentModalData?.crewMemberId || ''}
        onClose={closeModal}
        onSubmit={async (payload) => {
          await upsertDeployment({
            ...payload,
            id: modalState.context?.deploymentId || deploymentModalData?.id || undefined
          });
        }}
        onDelete={
          modalState.mode === 'edit' && modalState.context?.deploymentId
            ? async () => {
                const confirmed = window.confirm(t('providerDeployment.confirmRemoveDeployment'));
                if (!confirmed) return;
                await deleteDeployment(modalState.context.deploymentId);
                closeModal();
              }
            : undefined
        }
      />

      <DelegationModal
        open={modalState.type === 'delegation'}
        mode={modalState.mode}
        delegation={delegationModalData}
        crewMembers={crewMembers}
        initialCrewMemberId={modalState.context?.crewMemberId || delegationModalData?.crewMemberId || ''}
        onClose={closeModal}
        onSubmit={async (payload) => {
          await upsertDelegation({
            ...payload,
            id: modalState.context?.delegationId || delegationModalData?.id || undefined
          });
        }}
        onDelete={
          modalState.mode === 'edit' && modalState.context?.delegationId
            ? async () => {
                const confirmed = window.confirm(t('providerDeployment.confirmRemoveDelegation'));
                if (!confirmed) return;
                await deleteDelegation(modalState.context.delegationId);
                closeModal();
              }
            : undefined
        }
      />

      {submittingDelete ? <div aria-live="polite" className="sr-only">{t('providerDeployment.removingCrew')}</div> : null}
    </div>
  );
}
