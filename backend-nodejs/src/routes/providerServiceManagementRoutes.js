import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  listProviderServicesHandler,
  getProviderServiceHandler,
  createProviderServiceHandler,
  updateProviderServiceHandler,
  deleteProviderServiceHandler
} from '../controllers/providerServiceManagementController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import { SERVICE_STATUSES, SERVICE_VISIBILITIES, SERVICE_KINDS } from '../services/serviceOrchestrationService.js';

const COVERAGE_TYPES = ['primary', 'secondary', 'supplementary'];

const router = Router();

function resolveCompanyContext(req) {
  return req.body?.companyId ?? req.query?.companyId ?? null;
}

const viewPolicy = enforcePolicy('panel.provider.services.view', {
  metadata: (req) => ({
    companyId: resolveCompanyContext(req),
    action: 'view'
  })
});

const managePolicy = enforcePolicy('panel.provider.services.manage', {
  metadata: (req) => ({
    companyId: resolveCompanyContext(req),
    serviceId: req.params?.serviceId ?? null,
    action: req.method.toLowerCase()
  })
});

router.use(authenticate);

router.get(
  '/',
  viewPolicy,
  [
    query('companyId').optional().isUUID(),
    query('status').optional().isIn(SERVICE_STATUSES),
    query('visibility').optional().isIn(SERVICE_VISIBILITIES),
    query('search').optional().isString().trim().isLength({ max: 160 })
  ],
  listProviderServicesHandler
);

router.get(
  '/:serviceId',
  viewPolicy,
  [param('serviceId').isUUID(), query('companyId').optional().isUUID()],
  getProviderServiceHandler
);

router.post(
  '/',
  managePolicy,
  [
    body('companyId').optional().isUUID(),
    body('title').isString().trim().isLength({ min: 3, max: 160 }),
    body('slug').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 160 }),
    body('status').optional({ checkFalsy: true }).isIn(SERVICE_STATUSES),
    body('visibility').optional({ checkFalsy: true }).isIn(SERVICE_VISIBILITIES),
    body('kind').optional({ checkFalsy: true }).isIn(SERVICE_KINDS),
    body('price').optional({ nullable: true }).custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) && parsed >= 0;
    }),
    body('currency')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ min: 3, max: 3 })
      .matches(/^[A-Za-z]{3}$/),
    body('crewSize')
      .optional({ checkFalsy: true })
      .custom((value) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0;
      }),
    body('categoryId').optional({ checkFalsy: true }).isUUID(),
    body('zoneAssignments').optional().isArray({ max: 50 }),
    body('zoneAssignments.*.zoneId').optional({ checkFalsy: true }).isUUID(),
    body('zoneAssignments.*.coverageType')
      .optional({ checkFalsy: true })
      .isIn(COVERAGE_TYPES),
    body('zoneAssignments.*.priority')
      .optional({ checkFalsy: true })
      .custom((value) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed >= 0;
      }),
    body('zoneAssignments.*.effectiveFrom')
      .optional({ checkFalsy: true })
      .isISO8601(),
    body('zoneAssignments.*.effectiveTo').optional({ checkFalsy: true }).isISO8601(),
    body('availability').optional().isArray({ max: 50 }),
    body('availability.*.dayOfWeek')
      .optional({ checkFalsy: true })
      .isInt({ min: 0, max: 6 }),
    body('availability.*.startTime')
      .optional({ checkFalsy: true })
      .matches(/^\d{2}:\d{2}$/),
    body('availability.*.endTime')
      .optional({ checkFalsy: true })
      .matches(/^\d{2}:\d{2}$/),
    body('availability.*.maxBookings')
      .optional({ checkFalsy: true })
      .custom((value) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed >= 0;
      }),
    body('mediaLibrary').optional().isArray({ max: 25 }),
    body('mediaLibrary.*.url')
      .optional({ checkFalsy: true })
      .isURL({ require_protocol: true }),
    body('seo').optional().isObject()
  ],
  createProviderServiceHandler
);

router.put(
  '/:serviceId',
  managePolicy,
  [
    param('serviceId').isUUID(),
    body('companyId').optional().isUUID(),
    body('title').optional({ checkFalsy: true }).isString().trim().isLength({ min: 3, max: 160 }),
    body('slug').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 160 }),
    body('status').optional({ checkFalsy: true }).isIn(SERVICE_STATUSES),
    body('visibility').optional({ checkFalsy: true }).isIn(SERVICE_VISIBILITIES),
    body('kind').optional({ checkFalsy: true }).isIn(SERVICE_KINDS),
    body('price').optional({ nullable: true }).custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) && parsed >= 0;
    }),
    body('currency')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ min: 3, max: 3 })
      .matches(/^[A-Za-z]{3}$/),
    body('crewSize')
      .optional({ checkFalsy: true })
      .custom((value) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0;
      }),
    body('categoryId').optional({ nullable: true }).custom((value) => {
      if (value === null) {
        return true;
      }
      return typeof value === 'string';
    }),
    body('zoneAssignments').optional().isArray({ max: 50 }),
    body('zoneAssignments.*.zoneId').optional({ checkFalsy: true }).isUUID(),
    body('zoneAssignments.*.coverageType')
      .optional({ checkFalsy: true })
      .isIn(COVERAGE_TYPES),
    body('zoneAssignments.*.priority')
      .optional({ checkFalsy: true })
      .custom((value) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed >= 0;
      }),
    body('zoneAssignments.*.effectiveFrom')
      .optional({ checkFalsy: true })
      .isISO8601(),
    body('zoneAssignments.*.effectiveTo').optional({ checkFalsy: true }).isISO8601(),
    body('availability').optional().isArray({ max: 50 }),
    body('availability.*.dayOfWeek')
      .optional({ checkFalsy: true })
      .isInt({ min: 0, max: 6 }),
    body('availability.*.startTime')
      .optional({ checkFalsy: true })
      .matches(/^\d{2}:\d{2}$/),
    body('availability.*.endTime')
      .optional({ checkFalsy: true })
      .matches(/^\d{2}:\d{2}$/),
    body('availability.*.maxBookings')
      .optional({ checkFalsy: true })
      .custom((value) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed >= 0;
      }),
    body('mediaLibrary').optional().isArray({ max: 25 }),
    body('mediaLibrary.*.url')
      .optional({ checkFalsy: true })
      .isURL({ require_protocol: true }),
    body('seo').optional().isObject()
  ],
  updateProviderServiceHandler
);

router.delete(
  '/:serviceId',
  managePolicy,
  [param('serviceId').isUUID(), body('companyId').optional().isUUID()],
  deleteProviderServiceHandler
);

export default router;
