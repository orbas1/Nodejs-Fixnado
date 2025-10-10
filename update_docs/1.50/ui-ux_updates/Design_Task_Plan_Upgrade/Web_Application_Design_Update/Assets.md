# Asset Management

## Storage & Versioning
- Store hero images, icons, illustrations, and documents in CDN with versioned directories (`v1.50/web/...`).
- Maintain asset manifest (JSON) referencing file paths, dimensions, size, checksum, licence, and expiry.

## Formats & Optimisation
- Primary format WebP for imagery with PNG fallback; SVG for icons/illustrations; MP4/WebM for background loops (<4s).
- Provide retina (2x) and standard (1x) resolutions; include placeholder thumbnails for skeleton loaders.
- Compress using automated pipeline ensuring images <250KB and icons <30KB.

## Governance
- Track usage rights and attribution requirements in manifest; flag assets requiring renewal 30 days prior to expiry.
- Document approval workflow for new assets (designer upload → legal review → publish).
- Align asset naming with taxonomy `[page]_[component]_[descriptor]_[variant]`.

## Delivery Strategy
- Preload critical hero assets via `<link rel="preload">`; lazy-load below-the-fold imagery.
- Provide accessible alt text references within manifest to ensure consistent implementation.
