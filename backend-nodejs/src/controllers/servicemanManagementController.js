import {
  getServicemanManagementSnapshot,
  createServicemanProfile,
  updateServicemanProfile,
  deleteServicemanProfile,
  createServicemanShift,
  updateServicemanShift,
  deleteServicemanShift,
  createServicemanCertification,
  updateServicemanCertification,
  deleteServicemanCertification
} from '../services/servicemanManagementService.js';

function handleServiceError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

function serialiseProfile(profile) {
  if (!profile) {
    return null;
  }
  const payload = profile.toJSON();
  payload.contactEmail = profile.get('contactEmail');
  payload.contactPhone = profile.get('contactPhone');
  payload.notes = profile.get('notes');
  return payload;
}

function serialiseShift(shift) {
  return shift ? shift.toJSON() : null;
}

function serialiseCertification(certification) {
  return certification ? certification.toJSON() : null;
}

export async function getOverview(req, res, next) {
  try {
    const { companyId } = req.query;
    const window = { timezone: req.query.timezone };
    if (req.query.start) {
      const start = new Date(req.query.start);
      if (!Number.isNaN(start.getTime())) {
        window.start = start;
      }
    }
    if (req.query.end) {
      const end = new Date(req.query.end);
      if (!Number.isNaN(end.getTime())) {
        window.end = end;
      }
    }
    const snapshot = await getServicemanManagementSnapshot({ companyId, window });
    res.json(snapshot);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createProfileHandler(req, res, next) {
  try {
    const profile = await createServicemanProfile(req.body || {});
    res.status(201).json(serialiseProfile(profile));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateProfileHandler(req, res, next) {
  try {
    const profile = await updateServicemanProfile(req.params.profileId, req.body || {});
    res.json(serialiseProfile(profile));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteProfileHandler(req, res, next) {
  try {
    await deleteServicemanProfile(req.params.profileId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createShiftHandler(req, res, next) {
  try {
    const shift = await createServicemanShift(req.params.profileId, req.body || {});
    res.status(201).json(serialiseShift(shift));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateShiftHandler(req, res, next) {
  try {
    const shift = await updateServicemanShift(req.params.profileId, req.params.shiftId, req.body || {});
    res.json(serialiseShift(shift));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteShiftHandler(req, res, next) {
  try {
    await deleteServicemanShift(req.params.profileId, req.params.shiftId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCertificationHandler(req, res, next) {
  try {
    const certification = await createServicemanCertification(req.params.profileId, req.body || {});
    res.status(201).json(serialiseCertification(certification));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCertificationHandler(req, res, next) {
  try {
    const certification = await updateServicemanCertification(
      req.params.profileId,
      req.params.certificationId,
      req.body || {}
    );
    res.json(serialiseCertification(certification));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCertificationHandler(req, res, next) {
  try {
    await deleteServicemanCertification(req.params.profileId, req.params.certificationId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export default {
  getOverview,
  createProfileHandler,
  updateProfileHandler,
  deleteProfileHandler,
  createShiftHandler,
  updateShiftHandler,
  deleteShiftHandler,
  createCertificationHandler,
  updateCertificationHandler,
  deleteCertificationHandler
};
