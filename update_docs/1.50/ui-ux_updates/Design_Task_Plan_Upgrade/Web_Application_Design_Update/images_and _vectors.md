# Image & Vector Asset Plan (Web)

## Asset Needs
- Hero imagery, provider icons, analytics illustrations, onboarding visuals, empty state graphics.

## Vector Guidelines
- Use 1.5px stroke weight, rounded corners 4px, palette aligned to design tokens.
- Provide both light and dark mode versions.
- Export as SVG, ensure title/desc tags for accessibility.

## Image Guidelines
- Convert to WebP; provide fallback JPEG/PNG for compatibility.
- Use responsive `srcset` to deliver appropriate size per device.
- Apply alt text and optional captions.

## Management
- Centralised Figma library `WebAssets_v150.fig` with naming convention `web_<page>_<component>_<state>`.
- Sync to asset repository with version control; document change history.

## Performance Targets
- Hero images <250kb, supporting illustrations <80kb, icons <24kb.

## Review Checklist
- [ ] Contrast validated.
- [ ] Licensing documented.
- [ ] Compression tested.
