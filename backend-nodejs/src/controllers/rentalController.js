import {
  appendRentalCheckpoint,
  approveRentalAgreement,
  cancelRentalAgreement,
  completeRentalInspection,
  getRentalAgreementById,
  listRentalAgreements,
  markRentalReturned,
  recordRentalCheckout,
  requestRentalAgreement,
  scheduleRentalPickup
} from '../services/rentalService.js';

function toResponse(rental) {
  const json = rental.toJSON();
  if (json.RentalCheckpoints) {
    json.timeline = json.RentalCheckpoints;
    delete json.RentalCheckpoints;
  }
  return json;
}

function handleServiceError(res, next, error) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

export async function requestRental(req, res, next) {
  try {
    const rental = await requestRentalAgreement(req.body);
    res.status(201).json(toResponse(rental));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function approveRental(req, res, next) {
  try {
    const rental = await approveRentalAgreement(req.params.rentalId, req.body || {});
    res.json(toResponse(rental));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function schedulePickup(req, res, next) {
  try {
    const rental = await scheduleRentalPickup(req.params.rentalId, req.body || {});
    res.json(toResponse(rental));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function checkoutRental(req, res, next) {
  try {
    const rental = await recordRentalCheckout(req.params.rentalId, req.body || {});
    res.json(toResponse(rental));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function markReturned(req, res, next) {
  try {
    const rental = await markRentalReturned(req.params.rentalId, req.body || {});
    res.json(toResponse(rental));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function completeInspection(req, res, next) {
  try {
    const rental = await completeRentalInspection(req.params.rentalId, req.body || {});
    res.json(toResponse(rental));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function cancelRental(req, res, next) {
  try {
    const rental = await cancelRentalAgreement(req.params.rentalId, req.body || {});
    res.json(toResponse(rental));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listRentals(req, res, next) {
  try {
    const { companyId, renterId, status, limit, offset } = req.query;
    const rentals = await listRentalAgreements({
      companyId,
      renterId,
      status,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined
    });
    res.json(rentals.map(toResponse));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function getRental(req, res, next) {
  try {
    const rental = await getRentalAgreementById(req.params.rentalId);
    if (!rental) {
      res.status(404).json({ message: 'Rental agreement not found' });
      return;
    }
    res.json(toResponse(rental));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function addRentalCheckpoint(req, res, next) {
  try {
    const checkpoint = await appendRentalCheckpoint(req.params.rentalId, req.body || {});
    res.status(201).json(checkpoint.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
