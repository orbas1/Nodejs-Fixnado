const BASE_ENDPOINT = '/api/admin/enterprise/accounts';

export const DEFAULT_SUMMARY = {
  total: 0,
  active: 0,
  pilot: 0,
  critical: 0,
  archived: 0,
  sites: 0,
  stakeholders: 0,
  playbooks: 0
};

async function parseResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  let errorPayload = null;
  try {
    errorPayload = await response.json();
  } catch (error) {
    // ignore JSON parse errors
  }

  const message = errorPayload?.message || fallbackMessage;
  const error = new Error(message);
  error.status = response.status;
  error.details = errorPayload;
  throw error;
}

function normaliseAccount(payload = {}) {
  return {
    ...payload,
    sites: Array.isArray(payload.sites) ? payload.sites : [],
    stakeholders: Array.isArray(payload.stakeholders) ? payload.stakeholders : [],
    playbooks: Array.isArray(payload.playbooks) ? payload.playbooks : []
  };
}

export async function listEnterpriseAccounts({ includeArchived = false, signal } = {}) {
  const url = includeArchived ? `${BASE_ENDPOINT}?includeArchived=true` : BASE_ENDPOINT;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await parseResponse(response, 'Failed to load enterprise accounts');
  const accounts = payload?.data?.accounts ?? [];
  const summary = {
    ...DEFAULT_SUMMARY,
    ...(payload?.data?.summary ?? { total: accounts.length })
  };
  return {
    accounts: accounts.map((account) => normaliseAccount(account)),
    summary
  };
}

export async function createEnterpriseAccount(body) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to create enterprise account');
  return normaliseAccount(payload?.data ?? {});
}

export async function updateEnterpriseAccount(accountId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to update enterprise account');
  return normaliseAccount(payload?.data ?? {});
}

export async function archiveEnterpriseAccount(accountId) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/archive`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });

  const payload = await parseResponse(response, 'Failed to archive enterprise account');
  return normaliseAccount(payload?.data ?? {});
}

export async function createEnterpriseSite(accountId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/sites`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to create enterprise site');
  return payload?.data ?? {};
}

export async function updateEnterpriseSite(accountId, siteId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/sites/${siteId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to update enterprise site');
  return payload?.data ?? {};
}

export async function deleteEnterpriseSite(accountId, siteId) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/sites/${siteId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  await parseResponse(response, 'Failed to delete enterprise site');
}

export async function createEnterpriseStakeholder(accountId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/stakeholders`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to create enterprise stakeholder');
  return payload?.data ?? {};
}

export async function updateEnterpriseStakeholder(accountId, stakeholderId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/stakeholders/${stakeholderId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to update enterprise stakeholder');
  return payload?.data ?? {};
}

export async function deleteEnterpriseStakeholder(accountId, stakeholderId) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/stakeholders/${stakeholderId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  await parseResponse(response, 'Failed to delete enterprise stakeholder');
}

export async function createEnterprisePlaybook(accountId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/playbooks`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to create enterprise playbook');
  return payload?.data ?? {};
}

export async function updateEnterprisePlaybook(accountId, playbookId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/playbooks/${playbookId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to update enterprise playbook');
  return payload?.data ?? {};
}

export async function deleteEnterprisePlaybook(accountId, playbookId) {
  const response = await fetch(`${BASE_ENDPOINT}/${accountId}/playbooks/${playbookId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  await parseResponse(response, 'Failed to delete enterprise playbook');
}
