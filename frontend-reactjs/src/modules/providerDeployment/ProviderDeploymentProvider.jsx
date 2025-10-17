import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  getProviderCrewControl,
  createProviderCrewMember,
  updateProviderCrewMember,
  deleteProviderCrewMember,
  upsertCrewAvailability,
  deleteCrewAvailability,
  upsertCrewDeployment,
  deleteCrewDeployment,
  upsertCrewDelegation,
  deleteCrewDelegation
} from '../../api/providerControlClient.js';

const ProviderDeploymentContext = createContext(null);

export function ProviderDeploymentProvider({ companyId, children }) {
  const [state, setState] = useState({ loading: true, data: null, error: null, meta: null });

  const load = useCallback(
    async (options = {}) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await getProviderCrewControl({ companyId, ...options });
        setState({ loading: false, data: response.data, meta: response.meta, error: null });
        return response;
      } catch (error) {
        setState((current) => ({ ...current, loading: false, error }));
        throw error;
      }
    },
    [companyId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const actions = useMemo(() => {
    const refresh = (options = {}) => load({ ...options, force: true });

    const wrap = async (executor) => {
      const result = await executor();
      await refresh();
      return result;
    };

    return {
      refresh,
      load,
      createCrewMember: (payload) =>
        wrap(() => createProviderCrewMember(payload, { companyId })),
      updateCrewMember: (crewMemberId, payload) =>
        wrap(() => updateProviderCrewMember(crewMemberId, payload, { companyId })),
      deleteCrewMember: (crewMemberId) =>
        wrap(() => deleteProviderCrewMember(crewMemberId, { companyId })),
      upsertAvailability: (crewMemberId, payload) =>
        wrap(() => upsertCrewAvailability(crewMemberId, payload, { companyId })),
      deleteAvailability: (crewMemberId, availabilityId) =>
        wrap(() => deleteCrewAvailability(crewMemberId, availabilityId, { companyId })),
      upsertDeployment: (payload) => wrap(() => upsertCrewDeployment(payload, { companyId })),
      deleteDeployment: (deploymentId) =>
        wrap(() => deleteCrewDeployment(deploymentId, { companyId })),
      upsertDelegation: (payload) => wrap(() => upsertCrewDelegation(payload, { companyId })),
      deleteDelegation: (delegationId) =>
        wrap(() => deleteCrewDelegation(delegationId, { companyId }))
    };
  }, [companyId, load]);

  const value = useMemo(
    () => ({
      companyId,
      state,
      data: state.data,
      meta: state.meta,
      loading: state.loading,
      error: state.error,
      actions
    }),
    [actions, companyId, state]
  );

  return <ProviderDeploymentContext.Provider value={value}>{children}</ProviderDeploymentContext.Provider>;
}

ProviderDeploymentProvider.propTypes = {
  companyId: PropTypes.string,
  children: PropTypes.node.isRequired
};

ProviderDeploymentProvider.defaultProps = {
  companyId: null
};

export function useProviderDeployment() {
  const context = useContext(ProviderDeploymentContext);
  if (!context) {
    throw new Error('useProviderDeployment must be used within a ProviderDeploymentProvider');
  }
  return context;
}

export default ProviderDeploymentProvider;
