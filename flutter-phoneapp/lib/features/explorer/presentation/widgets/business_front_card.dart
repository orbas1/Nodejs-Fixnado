import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/models.dart';

class BusinessFrontCard extends StatelessWidget {
  const BusinessFrontCard({
    super.key,
    required this.front,
    this.onTap,
  });

  final ExplorerBusinessFront front;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final categorySummary = front.categories.take(3).join(' • ');
    final coverageSummary = front.coverageAreas.take(3).join(' • ');
    final trustScore = front.trustScore;
    final reviewScore = front.reviewScore;

    String _formatCode(String? value) {
      if (value == null || value.isEmpty) {
        return '';
      }
      final spaced = value
          .replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (match) => '${match.group(1)} ${match.group(2)}')
          .replaceAll(RegExp(r'[_-]'), ' ');
      return spaced
          .split(' ')
          .where((part) => part.isNotEmpty)
          .map((part) => part[0].toUpperCase() + part.substring(1))
          .join(' ');
    }

    String? _trustCaption(ExplorerBusinessFrontScore? score) {
      if (score == null) return null;
      if ((score.caption ?? '').isNotEmpty) {
        return score.caption;
      }
      final parts = <String>[];
      final confidence = _formatCode(score.confidence);
      if (confidence.isNotEmpty) {
        parts.add('$confidence confidence');
      }
      if ((score.sampleSize ?? 0) > 0) {
        final sample = score.sampleSize!;
        parts.add('$sample ${sample == 1 ? 'job' : 'jobs'} assessed');
      }
      return parts.isEmpty ? null : parts.join(' • ');
    }

    String? _reviewCaption(ExplorerBusinessFrontScore? score) {
      if (score == null) return null;
      if ((score.caption ?? '').isNotEmpty) {
        return score.caption;
      }
      final parts = <String>[];
      final band = _formatCode(score.band);
      if (band.isNotEmpty) {
        parts.add(band);
      }
      if ((score.sampleSize ?? 0) > 0) {
        final sample = score.sampleSize!;
        parts.add('$sample ${sample == 1 ? 'review' : 'reviews'} analysed');
      }
      return parts.isEmpty ? null : parts.join(' • ');
    }

    final scoreTiles = <Widget>[];
    if (trustScore != null) {
      scoreTiles.add(
        Expanded(
          child: _ScoreTile(
            icon: Icons.verified_user_outlined,
            label: 'Trust score',
            value: '${trustScore.value.toStringAsFixed(0)} /100',
            caption: _trustCaption(trustScore),
            gradient: [
              theme.colorScheme.primary,
              theme.colorScheme.primary.withOpacity(0.85),
            ],
            textColor: Colors.white,
            badge: _formatCode(trustScore.band),
          ),
        ),
      );
    }
    if (reviewScore != null) {
      scoreTiles.add(
        Expanded(
          child: _ScoreTile(
            icon: Icons.star_rate_rounded,
            label: 'Review score',
            value: reviewScore.value.toStringAsFixed(reviewScore.value % 1 == 0 ? 0 : 1),
            caption: _reviewCaption(reviewScore),
            gradient: [
              theme.colorScheme.secondary,
              theme.colorScheme.secondary.withOpacity(0.8),
            ],
            textColor: theme.colorScheme.onSecondary,
            badge: _formatCode(reviewScore.band),
          ),
        ),
      );
    }

    Widget? headerBadge;
    if (trustScore != null) {
      headerBadge = _ScoreBadgePill(
        icon: Icons.verified_user_outlined,
        label: '${trustScore.value.toStringAsFixed(0)} /100',
        color: theme.colorScheme.primary,
        background: theme.colorScheme.primary.withOpacity(0.15),
      );
    } else if (reviewScore != null) {
      headerBadge = _ScoreBadgePill(
        icon: Icons.star_rate_rounded,
        label: reviewScore.value.toStringAsFixed(reviewScore.value % 1 == 0 ? 0 : 1),
        color: theme.colorScheme.secondary,
        background: theme.colorScheme.secondary.withOpacity(0.15),
      );
    } else if (front.score != null) {
      headerBadge = _ScoreBadgePill(
        icon: Icons.trending_up,
        label: front.score!.toStringAsFixed(1),
        color: theme.colorScheme.secondary,
        background: theme.colorScheme.secondary.withOpacity(0.1),
      );
    }

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
                      color: theme.colorScheme.tertiaryContainer,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(Icons.apartment_outlined, size: 28, color: theme.colorScheme.onTertiaryContainer),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          front.name,
                          style: GoogleFonts.manrope(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        if ((front.tagline ?? '').isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              front.tagline!,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (headerBadge != null) headerBadge!,
                ],
              ),
              if ((front.summary ?? '').isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    front.summary!,
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
              if (scoreTiles.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Row(
                    children: [
                      for (var i = 0; i < scoreTiles.length; i++) ...[
                        if (i > 0) const SizedBox(width: 12),
                        scoreTiles[i],
                      ],
                    ],
                  ),
                ),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  if (categorySummary.isNotEmpty)
                    Chip(
                      avatar: const Icon(Icons.layers_outlined, size: 18),
                      label: Text(categorySummary, style: GoogleFonts.inter(fontSize: 12)),
                    ),
                  if (coverageSummary.isNotEmpty)
                    Chip(
                      avatar: const Icon(Icons.public_outlined, size: 18),
                      label: Text(coverageSummary, style: GoogleFonts.inter(fontSize: 12)),
                    ),
                ],
              ),
              if (front.metrics.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: front.metrics
                        .where((metric) => metric.value.trim().isNotEmpty)
                        .take(3)
                        .map((metric) => _BusinessMetricPill(metric: metric))
                        .toList(),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ScoreBadgePill extends StatelessWidget {
  const _ScoreBadgePill({
    required this.icon,
    required this.label,
    required this.color,
    required this.background,
  });

  final IconData icon;
  final String label;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScoreTile extends StatelessWidget {
  const _ScoreTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.gradient,
    required this.textColor,
    this.caption,
    this.badge,
  });

  final IconData icon;
  final String label;
  final String value;
  final List<Color> gradient;
  final Color textColor;
  final String? caption;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: gradient.last.withOpacity(0.25),
            blurRadius: 16,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                height: 36,
                width: 36,
                decoration: BoxDecoration(
                  color: textColor.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 20, color: textColor),
              ),
              if ((badge ?? '').isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: textColor.withOpacity(0.16),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text(
                    badge!,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: textColor,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              letterSpacing: 0.4,
              color: textColor.withOpacity(0.85),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.manrope(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
          if ((caption ?? '').isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                caption!,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  height: 1.3,
                  color: textColor.withOpacity(0.85),
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );
  }
}

class _BusinessMetricPill extends StatelessWidget {
  const _BusinessMetricPill({
    required this.metric,
  });

  final ExplorerBusinessFrontMetric metric;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final valueText = metric.value.isEmpty ? '—' : metric.value;

    return Container(
      padding: const EdgeInsets.all(16),
      width: 160,
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            metric.label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Text(
            valueText,
            style: GoogleFonts.manrope(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
            ),
          ),
          if ((metric.caption ?? '').isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                metric.caption!,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );
  }
}
