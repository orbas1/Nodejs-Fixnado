import { getLegalDocumentDetail } from '../services/legalDocumentService.js';

export async function getPublishedLegalDocument(req, res, next) {
  try {
    const { slug } = req.params;
    const document = await getLegalDocumentDetail(slug);
    if (!document || !document.currentVersion) {
      res.status(404).json({ message: 'Legal document not found' });
      return;
    }

    const { currentVersion } = document;
    const response = {
      slug: document.slug,
      title: document.title,
      summary: document.summary,
      owner: document.owner,
      heroImageUrl: document.heroImageUrl,
      contactEmail: document.contactEmail,
      contactPhone: document.contactPhone,
      contactUrl: document.contactUrl,
      reviewCadence: document.reviewCadence,
      statusLabel: document.statusLabel,
      health: document.health,
      acknowledgement: document.acknowledgement,
      audience: document.audience,
      governance: document.governance,
      metadata: document.metadata,
      version: {
        id: currentVersion.id,
        version: currentVersion.version,
        status: currentVersion.status,
        changeNotes: currentVersion.changeNotes,
        effectiveAt: currentVersion.effectiveAt,
        publishedAt: currentVersion.publishedAt,
        content: currentVersion.content,
        attachments: currentVersion.attachments
      }
    };

    res.json({ document: response });
  } catch (error) {
    next(error);
  }
}
