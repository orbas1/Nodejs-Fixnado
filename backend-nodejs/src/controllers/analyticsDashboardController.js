import { validationResult } from 'express-validator';
import {
  buildDashboardExport,
  buildExportPath,
  getPersonaDashboard
} from '../services/dashboardAnalyticsService.js';

export async function getPersonaDashboardHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const persona = req.params.persona;
    const dashboard = await getPersonaDashboard(persona, req.query);
    const exportHref = buildExportPath(persona, req.query);

    res.json({
      ...dashboard,
      window: {
        start: dashboard.window?.start?.toISO?.() ?? dashboard.window?.start ?? null,
        end: dashboard.window?.end?.toISO?.() ?? dashboard.window?.end ?? null,
        timezone: dashboard.window?.timezone,
        label: dashboard.window?.label
      },
      exports: {
        csv: {
          href: exportHref,
          rowLimit: req.app?.get?.('dashboards:exportRowLimit') ?? undefined
        }
      }
    });
  } catch (error) {
    if (error?.statusCode === 404) {
      return res.status(404).json({ message: 'persona_not_supported' });
    }
    next(error);
  }
}

export async function exportPersonaDashboardHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const persona = req.params.persona;
    const dashboard = await getPersonaDashboard(persona, req.query);
    const csv = buildDashboardExport({
      ...dashboard,
      window: {
        start: dashboard.window?.start?.toISO?.() ?? dashboard.window?.start ?? null,
        end: dashboard.window?.end?.toISO?.() ?? dashboard.window?.end ?? null,
        timezone: dashboard.window?.timezone
      }
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${persona}-analytics-${timestamp}.csv"`);
    res.send(csv);
  } catch (error) {
    if (error?.statusCode === 404) {
      return res.status(404).json({ message: 'persona_not_supported' });
    }
    next(error);
  }
}
