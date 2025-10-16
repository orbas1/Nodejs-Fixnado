import {
  listEnterpriseAccounts,
  getEnterpriseAccountById,
  createEnterpriseAccount,
  updateEnterpriseAccount,
  archiveEnterpriseAccount,
  createEnterpriseSite,
  updateEnterpriseSite,
  deleteEnterpriseSite,
  createEnterpriseStakeholder,
  updateEnterpriseStakeholder,
  deleteEnterpriseStakeholder,
  createEnterprisePlaybook,
  updateEnterprisePlaybook,
  deleteEnterprisePlaybook,
  getAccountSummary
} from '../services/enterpriseAdminService.js';

export async function listEnterpriseAccountsHandler(req, res, next) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const accounts = await listEnterpriseAccounts({ includeArchived });
    const summary = getAccountSummary(accounts);
    res.json({ data: { accounts, summary } });
  } catch (error) {
    next(error);
  }
}

export async function getEnterpriseAccountHandler(req, res, next) {
  try {
    const account = await getEnterpriseAccountById(req.params.accountId);
    res.json({ data: account });
  } catch (error) {
    next(error);
  }
}

export async function createEnterpriseAccountHandler(req, res, next) {
  try {
    const account = await createEnterpriseAccount({ payload: req.body, actorId: req.user.id });
    res.status(201).json({ data: account });
  } catch (error) {
    next(error);
  }
}

export async function updateEnterpriseAccountHandler(req, res, next) {
  try {
    const account = await updateEnterpriseAccount({
      accountId: req.params.accountId,
      payload: req.body,
      actorId: req.user.id
    });
    res.json({ data: account });
  } catch (error) {
    next(error);
  }
}

export async function archiveEnterpriseAccountHandler(req, res, next) {
  try {
    const account = await archiveEnterpriseAccount({ accountId: req.params.accountId, actorId: req.user.id });
    res.json({ data: account });
  } catch (error) {
    next(error);
  }
}

export async function createEnterpriseSiteHandler(req, res, next) {
  try {
    const site = await createEnterpriseSite({
      accountId: req.params.accountId,
      payload: req.body,
      actorId: req.user.id
    });
    res.status(201).json({ data: site });
  } catch (error) {
    next(error);
  }
}

export async function updateEnterpriseSiteHandler(req, res, next) {
  try {
    const site = await updateEnterpriseSite({
      accountId: req.params.accountId,
      siteId: req.params.siteId,
      payload: req.body,
      actorId: req.user.id
    });
    res.json({ data: site });
  } catch (error) {
    next(error);
  }
}

export async function deleteEnterpriseSiteHandler(req, res, next) {
  try {
    await deleteEnterpriseSite({ accountId: req.params.accountId, siteId: req.params.siteId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createEnterpriseStakeholderHandler(req, res, next) {
  try {
    const stakeholder = await createEnterpriseStakeholder({
      accountId: req.params.accountId,
      payload: req.body,
      actorId: req.user.id
    });
    res.status(201).json({ data: stakeholder });
  } catch (error) {
    next(error);
  }
}

export async function updateEnterpriseStakeholderHandler(req, res, next) {
  try {
    const stakeholder = await updateEnterpriseStakeholder({
      accountId: req.params.accountId,
      stakeholderId: req.params.stakeholderId,
      payload: req.body,
      actorId: req.user.id
    });
    res.json({ data: stakeholder });
  } catch (error) {
    next(error);
  }
}

export async function deleteEnterpriseStakeholderHandler(req, res, next) {
  try {
    await deleteEnterpriseStakeholder({
      accountId: req.params.accountId,
      stakeholderId: req.params.stakeholderId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createEnterprisePlaybookHandler(req, res, next) {
  try {
    const playbook = await createEnterprisePlaybook({
      accountId: req.params.accountId,
      payload: req.body,
      actorId: req.user.id
    });
    res.status(201).json({ data: playbook });
  } catch (error) {
    next(error);
  }
}

export async function updateEnterprisePlaybookHandler(req, res, next) {
  try {
    const playbook = await updateEnterprisePlaybook({
      accountId: req.params.accountId,
      playbookId: req.params.playbookId,
      payload: req.body,
      actorId: req.user.id
    });
    res.json({ data: playbook });
  } catch (error) {
    next(error);
  }
}

export async function deleteEnterprisePlaybookHandler(req, res, next) {
  try {
    await deleteEnterprisePlaybook({ accountId: req.params.accountId, playbookId: req.params.playbookId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export default {
  listEnterpriseAccountsHandler,
  getEnterpriseAccountHandler,
  createEnterpriseAccountHandler,
  updateEnterpriseAccountHandler,
  archiveEnterpriseAccountHandler,
  createEnterpriseSiteHandler,
  updateEnterpriseSiteHandler,
  deleteEnterpriseSiteHandler,
  createEnterpriseStakeholderHandler,
  updateEnterpriseStakeholderHandler,
  deleteEnterpriseStakeholderHandler,
  createEnterprisePlaybookHandler,
  updateEnterprisePlaybookHandler,
  deleteEnterprisePlaybookHandler
};
