import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../application/calendar_controller.dart';
import '../domain/calendar_models.dart';
import 'widgets/calendar_event_form.dart';
import 'widgets/calendar_insights.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(calendarControllerProvider);
    final controller = ref.read(calendarControllerProvider.notifier);
    final theme = Theme.of(context);
    final monthFormatter = DateFormat('MMMM yyyy');
    final selectedFormatter = DateFormat('EEEE d MMMM');
    final selectedDate = state.selectedDate ?? DateTime.now();
    final events = state.eventsForSelectedDate();

    return RefreshIndicator(
      onRefresh: () => controller.loadEvents(bypassCache: true),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 120),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Command calendar',
                        style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      'Orchestrate field visits, mobilisation cadences and compliance follow-ups.',
                      style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              FilledButton.icon(
                onPressed: () => _openEventForm(context, controller.createDraft()),
                icon: const Icon(Icons.add_circle_outline),
                label: const Text('New event'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (state.offline)
            _StatusBanner(
              icon: Icons.wifi_off_rounded,
              background: theme.colorScheme.secondaryContainer,
              foreground: theme.colorScheme.onSecondaryContainer,
              message:
                  'Working from cached assignments. Updates will sync automatically once connectivity stabilises.',
            ),
          if (state.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _StatusBanner(
                icon: Icons.error_outline,
                background: theme.colorScheme.errorContainer,
                foreground: theme.colorScheme.onErrorContainer,
                message: state.errorMessage!,
                action: TextButton(
                  onPressed: () => controller.loadEvents(bypassCache: true),
                  child: const Text('Retry'),
                ),
              ),
            ),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Column(
                children: [
                  Row(
                    children: [
                      IconButton(
                        onPressed: controller.previousMonth,
                        icon: const Icon(Icons.chevron_left),
                      ),
                      Expanded(
                        child: Center(
                          child: Text(
                            monthFormatter.format(state.focusMonth),
                            style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: controller.nextMonth,
                        icon: const Icon(Icons.chevron_right),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _CalendarMonthGrid(
                    focusMonth: state.focusMonth,
                    selectedDate: selectedDate,
                    events: state.events,
                    onSelect: controller.selectDate,
                  ),
                  const SizedBox(height: 12),
                  if (state.lastRefreshed != null)
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        'Last synced ${DateFormat.yMMMd().add_jm().format(state.lastRefreshed!.toLocal())}',
                        style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          CalendarInsights(state: state),
          const SizedBox(height: 24),
          Text(
            selectedFormatter.format(selectedDate),
            style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          if (events.isEmpty)
            _EmptyEventsState(
              onCreate: () => _openEventForm(context, controller.createDraft(forDate: selectedDate)),
            )
          else
            Column(
              children: events
                  .map(
                    (event) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _EventTile(
                        event: event,
                        onEdit: () => _openEventForm(context, event),
                        onDelete: () => _confirmDelete(context, event),
                      ),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }

  Future<void> _openEventForm(BuildContext context, CalendarEvent event) async {
    final controller = ref.read(calendarControllerProvider.notifier);
    final result = await showModalBottomSheet<CalendarEvent>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      builder: (context) => CalendarEventForm(initialEvent: event),
    );
    if (result != null) {
      await controller.saveEvent(result);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Event saved for ${DateFormat.yMMMd().add_jm().format(result.start)}')),
        );
      }
    }
  }

  Future<void> _confirmDelete(BuildContext context, CalendarEvent event) async {
    final controller = ref.read(calendarControllerProvider.notifier);
    final theme = Theme.of(context);
    final formatter = DateFormat('EEE d MMM, HH:mm');
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Cancel ${event.title}?'),
        content: Text(
          'This will remove the session scheduled for ${formatter.format(event.start)}.',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Keep event')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: theme.colorScheme.error),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Cancel event'),
          )
        ],
      ),
    );
    if (shouldDelete == true) {
      await controller.deleteEvent(event.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${event.title} removed from calendar.')),
        );
      }
    }
  }
}

class _CalendarMonthGrid extends StatelessWidget {
  const _CalendarMonthGrid({
    required this.focusMonth,
    required this.selectedDate,
    required this.events,
    required this.onSelect,
  });

  final DateTime focusMonth;
  final DateTime selectedDate;
  final List<CalendarEvent> events;
  final ValueChanged<DateTime> onSelect;

  @override
  Widget build(BuildContext context) {
    final firstDay = DateTime(focusMonth.year, focusMonth.month, 1);
    final daysInMonth = DateUtils.getDaysInMonth(focusMonth.year, focusMonth.month);
    final startWeekday = firstDay.weekday % 7;
    final totalCells = startWeekday + daysInMonth;
    final rows = ((totalCells) / 7).ceil();
    final cells = rows * 7;
    final theme = Theme.of(context);

    return Column(
      children: [
        Row(
          children: List.generate(
            7,
            (index) => Expanded(
              child: Center(
                child: Text(
                  DateFormat.E().format(DateTime(2024, 1, index + 1)).substring(0, 2),
                  style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: cells,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
          ),
          itemBuilder: (context, index) {
            final dayNumber = index - startWeekday + 1;
            if (dayNumber < 1 || dayNumber > daysInMonth) {
              return const SizedBox();
            }
            final day = DateTime(focusMonth.year, focusMonth.month, dayNumber);
            final isToday = DateUtils.isSameDay(day, DateTime.now());
            final isSelected = DateUtils.isSameDay(day, selectedDate);
            final dayEvents = events
                .where((event) => event.start.year == day.year &&
                    event.start.month == day.month &&
                    event.start.day == day.day)
                .toList();

            return GestureDetector(
              onTap: () => onSelect(day),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected
                      ? theme.colorScheme.primary
                      : isToday
                          ? theme.colorScheme.primary.withOpacity(0.1)
                          : theme.colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$dayNumber',
                      style: GoogleFonts.manrope(
                        fontWeight: FontWeight.w700,
                        color: isSelected
                            ? theme.colorScheme.onPrimary
                            : theme.colorScheme.onSurface,
                      ),
                    ),
                    const Spacer(),
                    Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: dayEvents
                          .take(3)
                          .map(
                            (event) => Container(
                              height: 4,
                              width: 28,
                              decoration: BoxDecoration(
                                color: _statusColor(theme, event.status),
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    if (dayEvents.length > 3)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          '+${dayEvents.length - 3}',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: isSelected
                                ? theme.colorScheme.onPrimary
                                : theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Color _statusColor(ThemeData theme, CalendarEventStatus status) {
    switch (status) {
      case CalendarEventStatus.scheduled:
        return theme.colorScheme.primary.withOpacity(0.6);
      case CalendarEventStatus.confirmed:
        return theme.colorScheme.secondary;
      case CalendarEventStatus.completed:
        return theme.colorScheme.tertiary;
      case CalendarEventStatus.cancelled:
        return theme.colorScheme.error;
    }
  }
}

class _EventTile extends StatelessWidget {
  const _EventTile({required this.event, required this.onEdit, required this.onDelete});

  final CalendarEvent event;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final timeRange = '${DateFormat.Hm().format(event.start)} – ${DateFormat.Hm().format(event.end)}';

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: InkWell(
        onTap: onEdit,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      image: event.coverImageUrl != null
                          ? DecorationImage(
                              image: NetworkImage(event.coverImageUrl!),
                              fit: BoxFit.cover,
                            )
                          : null,
                      color: theme.colorScheme.primary.withOpacity(0.08),
                    ),
                    child: event.coverImageUrl == null
                        ? Icon(Icons.event_available_outlined, color: theme.colorScheme.primary)
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(event.title,
                            style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(event.description,
                            style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            _InfoPill(icon: Icons.access_time_rounded, label: timeRange),
                            _InfoPill(icon: Icons.place_outlined, label: event.location),
                            if (event.meetingLink != null)
                              _InfoPill(icon: Icons.videocam_outlined, label: 'VC link ready'),
                            _InfoPill(icon: Icons.event_available, label: event.status.label),
                          ],
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      switch (value) {
                        case 'edit':
                          onEdit();
                          break;
                        case 'delete':
                          onDelete();
                          break;
                      }
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(value: 'edit', child: Text('Edit event')),
                      PopupMenuItem(value: 'delete', child: Text('Cancel event')),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: event.attendees
                    .map(
                      (attendee) => Chip(
                        avatar: const Icon(Icons.person_outline, size: 16),
                        label: Text(attendee, style: GoogleFonts.inter(fontSize: 12)),
                      ),
                    )
                    .toList(),
              ),
              if (event.notes != null && event.notes!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(event.notes!, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: theme.colorScheme.surfaceVariant,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.primary),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _EmptyEventsState extends StatelessWidget {
  const _EmptyEventsState({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: theme.colorScheme.surfaceVariant,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('No engagements yet',
              style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(
            'Use the button below to plan a mobilisation call, on-site visit or evidence collection window.',
            style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: onCreate,
            icon: const Icon(Icons.add_outlined),
            label: const Text('Schedule engagement'),
          ),
        ],
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.background,
    required this.foreground,
    required this.message,
    this.action,
  });

  final IconData icon;
  final Color background;
  final Color foreground;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(fontSize: 13, color: foreground),
            ),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}
