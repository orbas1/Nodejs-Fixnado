import {
  getSupportedDiagnosticSections,
  listDiagnostics,
  runDiagnostic
} from '../services/systemSettingsDiagnosticsService.js';

export async function triggerPlatformSettingDiagnostic(req, res, next) {
  try {
    const { section, payload } = req.body ?? {};
    if (!section) {
      return res.status(422).json({ message: 'Diagnostic section is required.' });
    }

    const result = await runDiagnostic(section, payload, req.user?.id ?? 'system');
    res.json({ diagnostic: result });
  } catch (error) {
    if (error.message?.includes('Unsupported diagnostic')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

export async function listPlatformSettingDiagnostics(req, res, next) {
  try {
    const { section, limit } = req.query ?? {};
    const parsedLimit = Number.parseInt(limit, 10);
    const diagnostics = await listDiagnostics({
      section,
      limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20
    });
    const meta = { sections: getSupportedDiagnosticSections() };
    res.json({ diagnostics, meta });
  } catch (error) {
    next(error);
  }
}
