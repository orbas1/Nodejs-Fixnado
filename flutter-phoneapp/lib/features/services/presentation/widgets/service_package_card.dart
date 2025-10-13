import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/service_catalog_models.dart';

class ServicePackageCard extends StatelessWidget {
  const ServicePackageCard({
    super.key,
    required this.package,
    this.onBook,
  });

  final ServicePackage package;
  final VoidCallback? onBook;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SizedBox(
      width: 280,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colorScheme.surface,
              colorScheme.surfaceVariant.withOpacity(0.65),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: colorScheme.outlineVariant.withOpacity(0.4)),
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withOpacity(0.04),
              offset: const Offset(0, 18),
              blurRadius: 32,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onBook,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 26),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.shield_outlined, size: 18, color: colorScheme.primary),
                        const SizedBox(width: 8),
                        Text(
                          'Escrow protected',
                          style: GoogleFonts.manrope(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: colorScheme.primary,
                            letterSpacing: 0.6,
                          ),
                        ),
                        const Spacer(),
                        if (package.serviceType != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: colorScheme.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              package.serviceType!,
                              style: GoogleFonts.ibmPlexMono(
                                fontSize: 11,
                                color: colorScheme.primary,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      package.name,
                      style: GoogleFonts.manrope(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      package.description,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        height: 1.55,
                        color: colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (package.price != null) ...[
                      const SizedBox(height: 18),
                      Text(
                        '${package.currency} ${package.price!.toStringAsFixed(2)} per engagement',
                        style: GoogleFonts.ibmPlexMono(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.secondary,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ],
                    if (package.highlights.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: package.highlights
                            .map(
                              (highlight) => Container(
                                constraints: const BoxConstraints(maxWidth: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: colorScheme.primaryContainer.withOpacity(0.25),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(Icons.check_rounded, size: 16, color: colorScheme.primary),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        highlight,
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: colorScheme.onPrimaryContainer,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                    const Spacer(),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: onBook,
                        icon: const Icon(Icons.event_available_outlined),
                        label: const Text('Book package'),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
