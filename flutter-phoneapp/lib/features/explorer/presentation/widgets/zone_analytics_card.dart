import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/datetime_formatter.dart';
import '../../domain/models.dart';
import '../../../../shared/widgets/metric_card.dart';

class ZoneAnalyticsCard extends StatelessWidget {
  const ZoneAnalyticsCard({
    super.key,
    required this.zone,
  });

  final ZoneSummary zone;

  @override
  Widget build(BuildContext context) {
    final analytics = zone.analytics;
    final totals = analytics?.bookingTotals ?? {};
    final activeTotal = (totals['awaiting_assignment'] ?? 0) + (totals['scheduled'] ?? 0) + (totals['in_progress'] ?? 0);
    final completedTotal = totals['completed'] ?? 0;
    final slaBreaches = analytics?.slaBreaches ?? 0;
    final acceptance = analytics?.averageAcceptanceMinutes;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1C62F0), Color(0xFF3B8DFF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            zone.name,
            style: GoogleFonts.manrope(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Demand: ${zone.demandLevel.toUpperCase()}',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.white.withOpacity(0.72),
            ),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              SizedBox(
                width: 160,
                child: MetricCard(
                  label: 'Active bookings',
                  value: activeTotal.toString(),
                  background: Colors.white.withOpacity(0.16),
                  icon: Icons.timelapse,
                ),
              ),
              SizedBox(
                width: 160,
                child: MetricCard(
                  label: 'Completed',
                  value: completedTotal.toString(),
                  background: Colors.white.withOpacity(0.16),
                  icon: Icons.task_alt,
                ),
              ),
              SizedBox(
                width: 160,
                child: MetricCard(
                  label: 'SLA breaches',
                  value: slaBreaches.toString(),
                  background: Colors.white.withOpacity(0.16),
                  icon: Icons.report_gmailerrorred_outlined,
                ),
              ),
              SizedBox(
                width: 160,
                child: MetricCard(
                  label: 'Acceptance avg',
                  value: acceptance == null ? '—' : '${acceptance.toStringAsFixed(1)} min',
                  background: Colors.white.withOpacity(0.16),
                  icon: Icons.speed,
                ),
              ),
            ],
          ),
          if (analytics != null) ...[
            const SizedBox(height: 20),
            Text(
              'Last updated ${DateTimeFormatter.relative(analytics.capturedAt)}',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: Colors.white.withOpacity(0.7),
              ),
            ),
          ]
        ],
      ),
    );
  }
}
