import {
  buildProviderCampaignWorkspace,
  createProviderCampaign,
  updateProviderCampaign,
  createProviderCampaignFlight,
  saveProviderTargeting,
  createProviderCampaignCreative,
  updateProviderCampaignCreative,
  deleteProviderCampaignCreative,
  saveProviderAudienceSegments,
  saveProviderPlacements,
  recordProviderCampaignMetrics,
  getProviderCampaign
} from '../services/providerCampaignService.js';

function resolveStatus(error) {
  if (!error) return 500;
  if (error.statusCode) return error.statusCode;
  if (error.status) return error.status;
  return 500;
}

export async function getProviderCampaignWorkspace(req, res, next) {
  try {
    const workspace = await buildProviderCampaignWorkspace({
      companyId: req.query.companyId,
      actor: req.user
    });
    res.json({ data: workspace, meta: { generatedAt: workspace.generatedAt } });
  } catch (error) {
    next(error);
  }
}

export async function listProviderCampaigns(req, res, next) {
  try {
    const workspace = await buildProviderCampaignWorkspace({
      companyId: req.query.companyId,
      actor: req.user
    });
    res.json({ data: workspace.campaigns, meta: { generatedAt: workspace.generatedAt } });
  } catch (error) {
    next(error);
  }
}

export async function getProviderCampaignDetail(req, res, next) {
  try {
    const campaign = await getProviderCampaign({
      actor: req.user,
      companyId: req.query.companyId,
      campaignId: req.params.campaignId
    });
    res.json({ data: campaign });
  } catch (error) {
    next(error);
  }
}

export async function createProviderCampaignHandler(req, res, next) {
  try {
    const campaign = await createProviderCampaign({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      payload: req.body
    });
    res.status(201).json({ data: campaign });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function updateProviderCampaignHandler(req, res, next) {
  try {
    const campaign = await updateProviderCampaign({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      campaignId: req.params.campaignId,
      payload: req.body
    });
    res.json({ data: campaign });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function createProviderCampaignFlightHandler(req, res, next) {
  try {
    const flight = await createProviderCampaignFlight({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      campaignId: req.params.campaignId,
      payload: req.body
    });
    res.status(201).json({ data: flight });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function saveProviderTargetingHandler(req, res, next) {
  try {
    const rules = await saveProviderTargeting({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      campaignId: req.params.campaignId,
      rules: req.body?.rules || []
    });
    res.json({ data: rules });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function createProviderCreativeHandler(req, res, next) {
  try {
    const creative = await createProviderCampaignCreative({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      campaignId: req.params.campaignId,
      payload: req.body
    });
    res.status(201).json({ data: creative });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function updateProviderCreativeHandler(req, res, next) {
  try {
    const creative = await updateProviderCampaignCreative({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      campaignId: req.params.campaignId,
      creativeId: req.params.creativeId,
      payload: req.body
    });
    res.json({ data: creative });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function deleteProviderCreativeHandler(req, res, next) {
  try {
    await deleteProviderCampaignCreative({
      actor: req.user,
      companyId: req.query.companyId,
      campaignId: req.params.campaignId,
      creativeId: req.params.creativeId
    });
    res.status(204).end();
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function saveProviderSegmentsHandler(req, res, next) {
  try {
    const segments = await saveProviderAudienceSegments({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      campaignId: req.params.campaignId,
      segments: req.body?.segments || []
    });
    res.json({ data: segments });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function saveProviderPlacementsHandler(req, res, next) {
  try {
    const placements = await saveProviderPlacements({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      campaignId: req.params.campaignId,
      placements: req.body?.placements || []
    });
    res.json({ data: placements });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}

export async function recordProviderMetricsHandler(req, res, next) {
  try {
    const metric = await recordProviderCampaignMetrics({
      actor: req.user,
      companyId: req.body?.companyId || req.query.companyId,
      campaignId: req.params.campaignId,
      payload: req.body
    });
    res.status(201).json({ data: metric });
  } catch (error) {
    const status = resolveStatus(error);
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message });
    }
    return next(error);
  }
}
