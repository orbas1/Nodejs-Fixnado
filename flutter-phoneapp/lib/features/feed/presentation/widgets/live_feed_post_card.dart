import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/datetime_formatter.dart';
import '../../domain/live_feed_models.dart';

class LiveFeedPostCard extends StatelessWidget {
  const LiveFeedPostCard({super.key, required this.post});

  final LiveFeedPost post;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = theme.colorScheme.primary;
    final statusLabel = post.status
        .replaceAll('_', ' ')
        .split(' ')
        .map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
        .join(' ');
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.title,
                        style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: accent),
                      ),
                      const SizedBox(height: 4),
                      if (post.location != null && post.location!.isNotEmpty)
                        Text(
                          post.location!,
                          style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                        ),
                      if (post.zone != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            post.zone!.name,
                            style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                          ),
                        ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      post.budgetDisplay,
                      style: GoogleFonts.manrope(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.secondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateTimeFormatter.relative(post.createdAt),
                      style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                    ),
                    if (post.allowOutOfZone)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: _InfoChip(
                          icon: Icons.flight_takeoff,
                          label: 'Out-of-zone bids welcome',
                          color: theme.colorScheme.primary.withOpacity(0.1),
                          foreground: theme.colorScheme.primary,
                        ),
                      ),
                  ],
                )
              ],
            ),
            if (post.description != null && post.description!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                post.description!,
                style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.onSurface),
              ),
            ],
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (post.category != null && post.category!.isNotEmpty)
                  _InfoChip(
                    icon: Icons.category_outlined,
                    label: post.category!,
                    color: theme.colorScheme.surfaceVariant,
                    foreground: theme.colorScheme.onSurface,
                  ),
                _InfoChip(
                  icon: Icons.gavel_outlined,
                  label: '${post.bidCount} bid${post.bidCount == 1 ? '' : 's'}',
                  color: theme.colorScheme.surfaceVariant,
                  foreground: theme.colorScheme.onSurface,
                ),
                _InfoChip(
                  icon: Icons.work_outline,
                  label: post.customer?.displayName.isNotEmpty == true
                      ? post.customer!.displayName
                      : 'Anonymous requester',
                  color: theme.colorScheme.surfaceVariant,
                  foreground: theme.colorScheme.onSurface,
                ),
                _InfoChip(
                  icon: Icons.shield_outlined,
                  label: statusLabel,
                  color: theme.colorScheme.surfaceVariant,
                  foreground: theme.colorScheme.onSurface,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.foreground,
  });

  final IconData icon;
  final String label;
  final Color color;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: foreground),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 12, color: foreground, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
