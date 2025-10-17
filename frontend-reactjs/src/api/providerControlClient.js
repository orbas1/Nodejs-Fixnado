import { PanelApiError } from './panelClient.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

function toQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') {
      return;
    }
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

async function request(path, { method = 'GET', body, signal, headers } = {}) {
  const response = await fetch(path, {
    method,
    body,
    signal,
    headers: headers ? { ...headers } : undefined,
    credentials: 'include'
  });

  if (!response.ok) {
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    throw new PanelApiError(payload?.message || 'Provider control request failed', response.status, {
      code: payload?.code,
      cause: payload
    });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

const fallbackCrewMember = {
  id: 'crew-fallback-1',
  fullName: 'Fallback Crew Lead',
  role: 'Crew lead',
  email: 'crewlead@example.com',
  phone: '+44 20 1234 5678',
  avatarUrl: null,
  status: 'active',
  employmentType: 'employee',
  timezone: 'Europe/London',
  defaultShiftStart: '07:00',
  defaultShiftEnd: '16:00',
  skills: ['HVAC', 'Electrical'],
  notes: 'Offline sample data.',
  allowedRoles: ['provider_manager'],
  availability: [
    {
      id: 'availability-fallback-1',
      dayOfWeek: 'monday',
      startTime: '07:00',
      endTime: '16:00',
      status: 'available',
      location: 'Docklands depot'
    }
  ],
  deployments: [
    {
      id: 'deployment-fallback-1',
      title: 'Retail rollout standby',
      assignmentType: 'standby',
      referenceId: 'STBY-001',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      location: 'Canary Wharf',
      status: 'scheduled',
      allowedRoles: ['provider_manager']
    }
  ],
  delegations: [
    {
      id: 'delegation-fallback-1',
      delegateName: 'Night Supervisor',
      delegateEmail: 'night.ops@example.com',
      status: 'scheduled',
      scope: ['approvals', 'communications'],
      startAt: new Date().toISOString(),
      endAt: null,
      allowedRoles: ['operations']
    }
  ]
};

const fallbackResponse = {
  company: {
    id: 'company-fallback',
    name: 'Provider Operations (offline)'
  },
  summary: {
    activeCrew: 1,
    standbyCrew: 0,
    onLeave: 0,
    upcomingDeployments: 1,
    delegationsActive: 0
  },
  crewMembers: [fallbackCrewMember],
  deployments: fallbackCrewMember.deployments,
  delegations: fallbackCrewMember.delegations,
  rota: [
    {
      day: 'monday',
      slots: [
        {
          id: 'availability-fallback-1',
          crewMemberId: fallbackCrewMember.id,
          crewMemberName: fallbackCrewMember.fullName,
          status: 'available',
          startTime: '07:00',
          endTime: '16:00',
          location: 'Docklands depot'
        }
      ]
    },
    { day: 'tuesday', slots: [] },
    { day: 'wednesday', slots: [] },
    { day: 'thursday', slots: [] },
    { day: 'friday', slots: [] },
    { day: 'saturday', slots: [] },
    { day: 'sunday', slots: [] }
  ]
};

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normaliseCrewMember(member) {
  return {
    id: member.id,
    fullName: member.fullName || member.name || 'Crew member',
    role: member.role || null,
    email: member.email || null,
    phone: member.phone || null,
    avatarUrl: member.avatarUrl || null,
    status: member.status || 'active',
    employmentType: member.employmentType || 'employee',
    timezone: member.timezone || null,
    defaultShiftStart: member.defaultShiftStart || null,
    defaultShiftEnd: member.defaultShiftEnd || null,
    skills: ensureArray(member.skills),
    notes: member.notes || null,
    allowedRoles: ensureArray(member.allowedRoles || member.metadata?.allowedRoles),
    availability: ensureArray(member.availability).map((slot, index) => ({
      id: slot.id || `availability-${member.id}-${index}`,
      dayOfWeek: slot.dayOfWeek || slot.day || 'monday',
      startTime: slot.startTime || null,
      endTime: slot.endTime || null,
      status: slot.status || 'available',
      location: slot.location || null,
      effectiveFrom: slot.effectiveFrom || null,
      effectiveTo: slot.effectiveTo || null,
      notes: slot.notes || null
    })),
    deployments: ensureArray(member.deployments).map((deployment, index) => ({
      id: deployment.id || `deployment-${member.id}-${index}`,
      title: deployment.title || 'Deployment',
      assignmentType: deployment.assignmentType || 'booking',
      referenceId: deployment.referenceId || null,
      startAt: deployment.startAt || null,
      endAt: deployment.endAt || null,
      location: deployment.location || null,
      status: deployment.status || 'scheduled',
      notes: deployment.notes || null,
      allowedRoles: ensureArray(deployment.allowedRoles || deployment.metadata?.allowedRoles)
    })),
    delegations: ensureArray(member.delegations).map((delegation, index) => ({
      id: delegation.id || `delegation-${member.id}-${index}`,
      delegateName: delegation.delegateName || delegation.name || 'Delegate',
      delegateEmail: delegation.delegateEmail || null,
      delegatePhone: delegation.delegatePhone || null,
      role: delegation.role || null,
      status: delegation.status || 'scheduled',
      scope: ensureArray(delegation.scope),
      startAt: delegation.startAt || null,
      endAt: delegation.endAt || null,
      notes: delegation.notes || null,
      allowedRoles: ensureArray(delegation.allowedRoles || delegation.metadata?.allowedRoles)
    }))
  };
}

function normaliseCrewManagement(payload = {}) {
  const root = payload?.data ?? payload;
  const crewMembers = ensureArray(root.crewMembers || root.crew); 
  const deployments = ensureArray(root.deployments).map((deployment, index) => ({
    id: deployment.id || `deployment-${index}`,
    crewMemberId: deployment.crewMemberId || deployment.crewId || null,
    crewMemberName: deployment.crewMemberName || deployment.crewName || null,
    title: deployment.title || 'Deployment',
    assignmentType: deployment.assignmentType || 'booking',
    referenceId: deployment.referenceId || null,
    startAt: deployment.startAt || null,
    endAt: deployment.endAt || null,
    location: deployment.location || null,
    status: deployment.status || 'scheduled',
    notes: deployment.notes || null,
    allowedRoles: ensureArray(deployment.allowedRoles || deployment.metadata?.allowedRoles)
  }));

  const delegations = ensureArray(root.delegations).map((delegation, index) => ({
    id: delegation.id || `delegation-${index}`,
    crewMemberId: delegation.crewMemberId || delegation.crewId || null,
    crewMemberName: delegation.crewMemberName || delegation.crewName || null,
    delegateName: delegation.delegateName || delegation.name || 'Delegate',
    delegateEmail: delegation.delegateEmail || null,
    delegatePhone: delegation.delegatePhone || null,
    role: delegation.role || null,
    status: delegation.status || 'scheduled',
    scope: ensureArray(delegation.scope),
    startAt: delegation.startAt || null,
    endAt: delegation.endAt || null,
    notes: delegation.notes || null,
    allowedRoles: ensureArray(delegation.allowedRoles || delegation.metadata?.allowedRoles)
  }));

  return {
    data: {
      company: {
        id: root.company?.id || root.meta?.companyId || 'company',
        name: root.company?.name || root.company?.label || 'Provider operations'
      },
      summary: {
        activeCrew: root.summary?.activeCrew ?? 0,
        standbyCrew: root.summary?.standbyCrew ?? 0,
        onLeave: root.summary?.onLeave ?? 0,
        upcomingDeployments: root.summary?.upcomingDeployments ?? deployments.length,
        delegationsActive: root.summary?.delegationsActive ?? delegations.filter((item) => item.status === 'active').length
      },
      crewMembers: crewMembers.map(normaliseCrewMember),
      deployments,
      delegations,
      rota: ensureArray(root.rota || root.availability || []).map((entry, index) => ({
        day: entry.day || entry.dayOfWeek || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index] || 'monday',
        slots: ensureArray(entry.slots).map((slot, slotIndex) => ({
          id: slot.id || `rota-${index}-${slotIndex}`,
          crewMemberId: slot.crewMemberId || null,
          crewMemberName: slot.crewMemberName || null,
          status: slot.status || 'available',
          startTime: slot.startTime || null,
          endTime: slot.endTime || null,
          location: slot.location || null
        }))
      }))
    },
    meta: {
      companyId: root.company?.id || root.meta?.companyId || null,
      generatedAt: root.meta?.generatedAt || new Date().toISOString(),
      offline: false
    }
  };
}

export async function getProviderCrewControl(options = {}) {
  try {
    const query = toQueryString({ companyId: options.companyId });
    const response = await request(`/provider-control/crew${query}`, { signal: options.signal });
    return normaliseCrewManagement(response);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Provider crew control falling back to sample data', error);
      return {
        data: fallbackResponse,
        meta: {
          companyId: fallbackResponse.company.id,
          generatedAt: new Date().toISOString(),
          offline: true
        }
      };
    }
    throw error;
  }
}

export async function createProviderCrewMember(payload, options = {}) {
  const response = await request(`/provider-control/crew-members${toQueryString({ companyId: options.companyId })}`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: jsonHeaders,
    signal: options.signal
  });
  return normaliseCrewMember(response?.data ?? response);
}

export async function updateProviderCrewMember(crewMemberId, payload, options = {}) {
  const response = await request(
    `/provider-control/crew-members/${encodeURIComponent(crewMemberId)}${toQueryString({ companyId: options.companyId })}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: jsonHeaders,
      signal: options.signal
    }
  );
  return normaliseCrewMember(response?.data ?? response);
}

export async function deleteProviderCrewMember(crewMemberId, options = {}) {
  await request(
    `/provider-control/crew-members/${encodeURIComponent(crewMemberId)}${toQueryString({ companyId: options.companyId })}`,
    {
      method: 'DELETE',
      signal: options.signal
    }
  );
}

export async function upsertCrewAvailability(crewMemberId, payload, options = {}) {
  const basePath = `/provider-control/crew-members/${encodeURIComponent(crewMemberId)}/availability`;
  const hasId = Boolean(payload?.id || options?.availabilityId);
  const path = hasId
    ? `${basePath}/${encodeURIComponent(payload.id || options.availabilityId)}`
    : basePath;
  const response = await request(`${path}${toQueryString({ companyId: options.companyId })}`, {
    method: hasId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
    headers: jsonHeaders,
    signal: options.signal
  });
  return response?.data ?? response;
}

export async function deleteCrewAvailability(crewMemberId, availabilityId, options = {}) {
  await request(
    `/provider-control/crew-members/${encodeURIComponent(crewMemberId)}/availability/${encodeURIComponent(availabilityId)}${toQueryString({ companyId: options.companyId })}`,
    { method: 'DELETE', signal: options.signal }
  );
}

export async function upsertCrewDeployment(payload, options = {}) {
  const hasId = Boolean(payload?.id || options?.deploymentId);
  const path = hasId
    ? `/provider-control/deployments/${encodeURIComponent(payload.id || options.deploymentId)}`
    : '/provider-control/deployments';
  const response = await request(`${path}${toQueryString({ companyId: options.companyId })}`, {
    method: hasId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
    headers: jsonHeaders,
    signal: options.signal
  });
  return response?.data ?? response;
}

export async function deleteCrewDeployment(deploymentId, options = {}) {
  await request(
    `/provider-control/deployments/${encodeURIComponent(deploymentId)}${toQueryString({ companyId: options.companyId })}`,
    { method: 'DELETE', signal: options.signal }
  );
}

export async function upsertCrewDelegation(payload, options = {}) {
  const hasId = Boolean(payload?.id || options?.delegationId);
  const path = hasId
    ? `/provider-control/delegations/${encodeURIComponent(payload.id || options.delegationId)}`
    : '/provider-control/delegations';
  const response = await request(`${path}${toQueryString({ companyId: options.companyId })}`, {
    method: hasId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
    headers: jsonHeaders,
    signal: options.signal
  });
  return response?.data ?? response;
}

export async function deleteCrewDelegation(delegationId, options = {}) {
  await request(
    `/provider-control/delegations/${encodeURIComponent(delegationId)}${toQueryString({ companyId: options.companyId })}`,
    { method: 'DELETE', signal: options.signal }
  );
}

export default {
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
};
