import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/models.dart';

class StorefrontCard extends StatelessWidget {
  const StorefrontCard({
    super.key,
    required this.storefront,
    this.onTap,
  });

  final ExplorerStorefront storefront;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final coverageSummary = storefront.coverageAreas.take(3).join(' • ');
    final badgeSummary = storefront.badges.take(2).join(' • ');

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 1,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(Icons.storefront_outlined, size: 28, color: theme.colorScheme.onPrimaryContainer),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          storefront.name,
                          style: GoogleFonts.manrope(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        if (storefront.primaryCategory != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              storefront.primaryCategory!,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (storefront.rating != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.star_rounded, size: 18, color: theme.colorScheme.primary),
                          const SizedBox(width: 4),
                          Text(
                            storefront.rating!.toStringAsFixed(1),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              if ((storefront.summary ?? '').isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    storefront.summary!,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      height: 1.5,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 4,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  if (coverageSummary.isNotEmpty)
                    Chip(
                      avatar: const Icon(Icons.location_on_outlined, size: 18),
                      label: Text(
                        coverageSummary,
                        style: GoogleFonts.inter(fontSize: 12),
                      ),
                    ),
                  if (badgeSummary.isNotEmpty)
                    Chip(
                      avatar: const Icon(Icons.verified_outlined, size: 18),
                      label: Text(
                        badgeSummary,
                        style: GoogleFonts.inter(fontSize: 12),
                      ),
                    ),
                  if (storefront.tags.isNotEmpty)
                    ...storefront.tags
                        .take(3)
                        .map(
                          (tag) => Chip(
                            label: Text(tag, style: GoogleFonts.inter(fontSize: 12)),
                          ),
                        )
                        .toList(),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
