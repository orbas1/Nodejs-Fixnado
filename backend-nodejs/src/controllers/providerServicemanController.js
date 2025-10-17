import {
  listProviderServicemen,
  createProviderServiceman,
  updateProviderServiceman,
  deleteProviderServiceman
} from '../services/providerServicemanService.js';

function buildError(error, fallbackMessage = 'unexpected_error') {
  if (error?.statusCode) {
    return error;
  }
  const wrapped = new Error(fallbackMessage);
  wrapped.statusCode = 500;
  wrapped.cause = error;
  return wrapped;
}

export async function listProviderServicemenHandler(req, res, next) {
  try {
    const data = await listProviderServicemen({
      actor: req.user,
      companyId: req.query.companyId
    });
    res.json({ data });
  } catch (error) {
    next(buildError(error, 'unable_to_list_servicemen'));
  }
}

export async function createProviderServicemanHandler(req, res, next) {
  try {
    const serviceman = await createProviderServiceman({
      actor: req.user,
      companyId: req.query.companyId,
      payload: req.body ?? {}
    });
    res.status(201).json({ data: serviceman });
  } catch (error) {
    next(buildError(error, 'unable_to_create_serviceman'));
  }
}

export async function updateProviderServicemanHandler(req, res, next) {
  try {
    const serviceman = await updateProviderServiceman({
      actor: req.user,
      companyId: req.query.companyId,
      servicemanId: req.params.servicemanId,
      payload: req.body ?? {}
    });
    res.json({ data: serviceman });
  } catch (error) {
    next(buildError(error, 'unable_to_update_serviceman'));
  }
}

export async function deleteProviderServicemanHandler(req, res, next) {
  try {
    await deleteProviderServiceman({
      actor: req.user,
      companyId: req.query.companyId,
      servicemanId: req.params.servicemanId
    });
    res.status(204).send();
  } catch (error) {
    next(buildError(error, 'unable_to_delete_serviceman'));
  }
}
