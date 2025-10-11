import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/datetime_formatter.dart';
import '../../domain/booking_models.dart';

class BookingCard extends StatelessWidget {
  const BookingCard({
    super.key,
    required this.booking,
    this.onTap,
    this.onAdvanceStatus,
  });

  final BookingModel booking;
  final VoidCallback? onTap;
  final ValueChanged<String>? onAdvanceStatus;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _statusColor(theme, booking.status);
    final assignments = booking.assignments;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      clipBehavior: Clip.antiAlias,
      elevation: 1,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.18),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          booking.status.replaceAll('_', ' ').toUpperCase(),
                          style: GoogleFonts.manrope(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: statusColor,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${booking.currency} ${booking.totalAmount.toStringAsFixed(2)}',
                        style: GoogleFonts.ibmPlexMono(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Created ${DateTimeFormatter.relative(booking.createdAt)}',
                        style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                  const Spacer(),
                  if (onAdvanceStatus != null)
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert),
                      onSelected: onAdvanceStatus!,
                      itemBuilder: (context) => _statusOptions(booking.status)
                          .map(
                            (status) => PopupMenuItem<String>(
                              value: status,
                              child: Text(status.replaceAll('_', ' ')),
                            ),
                          )
                          .toList(),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Zone ${booking.zoneId.substring(0, 6)}… • ${booking.type == 'scheduled' ? 'Scheduled booking' : 'On-demand booking'}',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              if (booking.type == 'scheduled' && booking.scheduledStart != null && booking.scheduledEnd != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    '${DateTimeFormatter.full(booking.scheduledStart!)} → ${DateTimeFormatter.full(booking.scheduledEnd!)}',
                    style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                  ),
                ),
              const SizedBox(height: 12),
              _BookingMeta(meta: booking.meta),
              if (assignments.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text('Assignments', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: assignments
                      .map(
                        (assignment) => Chip(
                          avatar: const Icon(Icons.person_outline, size: 18),
                          label: Text(
                            '${assignment.providerId.substring(0, 6)}… • ${assignment.status}',
                            style: GoogleFonts.inter(fontSize: 12),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
              if (booking.bids.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text('Bids', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: booking.bids
                      .map(
                        (bid) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text(
                            '${bid.providerId.substring(0, 6)}… bid ${CurrencyFormatter.format(bid.amount, currency: bid.currency)} (${bid.status})',
                            style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _statusColor(ThemeData theme, String status) {
    switch (status) {
      case 'awaiting_assignment':
        return theme.colorScheme.primary;
      case 'scheduled':
        return const Color(0xFF2563EB);
      case 'in_progress':
        return const Color(0xFF047857);
      case 'completed':
        return const Color(0xFF16A34A);
      case 'cancelled':
        return const Color(0xFF64748B);
      case 'disputed':
        return const Color(0xFFEA580C);
      default:
        return theme.colorScheme.primary;
    }
  }

  Iterable<String> _statusOptions(String status) {
    switch (status) {
      case 'awaiting_assignment':
        return const ['scheduled', 'in_progress', 'cancelled'];
      case 'scheduled':
        return const ['in_progress', 'cancelled'];
      case 'in_progress':
        return const ['completed', 'disputed'];
      case 'disputed':
        return const ['in_progress'];
      default:
        return const [];
    }
  }
}

class _BookingMeta extends StatelessWidget {
  const _BookingMeta({required this.meta});

  final Map<String, dynamic> meta;

  @override
  Widget build(BuildContext context) {
    if (meta.isEmpty) {
      return const SizedBox.shrink();
    }
    final entries = meta.entries.take(4);
    return Wrap(
      spacing: 12,
      runSpacing: 8,
      children: entries
          .map(
            (entry) => Chip(
              backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
              label: Text('${entry.key}: ${entry.value}', style: GoogleFonts.inter(fontSize: 12)),
            ),
          )
          .toList(),
    );
  }
}
