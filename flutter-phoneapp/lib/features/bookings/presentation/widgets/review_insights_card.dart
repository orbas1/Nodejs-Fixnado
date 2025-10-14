import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/datetime_formatter.dart';
import '../../../services/domain/service_catalog_models.dart';

class ReviewInsightsCard extends StatelessWidget {
  const ReviewInsightsCard({
    super.key,
    required this.summary,
    required this.reviews,
  });

  final BusinessReviewSummary summary;
  final List<BusinessReview> reviews;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    BusinessReview? highlight;
    if (summary.highlightedReviewId != null) {
      for (final review in reviews) {
        if (review.id == summary.highlightedReviewId) {
          highlight = review;
          break;
        }
      }
    }
    highlight ??= reviews.isNotEmpty ? reviews.first : null;
    final excerpt = summary.excerpt ?? highlight?.comment;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary.withOpacity(0.08),
            theme.colorScheme.surface,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.16)),
        borderRadius: BorderRadius.circular(28),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Client sentiment',
            style: GoogleFonts.manrope(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                summary.averageRating?.toStringAsFixed(2) ?? '—',
                style: GoogleFonts.manrope(
                  fontSize: 42,
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '${summary.totalReviews} published reviews',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _MetricPill(
                label: 'Verified',
                value: _formatPercent(context, summary.verifiedShare),
                icon: Icons.verified_outlined,
              ),
              const SizedBox(width: 12),
              _MetricPill(
                label: 'Response rate',
                value: _formatPercent(context, summary.responseRate),
                icon: Icons.quickreply_outlined,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Distribution', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
          const SizedBox(height: 8),
          ...summary.ratingBuckets.map((bucket) {
            final ratio = summary.totalReviews == 0 ? 0.0 : bucket.count / summary.totalReviews;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${bucket.score} star', style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                      Text(_formatPercent(context, ratio), style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: LinearProgressIndicator(
                      value: ratio.clamp(0.0, 1.0),
                      minHeight: 6,
                      backgroundColor: theme.colorScheme.primary.withOpacity(0.08),
                      valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary.withOpacity(0.7)),
                    ),
                  ),
                ],
              ),
            );
          }),
          if (highlight != null && (excerpt?.isNotEmpty ?? false)) ...[
            const SizedBox(height: 12),
            Divider(color: theme.colorScheme.primary.withOpacity(0.12)),
            const SizedBox(height: 12),
            Text('Highlighted feedback', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
            const SizedBox(height: 8),
            Text(
              '“$excerpt”',
              style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: theme.colorScheme.onSurface),
            ),
            const SizedBox(height: 12),
            Text(
              highlight!.reviewer,
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurfaceVariant),
            ),
            if ((highlight!.job ?? '').isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  highlight!.job!,
                  style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
          ],
          if (summary.lastReviewAt != null) ...[
            const SizedBox(height: 16),
            Text(
              'Updated ${DateTimeFormatter.relative(summary.lastReviewAt!)}',
              style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
            ),
          ],
        ],
      ),
    );
  }

  static String _formatPercent(BuildContext context, double value) {
    final percentage = (value.clamp(0, 1) * 100).toStringAsFixed(0);
    return '$percentage%';
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: theme.colorScheme.primary.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: theme.colorScheme.primary),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label.toUpperCase(),
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.primary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
