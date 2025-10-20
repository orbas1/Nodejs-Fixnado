import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../application/calendar_controller.dart';
import '../../domain/calendar_models.dart';

class CalendarInsights extends StatelessWidget {
  const CalendarInsights({required this.state, super.key});

  final CalendarViewState state;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final monthEvents = state.events
        .where((event) => event.start.year == state.focusMonth.year && event.start.month == state.focusMonth.month)
        .toList();
    final upcoming = state.events.where((event) => event.start.isAfter(now)).toList()..sort((a, b) => a.start.compareTo(b.start));
    final completed = monthEvents.where((event) => event.status == CalendarEventStatus.completed).length;
    final cancelled = monthEvents.where((event) => event.status == CalendarEventStatus.cancelled).length;
    final confirmed = monthEvents.where((event) => event.status == CalendarEventStatus.confirmed).length;
    final total = monthEvents.length;
    final completionRate = total == 0 ? 0 : (completed / total * 100).round();
    final cancellationRate = total == 0 ? 0 : (cancelled / total * 100).round();
    final confirmationRate = total == 0 ? 0 : (confirmed / total * 100).round();

    final upcomingEvent = upcoming.isNotEmpty ? upcoming.first : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Operational pulse', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        GridView(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.25,
          ),
          children: [
            _InsightTile(
              title: 'Month volume',
              headline: '$total',
              description: 'Engagements scheduled for ${DateFormat.MMMM().format(state.focusMonth)}.',
              icon: Icons.calendar_month_outlined,
              color: theme.colorScheme.primary,
            ),
            _InsightTile(
              title: 'Completion rate',
              headline: '$completionRate%',
              description: 'Mobilisations delivered as planned.',
              icon: Icons.task_alt_outlined,
              color: theme.colorScheme.secondary,
            ),
            _InsightTile(
              title: 'Confirmed hand-offs',
              headline: '$confirmationRate%',
              description: 'Events with logistics confirmed by command centre.',
              icon: Icons.verified_outlined,
              color: theme.colorScheme.tertiary,
            ),
            _InsightTile(
              title: 'Cancellations',
              headline: '$cancellationRate%',
              description: 'Share of events cancelled this month.',
              icon: Icons.cancel_schedule_send_outlined,
              color: theme.colorScheme.error,
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (upcomingEvent != null)
          _UpcomingBanner(event: upcomingEvent)
        else
          _EmptyUpcomingBanner(),
      ],
    );
  }
}

class _InsightTile extends StatelessWidget {
  const _InsightTile({
    required this.title,
    required this.headline,
    required this.description,
    required this.icon,
    required this.color,
  });

  final String title;
  final String headline;
  final String description;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: color.withOpacity(0.08),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withOpacity(0.15),
            ),
            padding: const EdgeInsets.all(10),
            child: Icon(icon, color: color),
          ),
          const SizedBox(height: 16),
          Text(title, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 6),
          Text(headline, style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 8),
          Text(description, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _UpcomingBanner extends StatelessWidget {
  const _UpcomingBanner({required this.event});

  final CalendarEvent event;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formatter = DateFormat('EEEE d MMM • HH:mm');
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: theme.colorScheme.primary.withOpacity(0.08),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: theme.colorScheme.primary,
            ),
            child: Icon(Icons.play_arrow_rounded, color: theme.colorScheme.onPrimary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Next mobilisation',
                    style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 4),
                Text(event.title, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(formatter.format(event.start),
                    style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _Tag(icon: Icons.place_outlined, label: event.location),
                    _Tag(icon: Icons.group_outlined, label: '${event.attendees.length} attendees'),
                    _Tag(icon: Icons.event_available_outlined, label: event.status.label),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyUpcomingBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: theme.colorScheme.surfaceVariant,
      ),
      child: Row(
        children: [
          Icon(Icons.outgoing_mail, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'No upcoming engagements. Use "New event" to plan the next mobilisation window.',
              style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: theme.colorScheme.surfaceTint.withOpacity(0.08),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.primary),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12)),
        ],
      ),
    );
  }
}
