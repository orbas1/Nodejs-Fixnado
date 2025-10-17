import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getServicemanOverviewHandler,
  updateServicemanProfileHandler,
  createShiftRuleHandler,
  updateShiftRuleHandler,
  deleteShiftRuleHandler,
  createCertificationHandler,
  updateCertificationHandler,
  deleteCertificationHandler,
  createEquipmentItemHandler,
  updateEquipmentItemHandler,
  deleteEquipmentItemHandler
} from '../controllers/servicemanControlCentreController.js';

const PROFILE_STATUSES = ['active', 'standby', 'offline'];
const SHIFT_STATUSES = ['available', 'standby', 'unavailable'];
const EQUIPMENT_STATUSES = ['ready', 'checked_out', 'maintenance', 'retired'];

const router = Router();

router.use((req, res, next) => {
  if (!req.user || req.user.type !== 'servicemen') {
    return res.status(403).json({ message: 'persona_forbidden' });
  }
  return next();
});

const profileValidators = [
  body('profile').isObject().withMessage('profile object is required'),
  body('profile.displayName').optional().isString().isLength({ min: 1, max: 160 }).trim(),
  body('profile.callSign').optional().isString().isLength({ min: 1, max: 64 }).trim(),
  body('profile.status').optional().isIn(PROFILE_STATUSES),
  body('profile.avatarUrl').optional().isString().isLength({ max: 2048 }).trim(),
  body('profile.bio').optional().isString(),
  body('profile.timezone').optional().isString().isLength({ min: 2, max: 64 }).trim(),
  body('profile.primaryRegion').optional().isString().isLength({ min: 2, max: 120 }).trim(),
  body('profile.coverageRadiusKm').optional().isInt({ min: 0, max: 400 }).toInt(),
  body('profile.travelBufferMinutes').optional().isInt({ min: 0, max: 240 }).toInt(),
  body('profile.autoAcceptAssignments').optional().isBoolean().toBoolean(),
  body('profile.allowAfterHours').optional().isBoolean().toBoolean(),
  body('profile.notifyOpsTeam').optional().isBoolean().toBoolean(),
  body('profile.defaultVehicle').optional().isString().isLength({ min: 1, max: 96 }).trim()
];

const availabilityValidators = [
  body('dayOfWeek').isInt({ min: 0, max: 6 }).toInt(),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('status').optional().isIn(SHIFT_STATUSES),
  body('locationLabel').optional().isString().isLength({ min: 1, max: 160 }).trim(),
  body('notes').optional().isString()
];

const availabilityUpdateValidators = [
  body('dayOfWeek').optional().isInt({ min: 0, max: 6 }).toInt(),
  body('startTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('endTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('status').optional().isIn(SHIFT_STATUSES),
  body('locationLabel').optional().isString().isLength({ min: 1, max: 160 }).trim(),
  body('notes').optional().isString()
];

const certificationValidators = [
  body('title').isString().isLength({ min: 1, max: 180 }).trim(),
  body('issuer').optional().isString().isLength({ min: 1, max: 160 }).trim(),
  body('credentialId').optional().isString().isLength({ min: 1, max: 120 }).trim(),
  body('issuedOn').optional().isISO8601(),
  body('expiresOn').optional().isISO8601(),
  body('attachmentUrl').optional().isString().isLength({ max: 2048 }).trim()
];

const certificationUpdateValidators = [
  body('title').optional().isString().isLength({ min: 1, max: 180 }).trim(),
  body('issuer').optional().isString().isLength({ min: 1, max: 160 }).trim(),
  body('credentialId').optional().isString().isLength({ min: 1, max: 120 }).trim(),
  body('issuedOn').optional().isISO8601(),
  body('expiresOn').optional().isISO8601(),
  body('attachmentUrl').optional().isString().isLength({ max: 2048 }).trim()
];

const equipmentValidators = [
  body('name').isString().isLength({ min: 1, max: 180 }).trim(),
  body('serialNumber').optional().isString().isLength({ min: 1, max: 120 }).trim(),
  body('status').optional().isIn(EQUIPMENT_STATUSES),
  body('maintenanceDueOn').optional().isISO8601(),
  body('assignedAt').optional().isISO8601(),
  body('imageUrl').optional().isString().isLength({ max: 2048 }).trim(),
  body('notes').optional().isString()
];

const equipmentUpdateValidators = [
  body('name').optional().isString().isLength({ min: 1, max: 180 }).trim(),
  body('serialNumber').optional().isString().isLength({ min: 1, max: 120 }).trim(),
  body('status').optional().isIn(EQUIPMENT_STATUSES),
  body('maintenanceDueOn').optional().isISO8601(),
  body('assignedAt').optional().isISO8601(),
  body('imageUrl').optional().isString().isLength({ max: 2048 }).trim(),
  body('notes').optional().isString()
];

router.get('/overview', getServicemanOverviewHandler);
router.put('/overview', profileValidators, updateServicemanProfileHandler);

router.post('/overview/availability', availabilityValidators, createShiftRuleHandler);
router.put('/overview/availability/:ruleId', [param('ruleId').isUUID(4), ...availabilityUpdateValidators], updateShiftRuleHandler);
router.delete('/overview/availability/:ruleId', [param('ruleId').isUUID(4)], deleteShiftRuleHandler);

router.post('/overview/certifications', certificationValidators, createCertificationHandler);
router.put('/overview/certifications/:certificationId', [param('certificationId').isUUID(4), ...certificationUpdateValidators], updateCertificationHandler);
router.delete('/overview/certifications/:certificationId', [param('certificationId').isUUID(4)], deleteCertificationHandler);

router.post('/overview/equipment', equipmentValidators, createEquipmentItemHandler);
router.put('/overview/equipment/:itemId', [param('itemId').isUUID(4), ...equipmentUpdateValidators], updateEquipmentItemHandler);
router.delete('/overview/equipment/:itemId', [param('itemId').isUUID(4)], deleteEquipmentItemHandler);

export default router;
