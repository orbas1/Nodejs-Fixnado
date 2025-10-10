# Asset Management Plan — Web Application v1.00

## Asset Categories
- **UI Tokens**: colours, typography, spacing stored in `packages/design-tokens`.
- **Static Media**: images, videos, PDFs in `frontend-reactjs/public/assets/`.
- **Documents**: PDFs (brochures, compliance docs) stored in `assets/documents/`.
- **Interactive Media**: Lottie animations, 3D map overlays.

## Storage Strategy
- Primary storage: Git repository for versioned assets ≤ 5MB.
- Large assets stored in AWS S3 bucket `fixnado-web-assets` with CloudFront CDN.
- Maintain asset manifest `assets-manifest.json` mapping usage (page, component) to file path and checksum.

## Optimisation Pipeline
1. Upload assets to `/assets/raw/`.
2. Run `pnpm assets:process` -> compress images (mozjpeg/pngquant), generate WebP, optimise SVG.
3. Validate metadata (alt text, usage) using Node script.
4. Move optimised files to `/public/assets/` and update manifest.

## Versioning
- Use semantic version tags for asset releases `assets-v1.00.x`.
- Document changes in `design_change_log.md` with asset references.
- Deprecate assets by marking status in manifest and removing references.

## Access Control
- Designers access Figma library; engineers fetch assets via Git.
- S3 bucket restricted to CDN + CI IAM roles; upload via GitHub Actions using OIDC.

## QA Checklist
- Verify aspect ratio, compression, alt text, dark mode compatibility.
- Run Lighthouse to ensure images properly sized (no > 100KB savings flagged).
- Validate caching headers (Cache-Control `max-age=31536000, immutable`).

## Governance
- Asset review meeting monthly to audit usage and retire outdated visuals.
- Document asset licensing and expiry in Notion.
- Provide fallback assets for offline mode stored inline as base64 for icons under 2KB.
