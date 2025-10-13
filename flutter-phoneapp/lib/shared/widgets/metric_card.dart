import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MetricCard extends StatelessWidget {
  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.background,
    this.onTap,
    this.change,
    this.trend,
  });

  final String label;
  final String value;
  final IconData? icon;
  final Color? background;
  final VoidCallback? onTap;
  final String? change;
  final String? trend;

  @override
  Widget build(BuildContext context) {
    final content = Container(
      decoration: BoxDecoration(
        color: background ?? Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null)
            Icon(
              icon,
              size: 28,
              color: Theme.of(context).colorScheme.onPrimaryContainer,
            ),
          if (icon != null) const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.ibmPlexMono(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onPrimaryContainer,
            ),
          ),
          if (change != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                if (trend != null)
                  Icon(
                    _trendIcon(trend!),
                    size: 16,
                    color: _trendColor(context, trend!),
                  ),
                if (trend != null) const SizedBox(width: 4),
                Text(
                  change!,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _trendColor(context, trend),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Theme.of(context).colorScheme.onPrimaryContainer.withOpacity(0.72),
            ),
          ),
        ],
      ),
    );

    if (onTap == null) {
      return content;
    }
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: content,
    );
  }
}

IconData _trendIcon(String trend) {
  switch (trend) {
    case 'up':
      return Icons.trending_up_rounded;
    case 'down':
      return Icons.trending_down_rounded;
    default:
      return Icons.drag_indicator_rounded;
  }
}

Color _trendColor(BuildContext context, String? trend) {
  final scheme = Theme.of(context).colorScheme;
  switch (trend) {
    case 'up':
      return const Color(0xFF1BBF92);
    case 'down':
      return const Color(0xFFF97316);
    default:
      return scheme.onPrimaryContainer.withOpacity(0.72);
  }
}
